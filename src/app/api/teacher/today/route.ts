import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logger } from '@/lib/logger'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TEACHER') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    // Get teacher profile
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (teacherError || !teacher) {
      return new NextResponse('Teacher profile not found', { status: 404 })
    }

    // Build today's UTC date range
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0] // "YYYY-MM-DD"
    const dayStart = `${todayStr}T00:00:00.000Z`
    const dayEnd   = `${todayStr}T23:59:59.999Z`

    // Fetch all attendance records submitted by this teacher today
    const { data: records, error } = await supabase
      .from('attendance')
      .select(`
        id,
        status,
        class_id,
        subject_id,
        date,
        class:classes(id, name, year),
        subject:subjects(id, name, code)
      `)
      .eq('teacher_id', teacher.id)
      .gte('date', dayStart)
      .lte('date', dayEnd)

    if (error) throw error

    if (!records || records.length === 0) {
      return NextResponse.json([])
    }

    // Group by class_id + subject_id (each unique session)
    const sessionMap: Record<string, any> = {}

    for (const rec of records) {
      const key = `${rec.class_id}__${rec.subject_id ?? 'null'}`
      if (!sessionMap[key]) {
        sessionMap[key] = {
          classId: rec.class_id,
          subjectId: rec.subject_id,
          className: (rec.class as any)?.name || 'Unknown Class',
          classYear: (rec.class as any)?.year || '',
          subjectName: (rec.subject as any)?.name || null,
          subjectCode: (rec.subject as any)?.code || null,
          submittedAt: rec.date,
          present: 0,
          absent: 0,
          total: 0,
        }
      }
      sessionMap[key].total++
      if (rec.status === 'PRESENT') sessionMap[key].present++
      else sessionMap[key].absent++
    }

    const sessions = Object.values(sessionMap).sort(
      (a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    )

    return NextResponse.json(sessions)
  } catch (error) {
    logger.error('Today sessions API error:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
