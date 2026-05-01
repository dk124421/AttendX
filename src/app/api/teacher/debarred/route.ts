import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logger } from '@/lib/logger'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TEACHER') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const classId = searchParams.get('classId')

  if (!classId) {
    return new NextResponse('classId is required', { status: 400 })
  }

  try {
    // 1. Verify teacher is assigned to this class
    const { data: teacherProfile } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (!teacherProfile) {
      return new NextResponse('Teacher profile not found', { status: 404 })
    }

    const teacherId = teacherProfile.id

    const { data: assignment } = await supabase
      .from('teacher_assignments')
      .select('id')
      .eq('teacher_id', teacherId)
      .eq('class_id', classId)
      .limit(1)

    const { data: classTeacher } = await supabase
      .from('classes')
      .select('id')
      .eq('id', classId)
      .eq('class_teacher_id', teacherId)
      .limit(1)

    if ((!assignment || assignment.length === 0) && (!classTeacher || classTeacher.length === 0)) {
      return new NextResponse('You are not assigned to this class', { status: 403 })
    }

    // 2. Get class metadata
    const { data: classData } = await supabase
      .from('classes')
      .select('name, year')
      .eq('id', classId)
      .single()

    // 3. Get students via class_students junction table
    const { data: classStudentLinks, error: csError } = await supabase
      .from('class_students')
      .select('student:students(id, student_id, user:users(name))')
      .eq('class_id', classId)

    if (csError) {
      logger.error('[DEBARRED] class_students error:', csError)
      return new NextResponse(`Students query failed: ${csError.message}`, { status: 500 })
    }

    const students = (classStudentLinks || [])
      .map((link: any) => link.student)
      .filter(Boolean)

    if (!students || students.length === 0) {
      return NextResponse.json({
        classMeta: { className: classData?.name || '', classYear: classData?.year || '' },
        students: [],
      })
    }

    // 4. Get attendance — EXACT same query as leaderboard
    const studentIds = students.map((s: any) => s.id)
    const { data: attendances, error: attError } = await supabase
      .from('attendance')
      .select('student_id, status')
      .eq('class_id', classId)
      .in('student_id', studentIds)

    if (attError) {
      logger.error('[DEBARRED] Attendance error:', attError)
      return new NextResponse(`Attendance query failed: ${attError.message}`, { status: 500 })
    }

    // Build stats (same as leaderboard)
    const statsMap: Record<string, { total: number; present: number }> = {}
    attendances?.forEach((a: any) => {
      if (!statsMap[a.student_id]) {
        statsMap[a.student_id] = { total: 0, present: 0 }
      }
      statsMap[a.student_id].total++
      if (a.status === 'PRESENT') statsMap[a.student_id].present++
    })

    // 5. Now get email and parent_contact separately for debarred students only
    const debarredList: any[] = []

    for (const student of students) {
      const stats = statsMap[student.id] || { total: 0, present: 0 }
      const total = stats.total
      const present = stats.present
      const absent = total - present
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0

      if (percentage < 75) {
        debarredList.push({
          studentId: student.id,
          enrollmentNo: student.student_id,
          name: (student as any).user?.name || 'Unknown',
          email: '',
          parentContact: '',
          totalClasses: total,
          attended: present,
          absent,
          percentage,
        })
      }
    }

    // Fetch emails for debarred students only
    if (debarredList.length > 0) {
      const debarredIds = debarredList.map((d: any) => d.studentId)

      const { data: studentDetails } = await supabase
        .from('students')
        .select('id, parent_email, contact_email, user:users(email)')
        .in('id', debarredIds)

      if (studentDetails) {
        for (const detail of studentDetails) {
          const item = debarredList.find((d: any) => d.studentId === detail.id)
          if (item) {
            item.email = (detail as any).contact_email || (detail as any).user?.email || ''
            item.parentContact = (detail as any).parent_email || ''
          }
        }
      }
    }

    debarredList.sort((a, b) => a.percentage - b.percentage)

    return NextResponse.json({
      classMeta: {
        className: classData?.name || '',
        classYear: classData?.year || '',
      },
      students: debarredList,
    })
  } catch (error: any) {
    logger.error('[DEBARRED API]', error)
    return new NextResponse(`Internal Error: ${error?.message || 'Unknown'}`, { status: 500 })
  }
}
