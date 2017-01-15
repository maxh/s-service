// Networking utilities.

import * as fetch from 'isomorphic-fetch';

// A handler wrapper that allows handler to return promises
// instead of dealing with req and res.
export const endpoint = (fn) => {
  const wrapper = (req, res) => {
    fn(req, res)
        .then(json => {
          if (!req.headerSent) {
            req.status(200).json(json);
          }
        })
        .catch(error => {
          if (!req.headerSent) {
            res.status(500).send({error: String(error)});
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
