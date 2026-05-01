import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logger } from '@/lib/logger'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    // 1. Fetch all students with their course and branch
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select(`
        id, 
        student_id, 
        contact_email, 
        parent_email, 
        user:users(name, email),
        course:courses(name),
        branch:branches(name)
      `)

    if (studentsError) {
      throw studentsError
    }

    if (!students || students.length === 0) {
      return NextResponse.json({ students: [] })
    }

    // 2. Fetch all attendance records
    const { data: attendance, error: attError } = await supabase
      .from('attendance')
      .select('student_id, status')

    if (attError) {
      throw attError
    }

    // 3. Build attendance stats per student
    const statsMap: Record<string, { total: number; present: number }> = {}
    attendance?.forEach((a: any) => {
      if (!statsMap[a.student_id]) {
        statsMap[a.student_id] = { total: 0, present: 0 }
      }
      statsMap[a.student_id].total++
      if (a.status === 'PRESENT') statsMap[a.student_id].present++
    })

    // 4. Calculate percentage and filter
    const lowAttendanceStudents = students.map((student: any) => {
      const stats = statsMap[student.id] || { total: 0, present: 0 }
      const total = stats.total
      const present = stats.present
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0

      return {
        id: student.id,
        enrollmentNo: student.student_id,
        name: student.user?.name || 'Unknown',
        contactEmail: student.contact_email || student.user?.email || '',
        parentEmail: student.parent_email || '',
        course: student.course?.name || 'N/A',
        branch: student.branch?.name || 'N/A',
        totalClasses: total,
        attended: present,
        absent: total - present,
        percentage,
      }
    }).filter(s => s.totalClasses > 0 && s.percentage < 75)

    // Sort ascending by percentage
    lowAttendanceStudents.sort((a, b) => a.percentage - b.percentage)

    return NextResponse.json({ students: lowAttendanceStudents })
  } catch (error: any) {
    logger.error('[ADMIN ALERTS STUDENTS]', error)
    return new NextResponse(`Internal Error: ${error.message}`, { status: 500 })
  }
}
