import Chat from '@/models/Chat';
import connectDB from '@/config/db';
import { getUserIdFromRequest } from '@/lib/firebaseAuth';
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

export async function POST(
  req: NextRequest,
): Promise<NextResponse<ApiResponse>> {
  try {
    console.log('[RENAME] POST Request received');
    const authHeader = req.headers.get('Authorization');
    console.log('[RENAME] Auth header present:', !!authHeader);

    const userId = await getUserIdFromRequest(req);
    console.log('[RENAME] User ID extracted:', !!userId);

    if (!userId) {
      console.error('[RENAME] User not authenticated - userId is falsy');
      return NextResponse.json(
        {
          success: false,
          message: 'User not authenticated',
        },
        { status: 401 },
      );
    }

    const { chatId, name }: RenameChatRequestBody = await req.json();
    console.log('[RENAME] Chat ID:', chatId, 'New name:', name);

    await connectDB();
    const updateResult = await Chat.findOneAndUpdate(
      { _id: chatId, userId },
      { name },
    );
    console.log('[RENAME] Update result:', !!updateResult);

    return NextResponse.json({ success: true, message: 'Chat Renamed' });
  } catch (error: any) {
    console.error('[RENAME] Error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
