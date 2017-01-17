import * as mongoose from 'mongoose';
import * as mongooseTimestamp from 'mongoose-timestamp';
import * as refresh from 'passport-oauth2-refresh';


/** @enum */
export const Provider = {
  GOOGLE: 'google',
  DROPBOX: 'dropbox',
};

// accessTokenExpiration is in seconds since UNIX epoch.
export interface ITokenInfo {
  accessToken: string;
  accessTokenExpiration: number;
  refreshToken?: string;
};

export interface IPermission {
  userId: string;
  accessToken: string;
  accessTokenExpiration: number;
  refreshToken: string;
  idForProvider: string;
  scopes: string[];
  provider: string;
}

const schema = new mongoose.Schema({
  userId: String,
  accessToken: String,
  accessTokenExpiration: Number,
  refreshToken: String,
  idForProvider: String,
  scopes: [String],
  provider: String,
});
schema.plugin(mongooseTimestamp);

const model =  mongoose.model('Permission', schema);


class Permission {
  public static ensureGooglePermissionUpToDate = function(
      userId: string,
      googleId: string,
      tokenInfo: ITokenInfo,
      scopes: string[]): Promise<Permission> {
    const query = { userId: userId, provider: Provider.GOOGLE };
    return model.findOne(query).then(existingDoc => {
      if (existingDoc) {
        const existing = new Permission(existingDoc);
        return (existing.updateGoogleTokensIfScopesChanged(tokenInfo, scopes)
                    .then(() => existing));
      } else {
        const params = {
          userId: userId,
          accessToken: tokenInfo.accessToken,
          accessTokenExpiration: tokenInfo.accessTokenExpiration,
          refreshToken: tokenInfo.refreshToken,
          idForProvider: googleId,
          scopes: scopes,
          provider: Provider.GOOGLE,
        } as IPermission;
        return model.create(params).then(doc => {
          return new Permission(doc);
        });
      }
    });
  };

  public static getGoogleTokenForUserId = (userId) => {
    return Permission.find(userId, Provider.GOOGLE).then((permission) => {
      const BUFFER = 5 * 60;
      const currentTimeInSecs = new Date().getTime() / 1000;
      const expiration = permission.document.accessTokenExpiration;
      const isTokenValid = expiration - BUFFER > currentTimeInSecs;

      if (isTokenValid) {
        return permission.document.accessToken;
      }

      return permission.refreshAccessToken();
    });
  }

  public static find = function(
      userId: string,
      provider: string): Promise<Permission> {
    return model.findOne({ userId, provider }).then(existingDoc => {
      if (existingDoc) {
        return new Permission(existingDoc);
      } else {
        return null;
      }
    });
  };

  private document: IPermission & mongoose.Document;

  constructor(document) {
    this.document = document;
  }

  public updateGoogleTokensIfScopesChanged = function(
      newTokenInfo: ITokenInfo,
      newScopes: string[]) {
    const currentScopes = this.document.scopes;
    if (currentScopes.length > newScopes.length) {
      // The permission in the db has more scopes than we're currently
      // granting -- this means that we're probably doing a login, but
      // no matter what, we don't want to lose our old access/refresh
      // token.
      return;
    } else {
      // Upgrading permissions -- write to db.
      this.document.accessToken = newTokenInfo.accessToken;
      this.document.accessTokenExpiration =
          newTokenInfo.accessTokenExpiration;
      // When the user logins in but already has been auth'd, Google won't
      // give us the refresh token back -- they assume we have it stored.
      // In this case, don't set metadata on a new refresh token, just
      // ignore it and keep the old one.
      if (newTokenInfo.refreshToken) {
        this.document.refreshToken = newTokenInfo.refreshToken;
      }
      this.document.scopes = newScopes;
      return this.document.save();
    }
  };

  private refreshAccessToken() {
    const newAccessTokenPromise = new Promise((resolve, reject) => {
      refresh.requestNewAccessToken('google', this.document.refreshToken,
          (error, accessToken, refreshToken, params) => {
            if (error) {
              reject(error);
              return;
            }
            resolve(accessToken);
          }
        );
    });
    return newAccessTokenPromise.then((newAccessToken: string) => {
      this.document.accessToken = newAccessToken;
      return this.document.save();
    });
  }

  get scopes(): string[] {
    return this.document.scopes;
  }
}

export default Permission;
