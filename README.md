# scout-service

A robust backend service for all Scout clients.

## Setup

Terminal 1, to create an initial build and start a server:
```sh
npm run start-dev
```

Terminal 2, to build the binary after changing files. The server picks
up changes automatically:
```sh
npm run build
```


## Todo

- Get type checking working for objects passed to new MyModel().
- Figure out how to continue using the same debugger session after file changes.
