import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import connectDB from '@/config/db';

interface SyncUserPayload {
  uid: string;
  email: string;
  name: string;
  image?: string;
  authProvider: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: SyncUserPayload = await req.json();
    const { uid, email, name, image, authProvider } = body;

    if (!uid || !email) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 },
      );
    }

    await connectDB();

    // Find or create user
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      // Update existing user
      const updatedUser = await User.findOneAndUpdate(
        { email },
        {
          name,
          image: image || existingUser.image,
          firebaseUid: uid,
          authProvider,
        },
        { new: true },
      );
      return NextResponse.json(
        { success: true, data: updatedUser, message: 'User updated' },
        { status: 200 },
      );
    } else {
      // Create new user
      const newUser = await User.create({
        firebaseUid: uid,
        email,
        name,
        image,
        authProvider,
      });
      return NextResponse.json(
        { success: true, data: newUser, message: 'User created' },
        { status: 201 },
      );
    }
  } catch (error) {
    console.error('Error syncing user:', error);
    return NextResponse.json(
      { success: false, message: 'Error syncing user', error },
      { status: 500 },
    );
  }
}
