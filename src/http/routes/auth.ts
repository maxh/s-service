// Authorization for the scout service itself.

import * as express from 'express';

import * as middleware from '../middleware';

import { generateJwt } from '../../infra/auth';
import * as googleAuth from '../../infra/google-auth';
import { endpoint } from '../../infra/net';

import Permission, { IGoogleProviderInfo, Provider } from '../../models/Permission';
import DeviceToken from '../../models/DeviceToken';
import User from '../../models/User';


const ensureUserAndPermission = function(
    googleId: string,
    name: string,
    email: string,
    scopes: string[],
    tokens: googleAuth.IGoogleTokens): Promise<string> {

  const userPromise = User.findOrCreate({ googleId, email, name });

  const permissionPromise = userPromise.then(user => {
    const providerInfo = Object.assign({}, tokens, { scopes, googleId });
    return Permission.createOrUpgrade(user.id, Provider.GOOGLE, providerInfo);
  }).then(permission => {
    const providerInfo = permission.providerInfo as IGoogleProviderInfo;
    if (!providerInfo.refreshToken) {
      throw Error(NO_REFRESH_TOKEN);
    }
    return permission;
  });

  return permissionPromise.then(permission => permission.userId);
};


const router = express.Router();

const NO_REFRESH_TOKEN = 'No refresh token!';


// For web socket server authorization.
router.use('/jwt/fromdevicetoken', middleware.requireAuthHeader);
router.post('/jwt/fromdevicetoken', endpoint((req, res) => {
  return { jwt: generateJwt(req.userId) };
}));


// Web client authentication.
router.use('/jwt/fromtokens', middleware.onlyAcceptRequestsFromScoutWebServer);
router.post('/jwt/fromtokens', endpoint((req, res) => {

  const { googleId, email, name, tokens, scopes } = req.body;

  const userIdPromise = ensureUserAndPermission(googleId, name, email, scopes, tokens);

  return (userIdPromise
      .then(userId => generateJwt(userId))
      .then(jwt => ({ jwt }))
      .catch(error => {
        if (error.message === NO_REFRESH_TOKEN) {
          return res.status(400).json({ error: NO_REFRESH_TOKEN });
        } else {
          throw Error(error);
        }
      }));
}));


// Mobile client authentication.
router.post('/devicetoken', endpoint((req, res) => {
  const { googleUser, scopes, deviceName } = req.body;
  const { id, name, email } = googleUser;
  const googleId = id;

  const validatedPromise = googleAuth.validateIdToken(googleId, googleUser.idToken);
  const tokensPromise = googleAuth.getTokensFromCode(googleUser.serverAuthCode);

  const userIdPromise = Promise.all([tokensPromise, validatedPromise]).then(values => {
    const [ tokens ] = values;
    return ensureUserAndPermission(googleId, name, email, scopes, tokens);
  });

  return (userIdPromise
      .then(userId => DeviceToken.createOrReplace(userId, deviceName))
      .then(deviceToken => ({ deviceToken: deviceToken.token }))
      .catch(error => {
        if (error.message === NO_REFRESH_TOKEN) {
          return res.status(400).json({ error: NO_REFRESH_TOKEN });
        } else {
          throw Error(error);
        }
      }));
}));


export default router;
