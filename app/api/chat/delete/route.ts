import Chat from '@/models/Chat';
import connectDB from '@/config/db';
import { getUserIdFromRequest } from '@/lib/firebaseAuth';
import { NextRequest, NextResponse } from 'next/server';

interface DeleteChatRequestBody {
  chatId: string;
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
    console.log('[DELETE] POST Request received');
    const authHeader = req.headers.get('Authorization');
    console.log('[DELETE] Auth header present:', !!authHeader);

    const userId = await getUserIdFromRequest(req);
    console.log('[DELETE] User ID extracted:', !!userId);

    const { chatId }: DeleteChatRequestBody = await req.json();
    console.log('[DELETE] Chat ID:', chatId);

    if (!userId) {
      console.error('[DELETE] User not authenticated - userId is falsy');
      return NextResponse.json(
        {
          success: false,
          message: 'User not authenticated',
        },
        { status: 401 },
      );
    }

    await connectDB();
    const deleteResult = await Chat.deleteOne({ _id: chatId, userId });
    console.log('[DELETE] Delete result:', deleteResult);

    return NextResponse.json({ success: true, message: 'Chat Deleted' });
  } catch (error: any) {
    console.error('[DELETE] Error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
): Promise<NextResponse<ApiResponse>> {
  try {
    const userId = await getUserIdFromRequest(req);

    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const url = new URL(req.url);
    const chatId = url.searchParams.get('id');

    if (!chatId) {
      return NextResponse.json({
        success: false,
        message: 'Missing chatId parameter',
      });
    }

    await connectDB();
    await Chat.deleteOne({ _id: chatId, userId });

    return NextResponse.json({ success: true, message: 'Chat Deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
