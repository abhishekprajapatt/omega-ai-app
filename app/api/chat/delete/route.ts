import Chat from '@/models/Chat';
import connectDB from '@/config/db';
import { getAuth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

interface DeleteChatRequestBody {
  chatId: string;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const { userId } = getAuth(req);
    const { chatId }: DeleteChatRequestBody = await req.json();

    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'User not authenticated',
      });
    }

    await connectDB();
    await Chat.deleteOne({ _id: chatId, userId });

    return NextResponse.json({ success: true, message: 'Chat Deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}