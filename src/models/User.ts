import * as mongoose from 'mongoose';


export interface IUser {
  googleId: string;
  name: string;
  gender?: string;
  email: string;
}

const UserSchema = new mongoose.Schema({
  email: String,
  name: {type: String, required: true},
  gender: String,
  googleId: String,
});

export interface IUserModel extends IUser, mongoose.Document {
  id: string;  // Provided by Mongoose.
}

const User = mongoose.model<IUserModel>('User', UserSchema);

export default User;
