# scout-service

A client-agnostic backend service for Scout.

## Setup

Run mongo if you haven't already:
```sh
mongod
```

To create an initial build and start a server:
```sh
npm run start-dev
```

In another terminal, build the binary after changing files. The server picks
up changes automatically:
```sh
npm run build
```

Hot module reloading doesn't work with TypeScript, best I can tell. You can
use this to avoid copy/pasting inspector links:

[nodejs-v8-inspector Chrome Extension](https://chrome.google.com/webstore/detail/nodejs-v8-inspector/lfnddfpljnhbneopljflpombpnkfhggl?hl=en)
