# scout-service

A backend service for all Scout clients.

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

Hot module reloading doesn't work with TypeScript, best I can tell. You can
use this to avoid copy/pasting inspector links:


[nodejs-v8-inspector Chrome Extension](https://chrome.google.com/webstore/detail/nodejs-v8-inspector/lfnddfpljnhbneopljflpombpnkfhggl?hl=en)


## Lint

```
npm run lint
```

```
npm run fix-lint
```
