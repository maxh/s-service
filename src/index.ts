import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as mongoose from 'mongoose';

import * as middleware from './infra/middleware';
import auth from './routes/auth';
import lessons from './routes/lessons';
import settings from './settings';


const app = express();


/////////////////
// Configuration.
/////////////////


// All scout-service requests are JSON, both inbound and outbound.
app.use(bodyParser.json());
app.use(middleware.forceHttpsUnlessDev);

// Register authentication endpoints, which don't use requireToken middleware.
app.use('/auth', auth);

// Create the API.
const api = express.Router();
api.use(middleware.requireToken);
api.use('/lessons', lessons);

// Register API endpoints.
app.use('/api', api);


//////////////////
// Initialization.
//////////////////


const connectMongo = () => {
  // Use native Promises instead of mpromise, which mongoose uses
  // by default.
  (mongoose as any).Promise = global.Promise;
  return mongoose.connect(settings.urls.mongo);
};

const startServers = () => {
  app.listen(settings.port, () => {
    console.log('scout-service listening on: ' + settings.port);
  });
  // binaryServer.boot(httpServer);
};

const boot = () => {
  connectMongo().then(startServers).catch((error) => {
    console.error('Unable to boot server.');
    console.error(error);
    process.exit(1);
  });
};

boot();
