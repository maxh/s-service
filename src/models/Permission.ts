// See: https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/mongoose
// http://brianflove.com/2016/10/04/typescript-declaring-mongoose-schema-model/

import * as mongoose from 'mongoose';


export const Provider = {
  GOOGLE: 'google',
  DROPBOX: 'dropbox',
};

export interface ITokenInfo {
  accessToken: string;
  accessTokenExpiration: number;
  refreshToken?: string;
};

export interface IPermission extends mongoose.Document {
  id: string;  // Provided by Mongoose.
  userId: string;
  token: string;
  tokenExpiration: number;
  refreshToken: string;
  providerId: string;
  scopes: string[];
  updateGoogleTokensIfScopesChanged(
      newTokenInfo: ITokenInfo, newScopes: string[]);
}

const { Schema } = mongoose;

const permissionSchema = new Schema({
  userId: String,
  token: String,
  tokenExpiration: Number,
  refreshToken: String,
  providerId: String,
  scopes: [String],
});

permissionSchema.methods.updateGoogleTokensIfScopesChanged = function(
    newTokenInfo: ITokenInfo,
    newScopes: string[]) {
  const currentScopes = this.permissions;
  if (currentScopes.length > newScopes.length) {
    // The permission in the db has more scopes than we're currently
    // granting -- this means that we're probably doing a login, but
    // no matter what, we don't want to lose our old access/refresh
    // token.
    return;
  } else {
    // Upgrading permissions -- write to db.
    this.accessToken = newTokenInfo.accessToken;
    this.accessTokenExpiration = newTokenInfo.accessTokenExpiration;
    // When the user logins in but already has been auth'd, Google won't
    // give us the refresh token back -- they assume we have it stored.
    // In this case, don't set metadata on a new refresh token, just
    // ignore it and keep the old one.
    if (newTokenInfo.refreshToken) {
      this.refreshToken = newTokenInfo.refreshToken;
    }
    this.permissions = newScopes;
    return this.save();
  }
};

const Permission = mongoose.model<IPermission>('Permission', permissionSchema);

export default Permission;
