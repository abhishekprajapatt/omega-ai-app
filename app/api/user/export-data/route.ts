import Chat from '@/models/Chat';
import connectDB from '@/config/db';
import { getUserIdFromRequest } from '@/lib/firebaseAuth';
import { NextRequest, NextResponse } from 'next/server';

interface ExportResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export async function GET(
  req: NextRequest,
): Promise<NextResponse<ExportResponse>> {
  try {
    const userId = await getUserIdFromRequest(req);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 },
      );
    }

    await connectDB();

    const chats = await Chat.find({ userId }).lean();

    const exportData = {
      userId,
      exportedAt: new Date().toISOString(),
      chats: chats.map((chat: any) => ({
        _id: chat._id,
        name: chat.name,
        messages: chat.messages || [],
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      })),
      totalChats: chats.length,
      totalMessages: chats.reduce(
        (sum: number, chat: any) => sum + (chat.messages?.length || 0),
        0,
      ),
    };

    return NextResponse.json({
      success: true,
      data: exportData,
    });
  } catch (error: any) {
    console.error('Export data error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to export data' },
      { status: 500 },
    );
  }
}
