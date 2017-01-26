import * as express from 'express';

import { endpoint } from '../../infra/net';

import { teachersByName } from '../teachers/index';


const router = express.Router();

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
          speech: answer,
          displayText: answer,
          source: 'scout-web-hook'
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
