import * as WebSocket from 'ws';

import WebServer from '../http/Server';
import StreamManager from './StreamManager';


let singletonInstance = null;

class SocketServer {

  private server: any;

  constructor() {
    if (singletonInstance) {
      return singletonInstance;
    }
    singletonInstance = this;
  }

  public listen(webServer: WebServer) {
    const httpServer = webServer.httpServer;
    if (!httpServer) {
      throw Error('WebServer not listening.');
    }
    this.server = new WebSocket.Server({ server: httpServer });
    this.server.on('connection', (socket) => {
      const streamManager = new StreamManager(socket);
      streamManager.startListening();
    });
  }
}

export default SocketServer;


/* tslint:disable */
// Reading list:
// http://stackoverflow.com/questions/4361173/http-headers-in-websockets-client-api
// http://iostreamer.me/ws/node.js/jwt/2016/05/08/websockets_authentication.html
// https://www.npmjs.com/package/jsonwebtoken
// https://github.com/websockets/ws
