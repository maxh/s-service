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
const parseTokenHeader = (header: string): Promise<ITokenHeader> => {
  // Valid headers look like 'scout devicetoken foobar123'
  // TODO(max): Add support for 'scout jwt foobar123'
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
    if (appId === 'scout' && tokenType === 'devicetoken') {
      return DeviceToken.verify(tokenString);
    } else {
      throw Error();
    }
  });
};
