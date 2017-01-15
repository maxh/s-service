import * as base64url from 'base64url';
import * as crypto from 'crypto';
import * as mongoose from 'mongoose';
import * as mongooseTimestamp from 'mongoose-timestamp';


interface IDeviceToken {
  token: string;
  userId: string;
  creationTimeEpochSec: number;
  deviceName: string;
}

const _schema = new mongoose.Schema({
  token: String,
  userId: String,
  deviceName: String,
});
_schema.plugin(mongooseTimestamp);

const _model = mongoose.model('DeviceToken', _schema);

const BYTE_COUNT = 40;

const _generateToken = (byteCount) => {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(byteCount, (error, buffer) => {
      if (error) {
        reject(error);
      } else {
        resolve(base64url(buffer));
      }
    });
  });
};

class DeviceToken {
  public static create(
      userId: string,
      deviceName: string): Promise<DeviceToken> {
    // TODO(max): Only allow one DeviceToken per (user, deviceName) pair?
    return _generateToken(BYTE_COUNT).then(token => {
      return _model.create({
        userId: userId,
        deviceName: deviceName,
        token: token,
      });
    }).then(doc => {
      return new DeviceToken(doc);
    });
  }

  private _document: IDeviceToken & mongoose.Document;

  constructor(document) {
    this._document = document;
  }

  get token(): string {
    return this._document.token;
  }
}

export default DeviceToken;


/* tslint:disable */
// Reading list:
// http://stackoverflow.com/questions/26739167/jwt-json-web-token-automatic-prolongation-of-expiration
// http://stackoverflow.com/questions/11357176/do-oauth2-access-tokens-for-a-mobile-app-have-to-expire
// https://github.com/jaredhanson/passport-http-bearer
// https://rwlive.wordpress.com/2014/05/26/oauth2-authorization-grant-flow-using-oauth2orize-express-4-and-mongojs/
// https://scotch.io/tutorials/authenticate-a-node-js-api-with-json-web-tokens
