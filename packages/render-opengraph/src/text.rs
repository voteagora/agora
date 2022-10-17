use fontdue::layout::{
    CoordinateSystem, HorizontalAlign, Layout, LayoutSettings, TextStyle, WrapStyle,
};
use fontdue::Font;
use raqote::{AntialiasMode, BlendMode, DrawOptions, DrawTarget, SolidSource};
use raqote::{Color, Image};

pub fn draw_text_layout(
    dt: &mut DrawTarget,
    max_text_width: f32,
    layout: &mut Layout,
    fonts: &[&Font],
    color: Color,
) {
    // dt.fill_rect(
    //     0f32,
    //     0f32,
    //     max_text_width,
    //     layout.height(),
    //     &Source::Solid(SolidSource {
    //         r: 255,
    //         g: 0,
    //         b: 0,
    //         a: 255,
    //     }),
    //     &DrawOptions::default(),
    // );

    layout.glyphs().iter().for_each(|glyph| {
        let font = &fonts[glyph.font_index];
        let (_metrics, bitmap) = font.rasterize_config(glyph.key);

        let data = bitmap
            .into_iter()
            .map(|value| {
                SolidSource::from_unpremultiplied_argb(value, color.r(), color.g(), color.b())
                    .to_u32()
            })
            .collect::<Vec<u32>>();

        dt.draw_image_at(
            glyph.x,
            glyph.y,
            &Image {
                width: glyph.width as i32,
                height: glyph.height as i32,
                data: &data,
            },
            &DrawOptions {
                blend_mode: BlendMode::SrcOver,
                antialias: AntialiasMode::Gray,
                alpha: 1.0,
            },
        );
    });
}

pub fn largest_text_layout_fitting(
    max_width: f32,
    text: &str,
    max_font_size: u32,
    min_font_size: u32,
    fonts: &[&Font],
) -> Layout {
    let mut layout = Layout::new(CoordinateSystem::PositiveYDown);

    layout.reset(&LayoutSettings {
        x: 0.0,
        y: 0.0,
        max_width: Some(max_width),
        max_height: None,
        horizontal_align: HorizontalAlign::Left,
        wrap_style: WrapStyle::Letter,
        ..LayoutSettings::default()
    });

    for font_size in (min_font_size..=(max_font_size)).rev() {
        for char in text.chars() {
            for (font_idx, font) in fonts.iter().enumerate() {
                let glyph_index = font.lookup_glyph_index(char);
                if glyph_index != 0 {
                    layout.append(
                        fonts,
                        &TextStyle::new(&char.to_string(), font_size as f32, font_idx),
                    );
                    break;
                }
            }
        }

        if layout.lines().map(|lines| lines.len()).unwrap_or(0) == 1 {
            break;
        } else {
            layout.clear()
        }
    }

    layout
}
