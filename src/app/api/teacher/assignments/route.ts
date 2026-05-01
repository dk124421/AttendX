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
    // 1. Get this teacher's profile
    const { data: teacherProfile, error: tpError } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (tpError || !teacherProfile) {
      return NextResponse.json([])
    }

    const teacherId = teacherProfile.id

    // 2. Fetch subject-level assignments (teacher_assignments table)
    const { data: subjectAssignments, error: saError } = await supabase
      .from('teacher_assignments')
      .select('*, class:classes(*), subject:subjects(*)')
      .eq('teacher_id', teacherId)

    if (saError) {
      logger.error('Supabase Error fetching assignments:', saError.message)
      throw saError
    }

    // 3. Fetch classes where this teacher is the class teacher (class_teacher_id)
    const { data: classTeacherClasses, error: ctError } = await supabase
      .from('classes')
      .select('*')
      .eq('class_teacher_id', teacherId)

    if (ctError) {
      logger.error('Supabase Error fetching class-teacher classes:', ctError.message)
      throw ctError
    }

    // 4. Merge: start with subject assignments
    const result = [...(subjectAssignments || [])]

    // 5. For classes where the teacher is class teacher but has no subject assignment,
    //    add a synthetic entry so those classes still appear in the panel
    const assignedClassIds = new Set(result.map((a: any) => a.class_id || a.class?.id))

    for (const cls of (classTeacherClasses || [])) {
      if (!assignedClassIds.has(cls.id)) {
        // Add a synthetic assignment entry (no subject) so the class appears
        result.push({
          id: `ct_${cls.id}`,
          teacher_id: teacherId,
          class_id: cls.id,
          subject_id: null,
          class: cls,
          subject: null,
          isClassTeacher: true,
        })
      }
    }

    return NextResponse.json(result)
  } catch (error: any) {
    logger.error('Assignments API Error:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
