// Networking utilities.

import * as fetch from 'isomorphic-fetch';

// A handler wrapper that allows handlers to return promises
// instead of dealing with req and res. Also, centralizes
// reject and error handling.
export const endpoint = (fn) => {
  const wrapper = (req, res) => {
    const promise = new Promise((resolve, reject) => {
      try {
        resolve(fn(req, res));
      } catch (e) {
        reject(e);
      }
    });

    promise.then(result => {
      if (!res.headersSent) {
        res.status(200).json(result);
      }
    }).catch(error => {
      console.error('Error in handler: ', error);
      if (!res.headersSent) {
        res.status(500).send({error: 'Internal server error.'});
      }
    });
  };
  return wrapper;
};

export const urlEncode = (data: Object): string => {
  const parts = [];
  for (const p in data) {
    if (data.hasOwnProperty(p)) {
      parts.push(encodeURIComponent(p) + '=' + encodeURIComponent(data[p]));
    }
  }
  return parts.join('&');
};

export const fetchJson = (url: string, options?: Object): Promise<any> => {
  return fetch(url, options).then(response => {
    if (!response.ok) {
      throw Error(response.statusText);
    }
    return response.json();
  });
};
