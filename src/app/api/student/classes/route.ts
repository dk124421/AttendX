import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'STUDENT') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    // Get student profile with class info
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select(`
        id,
        student_id,
        class_id,
        class:classes(id, name, department, year)
      `)
      .eq('user_id', session.user.id)
      .single()

    if (studentError || !student) {
      return new NextResponse('Student profile not found', { status: 404 })
    }

    // Get subjects assigned to this class via TeacherAssignment
    const { data: assignments, error: assignError } = await supabase
      .from('teacher_assignments')
      .select(`
        id,
        subject:subjects(id, name, code),
        teacher:teachers(
          id,
          user:users(name)
        )
      `)
      .eq('class_id', student.class_id)

    if (assignError) throw assignError

    // De-duplicate subjects (same subject might be assigned to different teachers)
    const subjectMap = new Map()
    assignments?.forEach((a: any) => {
      if (a.subject && !subjectMap.has(a.subject.id)) {
        subjectMap.set(a.subject.id, {
          id: a.subject.id,
          name: a.subject.name,
          code: a.subject.code,
          teacher: a.teacher?.user?.name || 'Unassigned'
        })
      }
    })

    // Fetch attendance records for calendar view
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('attendance')
      .select('date, status, subject:subjects(name)')
      .eq('student_id', student.id)
      .eq('class_id', student.class_id)

    if (attendanceError) throw attendanceError

    return NextResponse.json({
      class: student.class,
      subjects: Array.from(subjectMap.values()),
      attendance: attendanceRecords || []
    })
  } catch (error) {
    console.error(error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
