import * as base64url from 'base64url';
import * as crypto from 'crypto';
import * as mongoose from 'mongoose';
import * as mongooseTimestamp from 'mongoose-timestamp';


interface IDeviceToken {
  token: string;
  userId: string;
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
  public static createOrReplace(
      userId: string,
      deviceName: string): Promise<DeviceToken> {
    const deleteExistingPromise = _model.findOne({userId, deviceName})
      .then(existingDoc => {
        if (existingDoc) {
          return existingDoc.remove();
        }
      });

    const tokenPromise = _generateToken(BYTE_COUNT);

    return Promise.all([tokenPromise, deleteExistingPromise]).then(values => {
      const token = values[0];
      return _model.create({
        userId,
        deviceName,
        token,
      } as IDeviceToken);
    }).then(doc => {
      return new DeviceToken(doc);
    });
  }

  public static verify(token: string): Promise<string> {
    return DeviceToken.getByToken(token).then(deviceToken => {
      return deviceToken.userId;
    });
  }

  public static getByToken(token: string): Promise<DeviceToken> {
    return _model.findOne({token: token}).then(doc => {
      if (!doc) {
        throw Error('Invalid token.');
      }
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

  get userId(): string {
    return this._document.userId;
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
