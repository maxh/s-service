// Permissions for third-party services.

import * as express from 'express';

import Permission, { IProviderInfo } from '../models/Permission';
import * as middleware from '../infra/middleware';
import { endpoint } from '../infra/net';

const router = express.Router();


// GET is not protected by onlyAcceptRequestsFromScoutWebServer.
router.get('/', endpoint((req, res) => {
  const { userId } = req;
  return Permission.findAll(userId).then((permissions) => {
    const granted = {};
    if (permissions) {
      permissions.forEach(permission => {
        granted[permission.provider] = permission.summaryForClient;
      });
    }
    const possible = Permission.allPossible;
    return { granted, possible };
  });
}));


router.use('/', middleware.onlyAcceptRequestsFromScoutWebServer);
router.patch('/', endpoint((req, res) => {
  const { userId } = req;
  const provider = req.body.provider;
  const providerInfo = req.body.providerInfo as IProviderInfo;
  return Permission.createOrUpgrade(userId, provider, providerInfo).then(() => null);
}));


export default router;
