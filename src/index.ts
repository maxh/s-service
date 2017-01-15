import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as mongoose from 'mongoose';

import auth from './routes/auth';
import settings from './settings/index';


const app = express();


/////////////////
// Configuration.
/////////////////

// All scout-service requests are JSON, both inbound and outbount.
app.use(bodyParser.json());

// Force HTTPS.
app.use((req, res, next) => {
  if ((process.env.NODE_ENV === 'production' ||
       process.env.NODE_ENV === 'staging') &&
      req.header('x-forwarded-proto') !== 'https') {
    return res.redirect('https://' + req.header('host') + req.url);
  } else {
    return next();
  }
});

// Routes.

app.use('/auth', auth);


//////////////////
// Initialization.
//////////////////


const boot = () => {
  const startServers = () => {
    const httpServer = app.listen(settings.port, () => {
      console.log('scout-service listening on: ' + settings.port);
    });
    // binaryServer.boot(httpServer);
  };

  // Use native Promises instead of mpromise, which mongoose uses
  // by default.
  (mongoose as any).Promise = global.Promise;

  mongoose.connect(settings.urls.mongo)
      .then(startServers)
      .catch((error) => {
        console.error('Unable to connect to Mongo');
        console.error(error);
        process.exit(1);
      });
};

boot();
