// Authorization for the scout service itself.

import * as express from 'express';

import { generateJwt } from '../infra/auth';
import * as googleAuth from '../infra/google-auth';
import * as middleware from '../infra/middleware';
import { endpoint } from '../infra/net';

import DeviceToken from '../models/DeviceToken';
import User from '../models/User';


const router = express.Router();


router.use('/jwt/fromdevicetoken', middleware.requireAuthHeader);
router.post('/jwt/fromdevicetoken', endpoint((req, res) => {
  return { jwt: generateJwt(req.userId) };
}));


router.post('/devicetoken', endpoint((req, res) => {
  const { googleUser, scopes, deviceName } = req.body;
  const { id, name, email } = googleUser;
  const googleId = id;

  const userPromise = googleAuth.validateIdToken(googleId, googleUser.idToken)
      .then(() => {
        return User.findOrCreate({ googleId, email, name });
      });

  const permissionPromise = userPromise.then((user) => {
    return googleAuth.createOrUpgradePermission(
        user.id, googleId, scopes, googleUser.serverAuthCode);
  });

  const deviceTokenPromise = userPromise.then(user => {
    return DeviceToken.createOrReplace(user.id, deviceName);
  });

  return Promise.all([deviceTokenPromise, permissionPromise])
      .then(values => {
        const [deviceToken, googlePermission] = values;
        if (!googlePermission) {
          return res.sendClientError(
              'The initial device token requires a valid serverAuthCode.');
        }
        return { deviceToken: deviceToken.token };
      });
}));


export default router;
