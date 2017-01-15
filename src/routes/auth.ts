import * as express from 'express';

import * as googleAuth from '../infra/google-auth';
import settings from '../settings/index';

import Permission, {
  IPermission,
  ITokenInfo,
  Provider,
} from '../models/Permission';
import User, { IUser } from '../models/User';


//////////
// Routes.
//////////


const router = express.Router();

router.post('/fromServerAuthCode', function(
    req: express.Request,
    res: express.Response) {
  const body = req.body;
  if (!body) {
    res.status(400).send('Authorization details required.');
  }

  // TODO(max): Determine scopes on the iOS side first.
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
  ];

  const tokenInfoPromise = googleAuth.getTokenInfoFromServerAuthCode(
      scopes, body.serverAuthCode);
  const userPromise = googleAuth.getGoogleId(body.idToken).then(googleId => {
    return User.findOrCreate({
      googleId: googleId,
      name: body.name,
      gender: body.gender,
      email: body.email,
    });
  });

  return Promise.all([userPromise, tokenInfoPromise]).then(values => {
    const user = values[0];
    const tokenInfo = values[1];
    return Permission.ensureGooglePermissionsSaved(user, tokenInfo, scopes);
  }).then(() => {
    // TODO(max): Generate auth token.
    res.status(400);
  }).catch((error) => {
    res.status(500).send(error);
  });
});

export default router;


//////////////////
// Implementation.
//////////////////
