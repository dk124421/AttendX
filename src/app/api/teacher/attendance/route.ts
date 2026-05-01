import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkConsecutiveAbsences, checkMonthlyNonConsecutiveAbsences } from '@/lib/attendanceAlerts'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'TEACHER') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const body = await req.json()
    const { classId, subjectId, date, attendanceData } = body

    if (!classId || !date || !attendanceData) {
      return new NextResponse('Missing required fields: classId, date, attendanceData are required', { status: 400 })
    }

    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (teacherError || !teacher) return new NextResponse('Teacher profile not found', { status: 404 })

    // Normalize date to a plain date string (YYYY-MM-DD) stored at midnight UTC
    const dateStr = new Date(date).toISOString().split('T')[0]
    const normalizedDate = `${dateStr}T00:00:00.000Z`

    // For each student, check if a record already exists for this class+date+subject
    // If it exists, update it. If not, insert a new one.
    // This avoids the NULL subject_id upsert problem in Postgres.
    const results = await Promise.all(attendanceData.map(async (record: any) => {
      let query = supabase
        .from('attendance')
        .select('id')
        .eq('student_id', record.studentId)
        .eq('class_id', classId)
        .gte('date', `${dateStr}T00:00:00.000Z`)
        .lte('date', `${dateStr}T23:59:59.999Z`)

      if (subjectId) {
        query = query.eq('subject_id', subjectId)
      } else {
        query = query.is('subject_id', null)
      }

      const { data: existing } = await query

      if (existing && existing.length > 0) {
        // Update existing record
        const { data: updated, error } = await supabase
          .from('attendance')
          .update({ status: record.status, teacher_id: teacher.id })
          .eq('id', existing[0].id)
          .select()
        if (error) throw error
        return updated ? updated[0] : null
      } else {
        // Insert new record
        const { data: inserted, error } = await supabase
          .from('attendance')
          .insert({
            student_id: record.studentId,
            class_id: classId,
            subject_id: subjectId || null,
            teacher_id: teacher.id,
            date: normalizedDate,
            status: record.status,
          })
          .select()
        if (error) throw error
        return inserted ? inserted[0] : null
      }
    }))

    // Calculate streaks for impacted students
    await Promise.all(attendanceData.map(async (record: any) => {
      if (record.status === 'PRESENT') {
        const { error: updateError } = await supabase.rpc('increment_streak', { student_id_param: record.studentId })
        if (updateError) {
          const { data: student } = await supabase.from('students').select('current_streak').eq('id', record.studentId).single()
          await supabase.from('students').update({ current_streak: (student?.current_streak || 0) + 1 }).eq('id', record.studentId)
        }
      } else {
        await supabase.from('students').update({ current_streak: 0 }).eq('id', record.studentId)
      }
    }))

    // ──── Trigger attendance alerts asynchronously (fire-and-forget) ────
    const dateObj = new Date(date)
    const currentMonth = dateObj.getMonth() + 1
    const currentYear = dateObj.getFullYear()

    const absentStudentIds = attendanceData
      .filter((r: any) => r.status === 'ABSENT')
      .map((r: any) => r.studentId)

    if (absentStudentIds.length > 0) {
      Promise.allSettled(
        absentStudentIds.flatMap((studentId: string) => [
          checkConsecutiveAbsences(studentId),
          checkMonthlyNonConsecutiveAbsences(studentId, currentMonth, currentYear),
        ])
      ).then((results) => {
        const failed = results.filter(r => r.status === 'rejected')
        if (failed.length > 0) {
          console.error('[ALERTS] Some alert checks failed:', failed)
        }
      })
    }
    
    return NextResponse.json({ message: 'Attendance recorded successfully', count: results.length })
  } catch (error) {
    console.error(error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
