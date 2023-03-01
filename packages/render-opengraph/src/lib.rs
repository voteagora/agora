mod nouns;
mod text;

use graphql_client::GraphQLQuery;

use crate::nouns::NounSeed;
use anyhow::{Error, Result};
use euclid::{Transform2D, Vector2D};
use fontdue::layout::{
    CoordinateSystem, HorizontalAlign, Layout, LayoutSettings, TextStyle, WrapStyle,
};
use fontdue::Font;
use png::BitDepth;
use raqote::{Color, SolidSource};
use raqote::{DrawOptions, DrawTarget, PathBuilder, Source};
use std::f32::consts::PI;
use std::io;
use wasm_bindgen::prelude::*;

pub use crate::nouns::ImageDataContainer;
use crate::text::{draw_text_layout, largest_text_layout_fitting};

#[wasm_bindgen]
pub struct DrawDependencies {
    images: ImageDataContainer,

    inter_medium: Font,
    inter_black: Font,
    dejavu_sans_bold: Font,
}

impl DrawDependencies {
    pub fn create_inner(
        images_string: &str,
        inter_medium_bytes: &[u8],
        inter_black_bytes: &[u8],
        dejavu_sans_bold_bytes: &[u8],
    ) -> Result<DrawDependencies> {
        let images = serde_json::from_str::<ImageDataContainer>(&images_string)?;

        let inter_medium = Font::from_bytes(inter_medium_bytes, fontdue::FontSettings::default())
            .map_err(Error::msg)?;

        let inter_black = Font::from_bytes(inter_black_bytes, fontdue::FontSettings::default())
            .map_err(Error::msg)?;

        let dejavu_sans_bold =
            Font::from_bytes(dejavu_sans_bold_bytes, fontdue::FontSettings::default())
                .map_err(Error::msg)?;

        Ok(DrawDependencies {
            images,
            inter_black,
            inter_medium,
            dejavu_sans_bold,
        })
    }
}

#[wasm_bindgen]
impl DrawDependencies {
    pub fn create(
        images_string: &str,
        inter_medium_bytes: &[u8],
        inter_black_bytes: &[u8],
        dejavu_sans_bold_bytes: &[u8],
    ) -> Result<DrawDependencies, String> {
        Ok(DrawDependencies::create_inner(
            images_string,
            inter_medium_bytes,
            inter_black_bytes,
            dejavu_sans_bold_bytes,
        )
        .map_err(|e| e.to_string())?)
    }

    pub fn draw_image(&self, data_string: &str) -> Result<Option<Vec<u8>>, String> {
        (|| -> Result<Option<Vec<u8>>> {
            let response_data =
                serde_json::from_str::<open_graph_render_query::ResponseData>(&data_string)?;
            Ok(draw_opengraph_image_inner(&self, response_data)?)
        })()
        .map_err(|e| e.to_string())
    }
}

type BigInt = String;

#[derive(GraphQLQuery)]
#[graphql(
    schema_path = "../frontend/schema.graphql",
    query_path = "src/OpenGraphRenderQuery.graphql"
)]
pub struct OpenGraphRenderQuery {}

pub fn draw_opengraph_image_inner(
    dependencies: &DrawDependencies,
    data: open_graph_render_query::ResponseData,
) -> Result<Option<Vec<u8>>> {
    let width = 420f32;
    let height = 220f32;
    let scale = 4.0f32;

    let base_grid = 8f32;
    let gap = base_grid * 3f32;

    let content_width = width - gap * 3f32;
    let max_text_width = content_width * (4f32 / 10f32);

    let delegate = data.delegate;

    let address_text_fonts = [&dependencies.inter_black, &dependencies.dejavu_sans_bold];

    let mut address_text_layout = largest_text_layout_fitting(
        max_text_width * scale,
        &display_text(&delegate.address.resolved_name),
        (14f32 * scale) as u32,
        (10f32 * scale) as u32,
        &address_text_fonts[..],
    );

    let mut title_text_layout = Layout::new(CoordinateSystem::PositiveYDown);
    title_text_layout.reset(&LayoutSettings {
        x: 0.0,
        y: 0.0,
        max_width: Some(max_text_width * scale),
        max_height: None,
        horizontal_align: HorizontalAlign::Left,
        wrap_style: WrapStyle::Word,
        ..LayoutSettings::default()
    });
    title_text_layout.append(
        &[&dependencies.inter_medium],
        &TextStyle::new("Nouns DAO delegate on Agora", 7.0f32 * scale, 0),
    );

    let mut dt = DrawTarget::new((width * scale) as i32, (height * scale) as i32);

    // fill background
    dt.fill_rect(
        0f32,
        0f32,
        width * scale,
        height * scale,
        &Source::Solid(SolidSource {
            a: 255,
            r: 255,
            g: 255,
            b: 255,
        }),
        &DrawOptions::default(),
    );

    let offset_x = gap * scale;
    let spacing = 0.25 * base_grid;
    let y = (height * scale / 2f32)
        - ((address_text_layout.height() + 2.0 * spacing * scale + title_text_layout.height())
            / 2f32);

    let transform = Transform2D::translation(offset_x, y);
    dt.set_transform(&transform);

    draw_text_layout(
        &mut dt,
        max_text_width * scale,
        &mut title_text_layout,
        &[&dependencies.inter_medium],
        Color::new(0, 102, 103, 107),
    );

    dt.set_transform(&transform.then_translate(Vector2D::new(
        0.0,
        title_text_layout.height() + spacing * scale,
    )));

    draw_text_layout(
        &mut dt,
        max_text_width * scale,
        &mut address_text_layout,
        &address_text_fonts,
        Color::new(0, 0, 0, 0),
    );

    dt.set_transform(&Transform2D::identity());

    let nouns = delegate
        .nouns_represented;

    let nouns_container_max_width = content_width - max_text_width;
    let nouns_container_max_height = height - gap - gap;

    let noun_size = (nouns_container_max_width / nouns.len() as f32 / 1.5).max(4f32 * base_grid);

    let columns = nouns.len().min(5) as usize;
    let rows = ((nouns.len() as f32 / columns as f32).ceil() as usize)
        .max(1)
        .min(6);

    let nouns_container_intrinsic_width =
        (columns as f32 * noun_size) + base_grid * (columns - 1) as f32;
    let nouns_container_intrinsic_height =
        (rows as f32 * noun_size) + base_grid * (rows - 1) as f32;

    dt.set_transform(&Transform2D::scale(scale, scale));

    // dt.fill_rect(
    //     gap + max_text_width + gap,
    //     gap,
    //     nouns_container_max_width,
    //     nouns_container_max_height,
    //     &Source::Solid(SolidSource {
    //         r: 255,
    //         g: 0,
    //         b: 0,
    //         a: 255,
    //     }),
    //     &DrawOptions::default(),
    // );

    let nouns_container_offset_x =
        (nouns_container_max_width - nouns_container_intrinsic_width) / 2f32;
    let nouns_container_offset_y =
        (nouns_container_max_height - nouns_container_intrinsic_height) / 2f32;

    let root_transform = Transform2D::scale(scale, scale).pre_translate(Vector2D::new(
        (gap + max_text_width + gap) + nouns_container_offset_x,
        (gap) + nouns_container_offset_y,
    ));

    dt.set_transform(&root_transform);

    // dt.fill_rect(
    //     0.0,
    //     0.0,
    //     nouns_container_intrinsic_width,
    //     nouns_container_intrinsic_height,
    //     &Source::Solid(SolidSource {
    //         r: 0,
    //         g: 255,
    //         b: 0,
    //         a: 255,
    //     }),
    //     &DrawOptions::default(),
    // );

    for (index, noun) in nouns.iter().enumerate().take(rows * columns) {
        let column = index % columns;
        let row = index / columns;


        let scale_factor = noun_size / 32.0;
        dt.set_transform(
            &root_transform
                .pre_translate(Vector2D::new(
                    column as f32 * (noun_size + base_grid),
                    row as f32 * (noun_size + base_grid),
                ))
                .pre_scale(noun_size / 32.0, noun_size / 32.0),
        );

        let mut path_builder = PathBuilder::new();

        path_builder.arc(
            noun_size / 2.0 / scale_factor,
            noun_size / 2.0 / scale_factor,
            noun_size / 2.0 / scale_factor,
            0.0,
            2.0 * PI,
        );

        let path = path_builder.finish();
        dt.push_clip(&path);
        dependencies.images.draw_noun(&mut dt, &noun.try_into()?);

        dt.pop_clip();
    }

    let mut output = Vec::new();
    write_png(dt, &mut output)?;

    Ok(Some(output))
}

impl TryFrom<&open_graph_render_query::OpenGraphRenderQueryDelegateNounsRepresented> for NounSeed {
    type Error = Error;

    fn try_from(value: &open_graph_render_query::OpenGraphRenderQueryDelegateNounsRepresented) -> Result<NounSeed> {
                    Ok(NounSeed {
                background: value.background as u8,
                body: value.body as u8,
                accessory: value.accessory as u8,
                head: value.head as u8,
                glasses: value.glasses as u8,
            })
    }
}

fn display_text(name: &open_graph_render_query::OpenGraphRenderQueryDelegateAddressResolvedName) -> String {
    name.name
        .as_ref()
        .map(|str| str.to_string())
        .unwrap_or_else(|| short_address(&name.address))
}

fn short_address(address: &str) -> String {
    format!("{}...{}", &address[0..4], &address[38..(38 + 4)])
}

fn write_png<W: io::Write>(draw_target: DrawTarget, output_writer: W) -> Result<()> {
    let mut encoder = png::Encoder::new(
        output_writer,
        draw_target.width() as u32,
        draw_target.height() as u32,
    );
    encoder.set_color(png::ColorType::Rgba);
    encoder.set_depth(BitDepth::Eight);

    let mut writer = encoder.write_header()?;

    writer.write_image_data(
        &draw_target
            .get_data_u8()
            .chunks_exact(4)
            .flat_map(|chunk| {
                let b = chunk[0];
                let g = chunk[1];
                let r = chunk[2];
                let a = chunk[3];

                [r, g, b, a]
            })
            .collect::<Vec<u8>>(),
    )?;

    writer.finish()?;

    Ok(())
}
