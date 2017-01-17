// Custom Express middleware.

import { getUserIdFromAuthHeader } from './auth';


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

export const forceHttpsUnlessDev = (req, res, next) => {
  if ((process.env.NODE_ENV === 'production' ||
       process.env.NODE_ENV === 'staging') &&
      req.header('x-forwarded-proto') !== 'https') {
    return res.redirect('https://' + req.header('host') + req.url);
  } else {
    return next();
  }
};
