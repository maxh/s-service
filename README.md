# scout-service

A robust backend service for all Scout clients.

## Setup

To create an initial build and start a server:
```sh
npm run start-dev
```

In another terminal, build the binary after changing files. The server picks
up changes automatically:
```sh
npm run build
```

Hot module reloading doesn't work with TypeScript, best I can tell, so you'll
probaby want this Chrome Extension to avoid copy/pasting inspector links:

https://nim.ucraft.com
