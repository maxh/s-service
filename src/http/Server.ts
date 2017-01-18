import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as http from 'http';
import * as morgan from 'morgan';

import * as middleware from './infra/middleware';

import answers from './routes/answers';
import auth from './routes/auth';
import context from './routes/context';
import lessons from './routes/lessons';


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

    // All scout-service requests are JSON, both inbound and outbound.
    this.handler.use(bodyParser.json());
    this.handler.use(middleware.forceHttpsUnlessDev);

    // Register auth endpoints, only some of which require a token header.
    this.handler.use('/auth', auth);

    // Create the API, on which all endpoints require a token header.
    const api = express.Router();
    api.use(middleware.requireAuthHeader);
    api.use('/answers', answers);
    api.use('/context', context);
    api.use('/lessons', lessons);

    // Register API endpoints.
    this.handler.use('/api', api);
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
