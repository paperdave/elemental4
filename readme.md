# [Elemental 4](https://elemental4.net)
Elemental 4 is a fan made recreation of [Elemental 3](http://htwins.net/elem3/), built on modern web
technologies, and with a couple different features.

## Play Live Build
[Elemental4.net](https://elemental4.net)

## Development
The game is separated onto two parts: server (server folder) and client (game folder). They are
almost two separate projects, but the server is required to be running for the game to work.

Initial setup
- Install Node.JS and NPM
- Run `npm i -D`
- Run `node gen-env`
- Edit the env file, defaults are fine for development.

The default HTTP port is `:8000`

To build a production build
- Run `npm run build-server`
- Run `npm run build-client`
- Start server with `npm start`

To work on a live-reloading client
- Run `./dev.sh`, which runs build-server, start, and watch-client

Unfortunately is no live-reloading server, you have to restart it after any change.

## Design
I'll write about this in a hot minute.
