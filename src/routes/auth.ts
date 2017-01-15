import express from 'express';

import * as googleAuth from '../infra/google-auth';
import settings from '../settings/index';

import Permission, { ITokenInfo, Provider } from '../models/Permission';
import User, { IUser } from '../models/User';


//////////
// Routes.
//////////


const router = express.Router();

router.post('/fromServerAuthCode', function(
    req: express.Request,
    res: express.Response) {
  debugger;
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
    return getOrCreateUser(googleId, body.name, body.gender, body.email);
  });

  return Promise.all([tokenInfoPromise, userPromise]).then(values => {
    const tokenInfo = values[0];
    const user = values[1];
    return ensureGooglePermissionsSaved(user, tokenInfo, scopes);
  }).catch((error) => {
    res.status(500).send(error);
  });
});

export default router;


//////////////////
// Implementation.
//////////////////


const getOrCreateUser = function(
    googleId: string,
    name: string,
    email: string,
    gender?: string): Promise<IUser> {
  // TODO(max): Use googleId for lookup here.
  const query = {email: email};
  return User.findOne(query).then(foundUser => {
    // HACK: Ensure all users have a googleId.
    // TOOD(max): Remove this once all users have a googleId.
    if (foundUser && !foundUser.googleId) {
      foundUser.googleId = googleId;
      return foundUser.save().then(() => foundUser);
    }

    if (foundUser) {
      return foundUser;
    } else {
      const newUser = new User({googleId, name, email, gender});
      return newUser.save().then(() => newUser);
    }
  });
};

const ensureGooglePermissionsSaved = function(
    user: IUser,
    tokenInfo: ITokenInfo,
    scopes: string[]) {
  const query = {userId: user.id, provider: Provider.GOOGLE};
  return Permission.findOne(query).then(foundPermission => {
    if (foundPermission) {
      return foundPermission.updateGoogleTokensIfScopesChanged(
          tokenInfo, scopes);
    } else {
      const newPermission = new Permission({
        userId: user.id,
        token: tokenInfo.accessToken,
        tokenExpiration: tokenInfo.accessTokenExpiration,
        refreshToken: tokenInfo.refreshToken,
        id: user.googleId,
        permissions: [scopes],  // Property name should probably be 'scopes'.
      });
      return newPermission.save();
    }
  });
};
