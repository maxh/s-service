import * as refresh from 'passport-oauth2-refresh';

import Permission, { IGoogleProviderInfo, Provider } from '../models/Permission';
import { fetchJson, urlEncode } from './net';

import settings from '../../settings';


export interface IGoogleTokens {
  accessToken: string;
  accessTokenExpiration: number;  // seconds since UNIX epoch
  refreshToken?: string;
};


const ID_TOKEN_ENDPOINT =
    'https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=';


const computeExpiration = (secondsFromNow: number) : number => {
  return new Date().getTime() / 1000 + secondsFromNow;
};


export const validateIdToken = (googleId, idToken): Promise<string> => {
  const url = ID_TOKEN_ENDPOINT + idToken;
  return fetchJson(url).then(json => {
    const googleIdFromIdToken = json.sub;
    if (googleId !== googleIdFromIdToken) {
      throw Error('Expected Google id of idToken to match original id.');
    }
    return googleId;
  });
};


export const getTokensFromCode = function(
    code: string,
    redirectUri: string = ''): Promise<IGoogleTokens|null> {
  const tokenUri = 'https://accounts.google.com/o/oauth2/token';
  const postData = {
    client_id: settings.auth.keys.google_clientId,
    client_secret: settings.auth.keys.google_clientSecret,
    code: code,
    // scope: scopes.join(' '),
    grant_type: 'authorization_code',
    redirect_uri: redirectUri
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
  }).catch(error => {
    // The serverAuthToken was null or invalid, probably because
    // the user was auto-signed-in on mobile rather than going through
    // the browser "Offline Access" grant flow.
    return null;
  });
};


export const getAccessTokenForUserId = (userId: string): Promise<string> => {
  return Permission.find(userId, Provider.GOOGLE).then((permission) => {
    const { accessToken, accessTokenExpiration } = permission.providerInfo as IGoogleProviderInfo;

    const BUFFER = 5 * 60;
    const currentTimeInSecs = new Date().getTime() / 1000;
    const isTokenValid = accessTokenExpiration - BUFFER > currentTimeInSecs;

    if (isTokenValid) {
      return accessToken;
    }

    return refreshAccessToken(permission).then(() => {
      return permission.providerInfo.accessToken;
    });
  });
};


const refreshAccessToken = (permission: Permission): Promise<Permission> => {
  const { scopes, refreshToken } = permission.providerInfo as IGoogleProviderInfo;

  const promise = new Promise((resolve, reject) => {
    refresh.requestNewAccessToken('google', refreshToken,
        (error, newAccessToken, newRefreshToken, params) => {
          if (error) {
            reject(error);
            return;
          }
          const accessToken = newAccessToken;
          const accessTokenExpiration = computeExpiration(params.expires_in);
          resolve({ accessToken, accessTokenExpiration });
        });
  });

  return promise.then((tokens: IGoogleTokens) => {
    const { accessToken, accessTokenExpiration } = tokens;
    const newProviderInfo = { scopes, accessToken, accessTokenExpiration };
    return permission.patchProviderInfo(newProviderInfo as IGoogleProviderInfo);
  });
};
