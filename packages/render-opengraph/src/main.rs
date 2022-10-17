use anyhow::Result;
use graphql_client::{GraphQLQuery, Response};
use render_opengraph::{
    draw_opengraph_image_inner, open_graph_render_query, DrawDependencies, OpenGraphRenderQuery,
};
use reqwest::Client;
use std::fs::File;
use std::io::Write;
use tokio;

#[tokio::main]
async fn main() -> Result<()> {
    let request_body = OpenGraphRenderQuery::build_query(open_graph_render_query::Variables {
        address: "noun22.⌐◨-◨".to_string(),
    });

    let client = Client::new();
    let res = client
        .post("https://nounsagora.com/graphql")
        .json(&request_body)
        .send()
        .await?;
    let response_body: Response<open_graph_render_query::ResponseData> = res.json().await?;

    let draw_dependencies = DrawDependencies::create_inner(
        include_str!("../../../node_modules/@nouns/assets/dist/image-data.json",),
        include_bytes!("../resources/Inter-Medium.otf") as &[u8],
        include_bytes!("../resources/Inter-Black.otf") as &[u8],
        include_bytes!("../resources/DejaVuSans-Bold.ttf") as &[u8],
    )?;

    let image =
        draw_opengraph_image_inner(&draw_dependencies, response_body.data.unwrap())?.unwrap();

    File::create("./test.png")?.write_all(&image)?;

    Ok(())
}
