import * as express from 'express';
import * as basicauth from 'basicauth-middleware';

import { endpoint } from '../../infra/net';
import { teachersByName } from '../teachers/index';
import settings from '../../settings';


export const SCOUT_WEB_HOOK_SOURCE = 'scout-web-hook';

const router = express.Router();

router.use('/',
    basicauth(settings.auth.keys.webhookBasicAuthUsername,
              settings.auth.keys.webhookBasicAuthPassword));
router.post('/', endpoint((req, res) => {
  const answerPromise = new Promise((resolve, reject) => {
    try {
      const { result, originalRequest } = req.body;
      const userId = originalRequest.data.userId;
      const parameters = result.parameters;

      const intentName = result.metadata.intentName;
      const parts = intentName.split('.');
      const teacherName = parts[parts.length - 1];

      const teacher = teachersByName[teacherName];
      if (!teacher) {
        resolve(result.fulfillment.speech);
      } else {
        const params = Object.assign({}, parameters, { userId });
        resolve(teacher.exec(params));
      }
    } catch (err) {
      reject(err);
    }
  });

  return answerPromise
      .then(answer => {
        return {
          speech: JSON.stringify(answer),  // Serialized IAnswer.
          displayText: '__unused__',
          source: SCOUT_WEB_HOOK_SOURCE,
        };
      })
      .catch(err => {
        return res.status(400).json({
          status: {
            code: 400,
            errorType: err.message
          }
        });
      });
}));

export default router;
