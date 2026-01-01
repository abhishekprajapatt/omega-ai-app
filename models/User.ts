import mongoose, { Document, Schema } from 'mongoose';

interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    image: { type: String, required: false },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
