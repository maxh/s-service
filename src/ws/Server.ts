import * as jwt from 'jsonwebtoken';
import * as url from 'url';
import * as WebSocket from 'ws';

import settings from '../settings';

import WebServer from '../http/Server';


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
    this.server = new WebSocket.Server({
      server: httpServer
    });
    this.server.on('connection', ws => {
      const location = url.parse(ws.upgradeReq.url, true);
      const token = location.query.jwt;

      const decodedPromise = new Promise((resolve, reject) => {
        jwt.verify(token, settings.auth.keys.jwtSecret, (error, decoded) => {
          if (error) {
            reject(error);
          } else {
            resolve(decoded);
          }
        });
      });

      decodedPromise.then((decoded: any) => {
        console.log('Connected with userId: ' + decoded.userId);
      });
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
