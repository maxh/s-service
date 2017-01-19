// Permissions for third-party services.

import * as express from 'express';

import * as googleAuth from '../infra/google-auth';

import Permission from '../models/Permission';

const router = express.Router();


router.post('/permissions', endpoint((req, res) => {
  const { userId } = req;
  const { provider, providerInfo } = req.body;
  return Permission.createOrUpgrade({ userId, provider, providerInfo }).then(() => null);
}));


router.post('/permissions/google', endpoint((req, res) => {
  const { userId } = req;
  const { googleId, idToken, serverAuthCode, scopes } = req.body.googleUser;
  return googleAuth.validateIdToken(googleId, idToken).then(() => {
    return googleAuth.createOrUpgradePermission(userId, googleId, scopes, serverAuthCode);
  }).then(() => null);
}));


default export router;
