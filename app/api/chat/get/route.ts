import Chat from '@/models/Chat';
import connectDB from '@/config/db';
import { getAuth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

type ChatType = typeof Chat;

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
export async function GET(
  req: NextRequest
): Promise<NextResponse<ApiResponse<ChatType[]>>> {
  try {
    const { userId } = getAuth(req);
    await connectDB();
    const data = await Chat.find({ userId });
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json<ApiResponse>({
      success: false,
      error: error.message,
    });
  }
}
