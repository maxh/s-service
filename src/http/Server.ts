import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as http from 'http';
import * as morgan from 'morgan';

import * as middleware from './infra/middleware';

import auth from './routes/auth';
import lessons from './routes/lessons';


let _singletonInstance = null;

class WebServer {

  private _handler: any;
  private _server: any;

  constructor() {
    if (_singletonInstance) {
      return _singletonInstance;
    }
    _singletonInstance = this;

    this._handler = express();

    // Log all requests.
    this._handler.use(morgan('combined'));

    // All scout-service requests are JSON, both inbound and outbound.
    this._handler.use(bodyParser.json());
    this._handler.use(middleware.forceHttpsUnlessDev);

    // Register auth endpoints, only some of which require a token header.
    this._handler.use('/auth', auth);

    // Create the API, on which all endpoints require a token header.
    const api = express.Router();
    api.use(middleware.requireAuthHeader);
    api.use('/lessons', lessons);

    // Register API endpoints.
    this._handler.use('/api', api);
  }

  public listen(port: number): Promise<undefined> {
    this._server = http.createServer(this._handler);
    return new Promise((resolve, reject) => {
      this._server.listen(port, resolve).on('error', reject);
    });
  }

  public get httpServer() {
    return this._server;
  }
}

export default WebServer;
