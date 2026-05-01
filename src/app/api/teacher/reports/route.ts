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
  const subjectId = searchParams.get('subjectId')

  if (!classId || !subjectId) {
    return new NextResponse('classId and subjectId are required', { status: 400 })
  }

  try {
    // Get all students in this class via class_students junction table
    const { data: classStudentLinks, error: csError } = await supabase
      .from('class_students')
      .select('student:students(id, student_id, user:users(name))')
      .eq('class_id', classId)

    if (csError) throw csError

    const students = (classStudentLinks || [])
      .map((link: any) => link.student)
      .filter(Boolean)

    if (students.length === 0) {
      return NextResponse.json([])
    }

    // Get attendance records for this class + subject
    const studentIds = students.map((s: any) => s.id)
    const { data: attendances, error: attError } = await supabase
      .from('attendance')
      .select('student_id, status')
      .eq('class_id', classId)
      .eq('subject_id', subjectId)
      .in('student_id', studentIds)

    if (attError) throw attError

    // Calculate stats per student
    const statsMap: Record<string, { total: number; present: number }> = {}
    attendances?.forEach((a: any) => {
      if (!statsMap[a.student_id]) {
        statsMap[a.student_id] = { total: 0, present: 0 }
      }
      statsMap[a.student_id].total++
      if (a.status === 'PRESENT') statsMap[a.student_id].present++
    })

    const results = students.map((s: any) => {
      const stats = statsMap[s.id] || { total: 0, present: 0 }
      const percentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0
      return {
        id: s.id,
        studentId: s.student_id,
        name: (s.user as any)?.name || 'Unknown',
        totalClasses: stats.total,
        attended: stats.present,
        absent: stats.total - stats.present,
        percentage
      }
    })

    // Sort by percentage ascending (low attendance first)
    results.sort((a: any, b: any) => a.percentage - b.percentage)

    return NextResponse.json(results)
  } catch (error) {
    logger.error(error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
