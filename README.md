# Nouns Agora
[Agora](www.nounsagora.com) is a supercharged governance tool for Nouns, ENS, and Optimism Voters. We were originally [funded by Nouns](https://www.nounsagora.com/proposals/154), fully open source, MIT-licensed, and have all delegate statements [snapshotted here](https://docs.google.com/spreadsheets/d/1t2srMRHQ437D56OrRK3h8ZA1LJczztIebu8zpfThoE0/edit?usp=sharing) for ease of access.
More extensive documentation coming soon.
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
