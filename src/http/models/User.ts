import * as mongoose from 'mongoose';
import * as mongooseTimestamp from 'mongoose-timestamp';


export interface IUser {
  id?: string;
  googleId: string;
  name: string;
  gender?: string;
  email: string;
}

const schema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  name: { type: String, required: true },
  gender: String,
});
schema.plugin(mongooseTimestamp);

const model = mongoose.model('User', schema);


class User {
  public static findOrCreate(userParams: IUser): Promise<User> {
    const query = { googleId: userParams.googleId };
    return model.findOne(query).then(existingDoc => {
      if (existingDoc) {
        return existingDoc;
      } else {
        return model.create(userParams);
      }
    }).then(doc => {
      return new User(doc);
    });
  }

  private document: IUser & mongoose.Document;

  constructor(document) {
    this.document = document;
  }

  get googleId(): string {
    return this.document.googleId;
  }

  get id(): string {
    // Cast needed to appease TypeScript.
    return (this.document as any).id;
  }
}

export default User;
