import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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
    // Verify teacher is assigned to this class
    const { data: teacherProfile } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (!teacherProfile) {
      return new NextResponse('Teacher profile not found', { status: 404 })
    }

    // Verify teacher is assigned to this class (via teacher_assignments OR class_teacher_id)
    const { data: assignment } = await supabase
      .from('teacher_assignments')
      .select('id')
      .eq('teacher_id', teacherProfile.id)
      .eq('class_id', classId)
      .limit(1)

    // Also check if teacher is the class teacher
    const { data: classTeacher } = await supabase
      .from('classes')
      .select('id')
      .eq('id', classId)
      .eq('class_teacher_id', teacherProfile.id)
      .limit(1)

    if ((!assignment || assignment.length === 0) && (!classTeacher || classTeacher.length === 0)) {
      return new NextResponse('Not assigned to this class', { status: 403 })
    }

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
      return NextResponse.json({ all: [] })
    }

    // Get all attendance records for these students in this class
    const studentIds = students.map((s: any) => s.id)
    const { data: attendances, error: attError } = await supabase
      .from('attendance')
      .select('student_id, status')
      .eq('class_id', classId)
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
      const percentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100 * 10) / 10 : 0
      return {
        id: s.id,
        studentId: s.student_id,
        name: (s.user as any)?.name || 'Unknown',
        avatar: ((s.user as any)?.name || 'U').substring(0, 2).toUpperCase(),
        totalClasses: stats.total,
        attended: stats.present,
        percentage,
      }
    })

    // Sort descending by percentage
    results.sort((a: any, b: any) => b.percentage - a.percentage)

    // Assign ranks
    results.forEach((r: any, i: number) => {
      r.rank = i + 1
    })

    // Return all students
    return NextResponse.json({ all: results })
  } catch (error) {
    console.error(error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
