import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const body = await req.json();
    const { message } = body;

    if (!message) {
      return new NextResponse('Message is required', { status: 400 });
    }

    // In a real app, we might store this in a notifications table in Supabase.
    // For now, we rely on the socket.io broadcast.

    return NextResponse.json({ success: true, message: 'Notification broadcasted' });
  } catch (error) {
    console.error(error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
