import * as mongoose from 'mongoose';
import User from './User';

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

const _schema = new mongoose.Schema({
  userId: String,
  accessToken: String,
  accessTokenExpiration: Number,
  refreshToken: String,
  idForProvider: String,
  scopes: [String],
  provider: String,
});

const _model =  mongoose.model('Permission', _schema);


class Permission {
  public static ensureGooglePermissionsSaved = function(
      user: User,
      tokenInfo: ITokenInfo,
      scopes: string[]) {
    debugger;
    const query = {userId: user.id, provider: Provider.GOOGLE};
    return _model.findOne(query).then(existingDoc => {
      if (existingDoc) {
        const existing = new Permission(existingDoc);
        return (existing.updateGoogleTokensIfScopesChanged(tokenInfo, scopes)
                    .then(() => existing));
      } else {
        const params = {
          userId: user.id,
          accessToken: tokenInfo.accessToken,
          accessTokenExpiration: tokenInfo.accessTokenExpiration,
          refreshToken: tokenInfo.refreshToken,
          idForProvider: user.googleId,
          scopes: scopes,
          provider: Provider.GOOGLE,
        };
        return _model.create(params).then(doc => {
          return new Permission(doc);
        });
      }
    });
  };

  private _document: IPermission & mongoose.Document;

  constructor(document) {
    this._document = document;
  }

  public updateGoogleTokensIfScopesChanged = function(
      newTokenInfo: ITokenInfo,
      newScopes: string[]) {
    const currentScopes = this.scopes;
    if (currentScopes.length > newScopes.length) {
      // The permission in the db has more scopes than we're currently
      // granting -- this means that we're probably doing a login, but
      // no matter what, we don't want to lose our old access/refresh
      // token.
      return;
    } else {
      // Upgrading permissions -- write to db.
      this.document_.accessToken = newTokenInfo.accessToken;
      this.document_.accessTokenExpiration =
          newTokenInfo.accessTokenExpiration;
      // When the user logins in but already has been auth'd, Google won't
      // give us the refresh token back -- they assume we have it stored.
      // In this case, don't set metadata on a new refresh token, just
      // ignore it and keep the old one.
      if (newTokenInfo.refreshToken) {
        this.document_.refreshToken = newTokenInfo.refreshToken;
      }
      this.document_.scopes = newScopes;
      return this.document_.save();
    }
  };

  get scopes(): string[] {
    return this._document.scopes;
  }
}

export default Permission;
