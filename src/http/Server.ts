import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as http from 'http';
import * as morgan from 'morgan';

import * as middleware from './middleware';

import auth from './routes/auth';
import context from './routes/context';
import lessons from './routes/lessons';
import permissions from './routes/permissions';
import queryHook from './routes/query-hook';

let singletonInstance = null;

class WebServer {

  private handler: any;
  private server: any;

  constructor() {
    if (singletonInstance) {
      return singletonInstance;
    }
    singletonInstance = this;

    this.handler = express();

    // Log all requests.
    this.handler.use(morgan('combined'));

    this.handler.use(middleware.forceHttpsUnlessDev);
    this.handler.use(middleware.allowCrossDomain);

    this.handler.use('/static', express.static('static'));

    // All scout-service requests are JSON, both inbound and outbound.
    this.handler.use(bodyParser.json());

    // Register auth endpoints, only some of which require a token header.
    this.handler.use('/auth', auth);

    // Create the API, on which all endpoints require a token header.
    const api = express.Router();
    api.use(middleware.requireAuthHeader);
    api.use('/context', context);
    api.use('/lessons', lessons);
    api.use('/permissions', permissions);

    // Register API endpoints.
    this.handler.use('/api', api);

    this.handler.use('/query-hook', queryHook);
  }

  public listen(port: number): Promise<undefined> {
    this.server = http.createServer(this.handler);
    return new Promise((resolve, reject) => {
      this.server.listen(port, resolve).on('error', reject);
    });
  }

  public get httpServer() {
    return this.server;
  }
}

export default WebServer;
