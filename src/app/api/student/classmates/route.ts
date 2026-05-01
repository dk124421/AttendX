import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logger } from '@/lib/logger'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'STUDENT') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    // Get the logged-in student's profile to find their class
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, class_id')
      .eq('user_id', session.user.id)
      .single()

    if (studentError || !student) {
      return new NextResponse('Student profile not found', { status: 404 })
    }

    // Get all students in the same class
    const { data: classmates, error: classmatesError } = await supabase
      .from('students')
      .select(`
        id,
        student_id,
        user:users(name, email)
      `)
      .eq('class_id', student.class_id)
      .order('student_id', { ascending: true })

    if (classmatesError) throw classmatesError

    return NextResponse.json(classmates)
  } catch (error) {
    logger.error(error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
