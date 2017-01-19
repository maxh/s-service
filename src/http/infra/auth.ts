import * as jwt from 'jsonwebtoken';

import settings from '../../settings';

import DeviceToken from '../models/DeviceToken';


const JWT_EXPIRES_IN_SECONDS = 60 * 60 * 5;

export const getUserIdFromJwtPromise = (token) => {
  const decodedPromise = new Promise((resolve, reject) => {
    jwt.verify(token, settings.auth.keys.jwtSecret, (error, decoded) => {
      if (error) {
        reject(error);
      } else {
        resolve(decoded);
      }
    });
  });

  return decodedPromise.then((decoded: any) => decoded.userId);
};

export const generateJwt = (userId) => {
  return jwt.sign({ userId }, settings.auth.keys.jwtSecret, {
    expiresIn: JWT_EXPIRES_IN_SECONDS
  });
};


export interface ITokenHeader {
  appId: string;
  tokenType: string;
  tokenString: string;
}

const parseTokenHeader = (header: string): Promise<ITokenHeader> => {
  // Valid headers look like 'scout devicetoken foobar123' or 'scout jwt foobar123'.
  return new Promise((resolve, reject) => {
    try {
      const parts = header.split(' ');
      const [appId, tokenType, tokenString] = parts;
      resolve({
        appId: appId.toLowerCase(),
        tokenType: tokenType.toLowerCase(),
        tokenString
      });
    } catch (e) {
      reject(e);
    }
  });
};

export const getUserIdFromAuthHeader = (header) => {
  return parseTokenHeader(header).then(parsed => {
    const { appId, tokenType, tokenString } = parsed;
    if (appId === 'scout') {
      if (tokenType === 'devicetoken') {
        return DeviceToken.verify(tokenString);
      }
      if (tokenType === 'jwt') {
        return getUserIdFromJwtPromise(tokenString);
      }
    }
    throw Error('Invalid token.');
  });
};
