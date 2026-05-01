import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logger } from '@/lib/logger'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const { teacherId, classId, subjectId, year } = await req.json()
    const { data: assignment, error } = await supabase
      .from('teacher_assignments')
      .insert([{ teacher_id: teacherId, class_id: classId, subject_id: subjectId, year }])
      .select()
      .single()

    if (error) throw error
    
    return NextResponse.json(assignment)
  } catch (error) {
    logger.error(error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const { data: assignments, error } = await supabase
      .from('teacher_assignments')
      .select(`
        *,
        teacher:teachers(
          id,
          user:users(name)
        ),
        class:classes(*),
        subject:subjects(*)
      `)
    
    if (error) throw error
    
    return NextResponse.json(assignments)
  } catch (error) {
    logger.error(error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
