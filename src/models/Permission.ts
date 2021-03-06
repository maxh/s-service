import * as mongoose from 'mongoose';
import * as mongooseTimestamp from 'mongoose-timestamp';


// Provider details.


export interface IPermission {
  id?: string;
  userId: string;
  provider: string;
};

/** @enum */
export const Provider = {
  GOOGLE: 'google',
  DROPBOX: 'dropbox',
};

// https://developers.google.com/identity/protocols/OAuth2InstalledApp#handlingtheresponse
export interface IGoogleProviderInfo {
  scopes: string[];
  accessToken: string;
  accessTokenExpiration: number;
  refreshToken?: string;
  googleId?: string;
}

// https://www.dropbox.com/developers/documentation/http/documentation#authorization
export interface IDropboxProviderInfo {
  accessToken: string;
  accountId: string;
  teamId?: string;
}

export type IProviderInfo = IGoogleProviderInfo | IDropboxProviderInfo;


// Mongoose schemas.


const options = { discriminatorKey: 'kind' };

const baseSchema = new mongoose.Schema({
  userId: String,
  provider: String,
}, options);
baseSchema.plugin(mongooseTimestamp);

// Google.
const googleTypes = {
  googleId: String,
  accessToken: String,
  accessTokenExpiration: Number,
  refreshToken: String,
  scopes: [String],
};
const googleSchema = new mongoose.Schema(googleTypes, options);
googleSchema.statics.isUpgrade = function(existingInfo, newInfo): boolean {
  const hasNewScopes = newInfo.scopes.length > existingInfo.scopes.length;
  const hasNewRefreshToken = Boolean(newInfo.refreshToken);
  return hasNewScopes || hasNewRefreshToken;
};
googleSchema.statics.summarizeGranted = (providerInfo): Object => {
  return {
    provider: Provider.GOOGLE,
    scopes: providerInfo.scopes
  };
};
googleSchema.statics.summarizePossible = () => {
  return {
    provider: Provider.GOOGLE,
    scopes: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/gmail.readonly',
    ]
  };
};


// Dropbox.
const dropboxTypes = {
  accountId: String,
  accessToken: String,
  teamId: String,
};
const dropboxSchema = new mongoose.Schema(dropboxTypes, options);
dropboxSchema.statics.isUpgrade = function(existingInfo, newInfo): boolean {
  return true;  // No scopes for Dropbox; always upgrade.
};
dropboxSchema.statics.summarizeGranted = (providerInfo) => {
  return { provider: Provider.DROPBOX };
};
dropboxSchema.statics.summarizePossible = () => ({ provider: Provider.DROPBOX });


// Mongoose models.


const baseModel =  mongoose.model('Permission', baseSchema);

const googleModel = baseModel.discriminator('GooglePermission', googleSchema);
const dropboxModel = baseModel.discriminator('DropboxPermission', dropboxSchema);

const modelsByProvider = {};
modelsByProvider[Provider.GOOGLE] = googleModel;
modelsByProvider[Provider.DROPBOX] = dropboxModel;

const keysByProvider = {};
keysByProvider[Provider.GOOGLE] = Object.keys(googleTypes);
keysByProvider[Provider.DROPBOX] = Object.keys(dropboxTypes);


// The class itself!


class Permission {

  public static get allPossible() {
    const possibleByProvider = {};
    Object.keys(Provider).map((providerKey) => {
      const provider = Provider[providerKey];
      const possible = Permission.modelsByProvider[provider].summarizePossible();
      possibleByProvider[provider] = possible;
    });
    return possibleByProvider;
  }

  public static createOrUpgrade = function(
      userId: string,
      provider: string,
      providerInfo: IProviderInfo): Promise<Permission> {
    return Permission.find(userId, provider).then((existing) => {
      const model = Permission.modelsByProvider[provider];
      if (!existing) {
        const params = Object.assign({}, { userId , provider }, providerInfo);
        return model.create(params).then(doc => new Permission(doc));
      }
      if (model.isUpgrade(existing.providerInfo, providerInfo)) {
        return existing.patchProviderInfo(providerInfo);
      }
      return existing;
    });
  };

  public static find = function(userId: string, provider: string): Promise<Permission> {
    const model = Permission.modelsByProvider[provider];
    return model.findOne({ userId, provider }).then(doc => {
      if (doc) {
        return new Permission(doc);
      } else {
        return null;
      }
    });
  };

  public static findByGoogleId = function(googleId: string): Promise<Permission> {
    const model = Permission.modelsByProvider[Provider.GOOGLE];
    return model.findOne({ googleId }).then(doc => {
      if (doc) {
        return new Permission(doc);
      } else {
        return null;
      }
    });
  };

  public static findAll = function(userId: string): Promise<Permission[]> {
    return baseModel.find({ userId }).then(docs => {
      if (docs.length) {
        return docs.map(doc => new Permission(doc));
      } else {
        return null;
      }
    });
  };

  private static keysByProvider = keysByProvider;
  private static modelsByProvider = modelsByProvider;

  private document: IPermission & mongoose.Document;

  constructor(document) {
    this.document = document;
  }

  public patchProviderInfo = function(newProviderInfo: IProviderInfo): Promise<Permission> {
    const keys = Permission.keysByProvider[this.document.provider];
    keys.forEach(key => {
      if (newProviderInfo[key]) {
        this.document[key] = newProviderInfo[key];
      }
    });
    return this.document.save().then(() => this);
  };

  get userId(): string {
    return this.document.userId;
  }

  get provider(): string {
    return this.document.provider;
  }

  get providerInfo(): IProviderInfo {
    const keys = Permission.keysByProvider[this.document.provider];
    const providerInfo = {};
    keys.forEach(key => {
      providerInfo[key] = this.document[key];
    });
    return providerInfo as IProviderInfo;
  }

  get summaryForClient(): Object {
    const provider = this.document.provider;
    const model = Permission.modelsByProvider[provider];
    return model.summarizeGranted(this.providerInfo);
  }
}

export default Permission;
