// Networking utilities.

import * as fetch from 'isomorphic-fetch';


// A handler wrapper that allows handlers to return promises
// instead of dealing with req and res. Also, centralizes
// rejection and error handling and attaches convenience methods.
export const endpoint = (fn) => {
  const wrapper = (req, res) => {

    // Attach a convenience function to send a JSON client error.
    res.sendClientError = message => {
      return res.status(400).json({ error: message });
    };

    // Catch errors in the form of a rejected promise.
    const promise = new Promise((resolve, reject) => {
      try {
        resolve(fn(req, res));
      } catch (e) {
        reject(e);
      }
    });

    // Ensure a response is sent.
    promise.then(result => {
      if (!res.headersSent) {
        if (!result) {
          result = {};  // Empty response => success!
        }
        return res.status(200).json(result);
      }
    }).catch(error => {
      console.error('Error in handler:\n', error);
      if (!res.headersSent) {
        return res.status(500).send({ error: 'Internal server error.' });
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
      throw Error(
        `Network request failed!\n` +
        `URL: ${url}\n` +
        `Options: ${JSON.stringify(options)}\n` +
        `Status code: ${response.status}\n` +
        `Status text: ${response.statusText}\n`
      );
    }
    return response.json();
  });
};
