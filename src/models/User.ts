import * as mongoose from 'mongoose';


export interface IUser extends mongoose.Document {
  id: string;
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

const User = mongoose.model<IUser>('User', UserSchema);

export default User;
