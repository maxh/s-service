import * as mongoose from 'mongoose';


export interface IUser {
  googleId: string;
  name: string;
  gender?: string;
  email: string;
}

const _schema = new mongoose.Schema({
  googleId: {type: String, required: true, unique: true},
  email: {type: String, required: true},
  name: {type: String, required: true},
  gender: String,
});

const _model = mongoose.model('User', _schema);

class User {
  public static findOrCreate(userParams: IUser): Promise<User> {
    const query = {googleId: userParams.googleId};
    return _model.findOne(query).then(existingDoc => {
      if (existingDoc) {
        return existingDoc;
      } else {
        return _model.create(userParams);
      }
    }).then(doc => {
      return new User(doc);
    });
  }

  private _document: IUser & mongoose.Document;

  constructor(document) {
    this._document = document;
  }

  get googleId(): string {
    return this._document.googleId;
  }

  get id(): string {
    // Cast needed to appease TypeScript.
    return (this._document as any).id;
  }
}

export default User;
