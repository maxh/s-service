import * as express from 'express';

import * as googleAuth from '../infra/google-auth';
import settings from '../settings/index';

import Permission, {
  IPermission,
  ITokenInfo,
  Provider
} from '../models/Permission';
import User, { IUser, IUserModel } from '../models/User';


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
    return getOrCreateUser({
      googleId: googleId,
      name: body.name,
      gender: body.gender,
      email: body.email,
    });
  });

  return Promise.all([userPromise, tokenInfoPromise]).then(values => {
    const user = values[0];
    const tokenInfo = values[1];
    return ensureGooglePermissionsSaved(user, tokenInfo, scopes);
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


const getOrCreateUser = function(userParams: IUser): Promise<IUserModel> {
  const query = {googleId: userParams.googleId};
  return User.findOne(query).then(foundUser => {
    if (foundUser) {
      return foundUser;
    } else {
      const newUser = new User(userParams);
      return newUser.save().then(() => newUser);
    }
  });
};

const ensureGooglePermissionsSaved = function(
    user: IUserModel,
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
        accessToken: tokenInfo.accessToken,
        accessTokenExpiration: tokenInfo.accessTokenExpiration,
        refreshToken: tokenInfo.refreshToken,
        idForProvider: user.googleId,
        scopes: scopes,
      } as IPermission);
      return newPermission.save();
    }
  });
};
