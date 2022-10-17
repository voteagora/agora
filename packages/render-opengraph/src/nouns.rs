use raqote::{DrawOptions, DrawTarget, SolidSource, Source};
use serde::Deserializer;
use serde_derive::Deserialize;

#[derive(Deserialize)]
pub struct ImageDataContainer {
    bgcolors: Vec<Color>,
    palette: Vec<Color>,
    images: Images,
}

pub struct NounSeed {
    pub background: u8,
    pub body: u8,
    pub head: u8,
    pub accessory: u8,
    pub glasses: u8,
}

impl ImageDataContainer {
    pub fn draw_noun(&self, filler: &mut DrawTarget, seed: &NounSeed) {
        if let Some([r, b, g]) = self
            .bgcolors
            .get(seed.background as usize)
            .and_then(|color| color.0)
        {
            filler.fill_rect(
                0f32,
                0f32,
                32f32,
                32f32,
                &Source::Solid(SolidSource { a: 255, r, b, g }),
                &DrawOptions::default(),
            )
        }

        self.images.bodies[seed.body as usize]
            .data
            .draw_part(filler, &self.palette);

        self.images.heads[seed.head as usize]
            .data
            .draw_part(filler, &self.palette);

        self.images.accessories[seed.accessory as usize]
            .data
            .draw_part(filler, &self.palette);

        self.images.glasses[seed.glasses as usize]
            .data
            .draw_part(filler, &self.palette);
    }
}

impl ImageDataContainer {}

pub struct Color(Option<[u8; 3]>);

impl<'de> serde::Deserialize<'de> for Color {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let string_value = String::deserialize(deserializer)?;
        Ok(Color(if string_value.is_empty() {
            None
        } else {
            let mut value = [0u8; 3];
            hex::decode_to_slice(&string_value.as_bytes(), &mut value)
                .map_err(|err| serde::de::Error::custom(err.to_string()))?;

            Some(value)
        }))
    }
}

#[derive(Deserialize)]
pub struct Images {
    bodies: Vec<ImageData>,
    accessories: Vec<ImageData>,
    heads: Vec<ImageData>,
    glasses: Vec<ImageData>,
}

#[derive(Deserialize)]
pub struct ImageData {
    filename: String,
    data: DecodedImage,
}

pub struct DecodedImage {
    palette_index: u8,
    bounds: Bounds,
    rects: Vec<Rect>,
}

impl DecodedImage {
    fn draw_part(&self, draw_target: &mut DrawTarget, palette: &[Color]) {
        let width = self.bounds.width() as u32;
        let mut position = 0u32;

        for rect in &self.rects {
            let color = &palette[rect.color_index as usize];
            let mut remaining_length = rect.length as u32;

            while remaining_length > 0 {
                let x_position = position % width as u32;
                let y_position = position / width as u32;
                let distance_to_end_of_current_row = width - x_position;
                let draw_length = distance_to_end_of_current_row.min(remaining_length);

                match color.0 {
                    Some([r, g, b]) => {
                        draw_target.fill_rect(
                            (self.bounds.left as u32 + x_position as u32) as f32,
                            (self.bounds.top as u32 + y_position as u32) as f32,
                            draw_length as f32,
                            1f32,
                            &Source::Solid(SolidSource { a: 255, r, g, b }),
                            &DrawOptions::new(),
                        );
                    }
                    None => {}
                }

                remaining_length -= draw_length;
                position += draw_length;
            }
        }
    }
}

impl<'de> serde::Deserialize<'de> for DecodedImage {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let string = String::deserialize(deserializer)?;
        let decoded = hex::decode(&string[2..].as_bytes())
            .map_err(|err| serde::de::Error::custom(err.to_string()))?;

        if let [pallet_index, top, right, bottom, left, data @ ..] = &decoded[..] {
            Ok(DecodedImage {
                palette_index: *pallet_index,
                bounds: Bounds {
                    top: *top,
                    left: *left,
                    bottom: *bottom,
                    right: *right,
                },
                rects: data
                    .chunks(2)
                    .map(|chunk| {
                        if let [length, color_index] = chunk {
                            Ok(Rect {
                                color_index: *color_index,
                                length: *length,
                            })
                        } else {
                            Err(serde::de::Error::custom("chunk size incorrect"))
                        }
                    })
                    .collect::<Result<Vec<Rect>, _>>()?,
            })
        } else {
            Err(serde::de::Error::custom("decoded array incorrect length"))
        }
    }
}

pub struct Bounds {
    top: u8,
    left: u8,
    bottom: u8,
    right: u8,
}

impl Bounds {
    fn width(&self) -> u8 {
        return self.right - self.left;
    }
}

struct Rect {
    length: u8,
    color_index: u8,
}
