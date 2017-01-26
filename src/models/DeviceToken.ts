import * as base64url from 'base64-url';
import * as crypto from 'crypto';
import * as mongoose from 'mongoose';
import * as mongooseTimestamp from 'mongoose-timestamp';


interface IDeviceToken {
  id?: string;
  token: string;
  userId: string;
  deviceName: string;
}

const schema = new mongoose.Schema({
  token: String,
  userId: String,
  deviceName: String,
});
schema.plugin(mongooseTimestamp);

const model = mongoose.model('DeviceToken', schema);

const BYTE_COUNT = 40;

const generateToken = (byteCount) => {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(byteCount, (error, buffer) => {
      if (error) {
        reject(error);
      } else {
        resolve(base64url.encode(buffer));
      }
    });
  });
};


class DeviceToken {
  public static createOrReplace(
      userId: string,
      deviceName: string): Promise<DeviceToken> {
    const deleteExistingPromise = model.findOne({ userId, deviceName })
      .then(existingDoc => {
        if (existingDoc) {
          return existingDoc.remove();
        }
      });

    const tokenPromise = generateToken(BYTE_COUNT);

    return Promise.all([tokenPromise, deleteExistingPromise]).then(values => {
      const token = values[0];
      return model.create({
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
    return model.findOne({ token }).then(doc => {
      if (!doc) {
        throw Error('Invalid token.');
      }
      return new DeviceToken(doc);
    });
  }

  private document: IDeviceToken & mongoose.Document;

  constructor(document) {
    this.document = document;
  }

  get token(): string {
    return this.document.token;
  }

  get userId(): string {
    return this.document.userId;
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
