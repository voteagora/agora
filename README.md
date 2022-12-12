# Nouns Agora
Welcome to Nouns Agora's 

## Initial setup

Install yarn packages:
```sh
yarn install
```

Get an API key from [Alchemy](https://dashboard.alchemy.com/) to access the Ethereum mainnet.

Run:

```sh
ALCHEMY_API_KEY=<key> yarn workspace nouns-agora-backend run generate-snapshot
```

This will take around 30 minutes for the first run, subsequent runs will use the existing snapshot as a base and should be much faster.

## running

```sh
$ yarn run start-backend
$ yarn run start-frontend
```
