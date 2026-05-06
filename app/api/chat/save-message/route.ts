import Chat from '@/models/Chat';
import connectDB from '@/config/db';
import { getUserIdFromRequest } from '@/lib/firebaseAuth';
import { NextRequest, NextResponse } from 'next/server';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isVoiceMessage?: boolean;
}

interface SaveMessageRequestBody {
  chatId: string;
  message: Message;
}


interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export async function POST(
  req: NextRequest,
): Promise<NextResponse<ApiResponse>> {
  try {
    const userId = await getUserIdFromRequest(req);

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not authenticated',
        },
        { status: 401 },
      );
    }

    const { chatId, message }: SaveMessageRequestBody = await req.json();

    if (!chatId || !message) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing chatId or message',
        },
        { status: 400 },
      );
    }

    await connectDB();

    const chat = await Chat.findOne({ _id: chatId, userId });

    if (!chat) {
      return NextResponse.json(
        {
          success: false,
          message: 'Chat not found',
        },
        { status: 404 },
      );
    }

    chat.messages.push({
      role: message.role,
      content: message.content,
      timestamp: message.timestamp,
      isVoiceMessage: message.isVoiceMessage || false,
    });

    await chat.save();

    return NextResponse.json({
      success: true,
      message: 'Message saved successfully',
    });
  } catch (error: any) {
    console.error('Error saving message:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}
