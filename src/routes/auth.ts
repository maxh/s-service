import * as express from 'express';

import * as googleAuth from '../infra/google-auth';
import settings from '../settings/index';

import DeviceToken from '../models/DeviceToken';
import Permission from '../models/Permission';
import User from '../models/User';


const router = express.Router();

router.post('/devicetoken', function(
    req: express.Request,
    res: express.Response) {
  debugger;

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

  const promises = Promise.all([userPromise, tokenInfoPromise]);
  const permissionPromise = promises.then(values => {
    const user = values[0];
    const tokenInfo = values[1];
    return Permission.ensureGooglePermissionsSaved(user, tokenInfo, scopes);
  });


  const deviceTokenPromise = userPromise.then(user => {
    return DeviceToken.create(user.id, deviceName);
  });


  const finalPromises = Promise.all([deviceTokenPromise, permissionPromise]);
  return finalPromises
      .then(values => {
        const deviceToken = values[0];
        res.status(200).send({deviceToken: deviceToken.token});
      })
      .catch((error) => {
        res.status(500).send(error);
      });
});

export default router;
