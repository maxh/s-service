import * as fetch from 'isomorphic-fetch';


export const urlEncode = (data: Object) => {
  const parts = [];
  for (const p in data) {
    if (data.hasOwnProperty(p)) {
      parts.push(encodeURIComponent(p) + '=' + encodeURIComponent(data[p]));
    }
  }
  return parts.join('&');
};


export const fetchJson = function(url: string, options?: Object): Promise<any> {
  return fetch(url, options).then(response => {
    if (!response.ok) {
      throw Error(response.statusText);
    }
    return response.json();
  });
};
