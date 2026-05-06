import mongoose, { Document, Schema, Types } from 'mongoose';

interface IUser extends Document {
  _id: Types.ObjectId;
  firebaseUid: string;
  name: string;
  email: string;
  image?: string;
  authProvider: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    firebaseUid: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    image: { type: String, required: false },
    authProvider: { type: String, default: 'password' },
  },
  { timestamps: true },
);

const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
