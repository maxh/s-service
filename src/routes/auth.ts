import * as express from 'express';

import * as googleAuth from '../infra/google-auth';
import { endpoint } from '../infra/net';

import DeviceToken from '../models/DeviceToken';
import Permission, { Provider } from '../models/Permission';
import User from '../models/User';


const router = express.Router();

router.post('/devicetoken', endpoint((req, res) => {
  if (!req.body) {
    return res.sendClientError('Authorization details required.');
  }

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
              'A device token requires a valid serverAuthCode.');
        }
        return {deviceToken: deviceToken.token};
      });
}));

export default router;
