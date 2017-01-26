// Custom Express middleware.

import { getUserIdFromAuthHeader } from '../infra/auth';

import settings from '../settings';


export const requireAuthHeader = (req, res, next) => {
  const header = req.get('authorization');
  getUserIdFromAuthHeader(header)
      .then(userId => {
        // Attach the userId to the request for use in handlers.
        req.userId = userId;
        next();
      })
      .catch(() => {
        res.status(403).send({ error: 'Invalid token.' });
      });
};

export const onlyAcceptRequestsFromScoutWebServer = (req, res, next) => {
  const { scoutWebServerSecret } = req.body;
  if (scoutWebServerSecret !== settings.auth.keys.scoutWebServerSecret) {
    res.sendStatus(403).send({ error: 'Unauthorized.' });
  } else {
    next();
  }
};

export const forceHttpsUnlessDev = (req, res, next) => {
  if ((process.env.NODE_ENV === 'production' ||
       process.env.NODE_ENV === 'staging') &&
      req.header('x-forwarded-proto') !== 'https') {
    return res.redirect('https://' + req.header('host') + req.url);
  } else {
    return next();
  }
};

export const allowCrossDomain = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers',
             'Content-Type, Authorization, Content-Length, X-Requested-With');

  if ('OPTIONS' === req.method) {
    res.sendStatus(200);
  } else {
    next();
  }
};
