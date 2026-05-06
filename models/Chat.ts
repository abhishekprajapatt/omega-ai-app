import mongoose, { Document, Schema } from 'mongoose';

interface IMessage {
  role: string;
  content: string;
  timestamp: number;
  isVoiceMessage?: boolean;
}

interface IChat extends Document {
  name: string;
  messages: IMessage[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema: Schema<IChat> = new Schema(
  {
    name: { type: String, required: true },
    messages: [
      {
        role: { type: String, required: true },
        content: { type: String, required: true },
        timestamp: { type: Number, required: true },
        isVoiceMessage: { type: Boolean, default: false },
      },
    ],
    userId: { type: String, required: true },
  },
  { timestamps: true }
);

const Chat = mongoose.models.Chat || mongoose.model<IChat>('Chat', ChatSchema);

export default Chat;
