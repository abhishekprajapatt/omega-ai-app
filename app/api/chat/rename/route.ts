import Chat from '@/models/Chat';
import connectDB from '@/config/db';
import { getAuth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

interface RenameChatRequestBody {
  chatId: string;
  name: string;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const { chatId, name }: RenameChatRequestBody = await req.json();
    await connectDB();
    await Chat.findOneAndUpdate({ _id: chatId, userId }, { name });

    return NextResponse.json({ success: true, message: 'Chat Renamed' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}