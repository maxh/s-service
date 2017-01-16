// Wrappers for Google OAuth endpoints.

import { ITokenInfo } from '../models/Permission';
import settings from '../../settings';
import { fetchJson, urlEncode } from './net';


const ID_TOKEN_ENDPOINT =
    'https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=';

const computeExpiration = (secondsFromNow: number) : number => {
  return new Date().getTime() / 1000 + secondsFromNow;
};

export const getGoogleId = (idToken: string): Promise<string> => {
  const url = ID_TOKEN_ENDPOINT + idToken;
  return fetchJson(url).then(json => json.sub);
};

export const getTokenInfoFromServerAuthCode = function(
    scopes: string[],
    code: string,
  ): Promise<ITokenInfo> {
  const tokenUri = 'https://accounts.google.com/o/oauth2/token';
  const postData = {
    client_id: settings.auth.keys.google_clientId,
    client_secret: settings.auth.keys.google_clientSecret,
    code: code,
    scope: scopes.join(' '),
    grant_type: 'authorization_code',
    redirect_uri: ''
  };
  const headers = {
    'content-type': 'application/x-www-form-urlencoded',
  };
  const options = {
    method: 'POST',
    body: urlEncode(postData),
    headers: headers,
  };
  return fetchJson(tokenUri, options).then(json => {
    return {
      refreshToken: json.refresh_token,
      accessToken: json.access_token,
      accessTokenExpiration: computeExpiration(json.expires_in),
    };
  });
};


// Reading list:
// https://developers.google.com/identity/sign-in/ios/backend-auth
