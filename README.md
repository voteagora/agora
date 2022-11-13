<h1 align="center">nouns-agora</h1>

<p align="center">Agora lets anyone lets pitch themselves as a delegate by creating a rich media delegate profile.</p>

## Screenshots

![Home Page](/screenshots/1.png "Home Page")

## Development Setup

- Note: project currently is not supported for Windows.

- Ensure `NodeJs` is installed.

- create a `.env` file in root folder.

- Create an account on [alchemy](https://www.alchemy.com/) and place your api key in the `.env` file as such
  `ALCHEMY_API_KEY="YOUR_API_KEY"`

- Open terminal in root of project.

- Run `yarn install`

- Navigate to the backend package. (from root)`cd packages/backend`

- Run `yarn install`
- Run `yarn run generate-snapshot`

- Navigate to the frontend package. (from root)`cd packages/frontend`
- Run `yarn install`

## Running the project

Make sure to follow the development setup instructions before attempting to run the project.

- open a terminal in root of project.
  - run `yarn run start-backend`
- open a different terminal in root of project.
  - run `yarn run start-frontend`

## Troubleshooting

### Error `Expected a end of file` in file `schema.graphql` when running `yarn run start-frontend`

- Solution: remove the warnings at the top of the `schema.graphql` file.
