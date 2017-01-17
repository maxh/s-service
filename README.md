# scout-service

A client-agnostic backend service for Scout.

## Concepts

A `lesson` maps an `utterance` to an `answer`.
A `transcript` is the text we get back from the Google Speech Recognition API.
A `teacher` is what you use to create a `lesson`.
`teachers` are grouped into `teacherSets` based on semantics and permissions.

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
