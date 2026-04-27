import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'TEACHER') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const { studentId, classId, subjectId, date, newStatus } = await req.json()

    if (!studentId || !classId || !date || !newStatus) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    // Verify teacher identity
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (teacherError || !teacher) {
      return new NextResponse('Teacher profile not found', { status: 404 })
    }

    // Update the attendance record
    let query = supabase
      .from('attendance')
      .update({ status: newStatus })
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .eq('date', date)

    if (subjectId) {
      query = query.eq('subject_id', subjectId)
    } else {
      query = query.is('subject_id', null)
    }

    const { data, error } = await query.select()

    if (error) throw error

    if (!data || data.length === 0) {
      return new NextResponse('Attendance record not found for the given date', { status: 404 })
    }

    return NextResponse.json({ message: 'Attendance modified successfully', record: data[0] })
  } catch (error) {
    console.error(error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'TEACHER') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const classId = searchParams.get('classId')
    const subjectId = searchParams.get('subjectId')
    const date = searchParams.get('date')

    if (!classId || !date) {
      return new NextResponse('Missing classId or date', { status: 400 })
    }

    // Build a full-day UTC range from the plain date (YYYY-MM-DD)
    // e.g. "2026-04-22" → gte "2026-04-22T00:00:00.000Z" and lt "2026-04-23T00:00:00.000Z"
    const dayStart = new Date(date + 'T00:00:00.000Z').toISOString()
    const dayEnd   = new Date(date + 'T23:59:59.999Z').toISOString()

    let query = supabase
      .from('attendance')
      .select('*, student:students(*, user:users(name))')
      .eq('class_id', classId)
      .gte('date', dayStart)
      .lte('date', dayEnd)

    if (subjectId) {
      query = query.eq('subject_id', subjectId)
    } else {
      query = query.is('subject_id', null)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error(error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
