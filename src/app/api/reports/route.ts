import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logger } from '@/lib/logger'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'TEACHER'].includes(session.user.role)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const classId = searchParams.get('classId')

  try {
    let query = supabase
      .from('attendance')
      .select(`
        *,
        student:students(
          *,
          user:users(name)
        ),
        subject:subjects(*),
        class:classes(*)
      `)
      .order('date', { ascending: false })

    if (classId) {
      query = query.eq('class_id', classId)
    }

    const { data: attendance, error } = await query

    if (error) throw error

    return NextResponse.json(attendance)
  } catch (error) {
    logger.error(error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
