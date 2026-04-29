import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendDebarredSubjectAlert } from '@/lib/email'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TEACHER') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const body = await req.json()
    const { classId, subjectId, students } = body

    if (!classId || !students || !Array.isArray(students) || students.length === 0) {
      return new NextResponse('classId and students[] are required', { status: 400 })
    }

    // Verify teacher is assigned to this class
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

    // Get class & subject names
    const { data: classData } = await supabase
      .from('classes')
      .select('name, year')
      .eq('id', classId)
      .single()

    let subjectName = 'General'
    if (subjectId) {
      const { data: subjectData } = await supabase
        .from('subjects')
        .select('name')
        .eq('id', subjectId)
        .single()
      subjectName = subjectData?.name || 'General'
    }

    const className = classData?.name || 'Unknown Class'

    // Send emails to each debarred student
    const results = await Promise.allSettled(
      students.map((student: any) =>
        sendDebarredSubjectAlert({
          studentName: student.name,
          email: student.email,
          className,
          subjectName,
          currentPercentage: student.percentage,
          requiredPercentage: 75,
          totalClasses: student.totalClasses,
          attended: student.attended,
        })
      )
    )

    const sent = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length

    return NextResponse.json({
      message: `Emails sent: ${sent}, Failed: ${failed}`,
      sent,
      failed,
      total: students.length,
    })
  } catch (error) {
    console.error('[SEND DEBARRED ALERTS]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
