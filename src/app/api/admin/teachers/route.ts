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
    // Fetch teachers with user info
    const { data: teachers, error } = await supabase
      .from('teachers')
      .select('*, user:users(*)')
    
    if (error) throw error

    // Fetch all teacher_assignments with class and subject info
    const { data: assignments } = await supabase
      .from('teacher_assignments')
      .select('*, class:classes(id, name, year), subject:subjects(id, name, code)')

    // Fetch classes where teacher is class_teacher
    const { data: classTeacherClasses } = await supabase
      .from('classes')
      .select('id, name, year, class_teacher_id')

    // Enrich each teacher with their assigned classes/subjects
    const enriched = (teachers || []).map(t => {
      // Classes from teacher_assignments
      const teacherAssignments = (assignments || []).filter(a => a.teacher_id === t.id)
      const assignedClasses = Array.from(
        new Map(teacherAssignments.filter(a => a.class).map(a => [a.class.id, a.class])).values()
      )
      const assignedSubjects = Array.from(
        new Map(teacherAssignments.filter(a => a.subject).map(a => [a.subject.id, a.subject])).values()
      )

      // Classes where this teacher is class_teacher (but not already in assignments)
      const classTeacherOnly = (classTeacherClasses || [])
        .filter(c => c.class_teacher_id === t.id && !assignedClasses.some((ac: any) => ac.id === c.id))
      
      return {
        ...t,
        assignedClasses: [...assignedClasses, ...classTeacherOnly],
        assignedSubjects,
        totalAssignedClasses: assignedClasses.length + classTeacherOnly.length,
        totalAssignedSubjects: assignedSubjects.length,
      }
    })
    
    return NextResponse.json(enriched)
  } catch (error) {
    logger.error(error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const { id, userId, name, idNumber } = await req.json()

    if (!id || !userId || !name || !idNumber) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    // 1. Update User
    const { error: userError } = await supabase
      .from('users')
      .update({ name })
      .eq('id', userId)

    if (userError) throw userError

    // 2. Update Teacher Profile
    const { error: teacherError } = await supabase
      .from('teachers')
      .update({ teacher_id: idNumber })
      .eq('id', id)

    if (teacherError) throw teacherError

    return NextResponse.json({ message: 'Teacher updated successfully' })
  } catch (error) {
    logger.error(error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const userId = searchParams.get('userId')

    if (!id || !userId) {
      return new NextResponse('Missing id or userId', { status: 400 })
    }

    // Try deleting from teachers explicitly (optional if cascade is on, but safe)
    await supabase.from('teachers').delete().eq('id', id)

    // Delete user
    const { error: userError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (userError) {
      console.warn("User deletion failed, may have active references:", userError);
      return new NextResponse('Cannot delete user (might have active relations)', { status: 400 })
    }

    return NextResponse.json({ message: 'Teacher deleted successfully' })
  } catch (error) {
    logger.error(error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
