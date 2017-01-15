import * as express from 'express';

import * as googleAuth from '../infra/google-auth';
import { endpoint } from '../infra/net';

import DeviceToken from '../models/DeviceToken';
import Permission from '../models/Permission';
import User from '../models/User';


const router = express.Router();

router.post('/devicetoken', endpoint((req, res) => {
  if (!req.body) {
    res.status(400).send('Authorization details required.');
  }

  const {googleUser, scopes, deviceName} = req.body;

  const tokenInfoPromise = googleAuth.getTokenInfoFromServerAuthCode(
      scopes, googleUser.serverAuthCode);

  const userPromise = googleAuth.getGoogleId(googleUser.idToken)
      .then(googleId => {
        return User.findOrCreate({
          googleId: googleId,
          name: googleUser.name,
          gender: googleUser.gender,
          email: googleUser.email,
        });
      });

  const permissionPromise = Promise.all([userPromise, tokenInfoPromise])
      .then(values => {
        const user = values[0];
        const tokenInfo = values[1];
        return (Permission.ensureGooglePermissionSaved(
                    user, tokenInfo, scopes));
      });

  const deviceTokenPromise = userPromise.then(user => {
    return DeviceToken.createOrReplace(user.id, deviceName);
  });

  const finalPromises = Promise.all([deviceTokenPromise, permissionPromise]);
  return finalPromises.then(values => {
    const deviceToken = values[0];
    return {deviceToken: deviceToken.token};
  });
}));

export default router;
