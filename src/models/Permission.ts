import * as mongoose from 'mongoose';


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

export interface IPermissionModel extends IPermission, mongoose.Document {
  id: string;  // Provided by Mongoose.
  updateGoogleTokensIfScopesChanged(
      newTokenInfo: ITokenInfo, newScopes: string[]);
}

const permissionSchema = new mongoose.Schema({
  userId: String,
  accessToken: String,
  accessTokenExpiration: Number,
  refreshToken: String,
  idForProvider: String,
  scopes: [String],
  provider: String,
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
    this.scopes = newScopes;
    return this.save();
  }
};


const Permission: mongoose.Model<IPermissionModel> = mongoose.model<IPermissionModel>(
    'Permission', permissionSchema);

export default Permission;
