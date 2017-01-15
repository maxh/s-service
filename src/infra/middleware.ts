// Custom Express middleware.

import DeviceToken from '../models/DeviceToken';


export const requireToken = (req, res, next) => {
  const token = req.headers.Authorization;
  if (!token) {
    return res.status(403).send({error: 'No token provided.'});
  }

  // Valid tokens look like 'Scout DeviceToken foobar123'
  const parts = token.split(' ');
  const appId = parts[0];
  const tokenType = parts[1];
  const tokenString = parts[2];

  if (appId === 'Scout' && tokenType === 'DeviceToken') {
    DeviceToken.verify(tokenString).then(userId => {
      req.userId = userId;
      next();
    });
  } else {
    return res.status(403).send({error: 'Invalid token.'});
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
