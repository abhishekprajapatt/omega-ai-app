import Chat from '@/models/Chat';
import connectDB from '@/config/db';
import { getAuth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: { _id: string };
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'User not authenticated',
      });
    }

    await connectDB();

    const chatData = {
      userId,
      messages: [],
      name: 'New Chat',
    };

    const newChat = await Chat.create(chatData);
    return NextResponse.json({
      success: true,
      message: 'Chat created',
      data: { _id: newChat._id.toString() },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
