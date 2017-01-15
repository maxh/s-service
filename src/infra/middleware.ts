// Custom Express middleware.

import DeviceToken from '../models/DeviceToken';


interface ITokenHeader {
  appId: string;
  tokenType: string;
  tokenString: string;
}


/**
 * Parses an authorization header value.
 * @throws If unable to parse.
 */
const _parseTokenHeader = (header: string): Promise<ITokenHeader> => {
  // Valid headers look like 'Scout DeviceToken foobar123'
  // TODO(max): Add support for 'Scout JWT foobar123'
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

export const requireToken = (req, res, next) => {
  const header = req.get('authorization');
  const userIdPromise = _parseTokenHeader(header).then(parsed => {
    const {appId, tokenType, tokenString} = parsed;
    if (appId === 'scout' && tokenType === 'devicetoken') {
      return DeviceToken.verify(tokenString);
    } else {
      throw Error();
    }
  });

  userIdPromise
      .then(userId => {
        // Attach the userId to the request for use in handlers.
        req.userId = userId;
        next();
      })
      .catch(() => {
        res.status(403).send({error: 'Invalid token.'});
      });
};

export const forceHttpsUnlessDev = (req, res, next) => {
  if ((process.env.NODE_ENV === 'production' ||
       process.env.NODE_ENV === 'staging') &&
      req.header('x-forwarded-proto') !== 'https') {
    return res.redirect('https://' + req.header('host') + req.url);
  } else {
    return next();
  }
};
