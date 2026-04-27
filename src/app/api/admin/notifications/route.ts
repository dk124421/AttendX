import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

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

    // Fetch all student user_ids
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('user_id');

    if (studentsError) throw studentsError;

    if (!students || students.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: 'No students to notify' });
    }

    // Create notification rows for each student
    const notificationRows = students
      .filter(s => s.user_id)
      .map(s => ({
        user_id: s.user_id,
        title: 'Announcement from Admin',
        message: message,
        read: false,
      }));

    const { error: insertError } = await supabase
      .from('notifications')
      .insert(notificationRows);

    if (insertError) throw insertError;

    return NextResponse.json({
      success: true,
      count: notificationRows.length,
      message: `Notification sent to ${notificationRows.length} students`
    });
  } catch (error) {
    console.error(error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
