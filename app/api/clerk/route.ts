import { Webhook } from 'svix';
import User from '@/models/User';
import connectDB from '@/config/db';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

interface ClerkUserData {
  id: string;
  first_name?: string;
  last_name?: string;
  email_addresses: Array<{ email_address: string }>;
  image_url?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const wh = new Webhook(process.env.SIGNING_SECRET!);
  const headerPayload = await headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { message: 'Missing required Svix headers' },
      { status: 400 }
    );
  }

  const svixHeaders = {
    'svix-id': svixId,
    'svix-timestamp': svixTimestamp,
    'svix-signature': svixSignature,
  };

  const payload = await req.json();
  const body = JSON.stringify(payload);
  const { data, type } = wh.verify(body, svixHeaders) as {
    data: ClerkUserData;
    type: string;
  };

  console.log('Received event type:', type);

  const userData = {
    _id: data.id,
    email: data.email_addresses[0]?.email_address || '',
    name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
    image: data.image_url || '',
  };

  await connectDB();

  switch (type) {
    case 'user.created':
      await User.create(userData);
      break;
    case 'user.updated':
      await User.findByIdAndUpdate(data.id, userData, { new: true });
      break;
    case 'user.deleted':
      await User.findByIdAndDelete(data.id);
      break;
    default:
      break;
  }

  return NextResponse.json({ message: 'Event received' });
}
