import * as express from 'express';
import * as jwt from 'jsonwebtoken';

import * as googleAuth from '../infra/google-auth';
import * as middleware from '../infra/middleware';
import { endpoint } from '../infra/net';

import settings from '../../settings';

import DeviceToken from '../models/DeviceToken';
import Permission, { Provider } from '../models/Permission';
import User from '../models/User';


const router = express.Router();

router.use('/jwt/fromdevicetoken', middleware.requireAuthHeader);
router.post('/jwt/fromdevicetoken', endpoint((req, res) => {
  const value = {userId: req.userId};
  const token = jwt.sign(value, settings.auth.keys.jwtSecret, {
    expiresIn: settings.auth.jwtExpiresInSeconds
  });
  return {jwt: token};
}));


router.post('/devicetoken', endpoint((req, res) => {
  const {googleUser, scopes, deviceName} = req.body;

  const tokenInfoPromise = googleAuth.getTokenInfoFromServerAuthCode(
      scopes, googleUser.serverAuthCode).catch(error => {
        // The serverAuthToken was null or invalid, probably because
        // the user was auto-signed-in on mobile rather than going through
        // the browser "Offline Access" grant flow.
        return null;
      });

  const userPromise = googleAuth.getGoogleId(googleUser.idToken)
      .then(googleId => {
        if (googleId !== googleUser.id) {
          throw Error('Expected Google id of idToken to match original id.');
        }
        return User.findOrCreate({
          googleId: googleId,
          name: googleUser.name,
          gender: googleUser.gender,
          email: googleUser.email,
        });
      });

  const googlePermissionPromise = Promise.all([userPromise, tokenInfoPromise])
      .then(values => {
        const [user, tokenInfo] = values;
        if (tokenInfo) {
          return (Permission.ensureGooglePermissionUpToDate(
                      user.id, user.googleId, tokenInfo, scopes));
        } else {
          return Permission.find(user.id, Provider.GOOGLE);
        }
      });

  const deviceTokenPromise = userPromise.then(user => {
    return DeviceToken.createOrReplace(user.id, deviceName);
  });

  return Promise.all([deviceTokenPromise, googlePermissionPromise])
      .then(values => {
        const [deviceToken, googlePermission] = values;
        if (!googlePermission) {
          return res.sendClientError(
              'The initial device token requires a valid serverAuthCode.');
        }
        return {deviceToken: deviceToken.token};
      });
}));


export default router;
