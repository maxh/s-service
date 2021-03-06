# scout-service

A client-agnostic backend service for Scout.

## Concepts

A `lesson` maps an `utterance` to an `answer`.
A `transcript` is the text we get back from the Google Speech Recognition API.
A `teacher` is what you use to create a `lesson`.
`teachers` are grouped into `teacherSets` based on semantics and permissions.

## Production

```
git remote add prod https://git.heroku.com/scout-service.git
git push prod master
```

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

To avoid copy/pasting inspector links:

[nodejs-v8-inspector Chrome Extension](https://chrome.google.com/webstore/detail/nodejs-v8-inspector/lfnddfpljnhbneopljflpombpnkfhggl?hl=en)

### api.ai webhook testing

Edit `scripts/query-hook.js` to use the user id of the user you want to test with:

```
npm run query-repl
```

Then in the repl:

```
getAnswer('what is the lab protocol for recovering frozen cells')
```

## Implementation notes

For absolute imports TypeScript, requires an [unusual approach](http://www.jbrantly.com/es6-modules-with-typescript-and-webpack/):

```js
import someLib from 'someLib'; // this will throw an error
import * as someLib from 'someLib'; // this will work
```
