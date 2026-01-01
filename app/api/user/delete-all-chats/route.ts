import Chat from '@/models/Chat';
import connectDB from '@/config/db';
import { getAuth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

interface DeleteResponse {
  success: boolean;
  message?: string;
  deletedCount?: number;
  error?: string;
}

export async function DELETE(
  req: NextRequest
): Promise<NextResponse<DeleteResponse>> {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      );
    }

    await connectDB();

    const result = await Chat.deleteMany({ userId });

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.deletedCount} chat(s)`,
      deletedCount: result.deletedCount,
    });
  } catch (error: any) {
    console.error('Delete all chats error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete chats' },
      { status: 500 }
    );
  }
}
