import * as mongoose from 'mongoose';

import WebServer from './http/Server';
import SocketServer from './ws/Server';

import settings from './settings';


const connectMongo = () => {
  // Use native Promises instead of mpromise, mongoose's default.
  (mongoose as any).Promise = global.Promise;
  return mongoose.connect(settings.mongo.url);
};

const startServers = () => {
  const webServer = new WebServer();
  const socketServer = new SocketServer();
  webServer.listen(settings.port).then(() => {
    socketServer.listen(webServer);
    console.log('scout-service listening on: ' + settings.port);
  });
};

// Start up!
connectMongo().then(startServers).catch(error => {
  console.error('Unable to boot server.');
  console.error(error);
  process.exit(1);
});
