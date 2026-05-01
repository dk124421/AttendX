import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logger } from '@/lib/logger'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const { name, department, year, classTeacherId, studentIds } = await req.json()

    if (!name || !year) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    // 1. Create the class
    const { data: newClass, error } = await supabase
      .from('classes')
      .insert([{
        name,
        department,
        year,
        class_teacher_id: classTeacherId || null
      }])
      .select()
      .single()

    if (error) throw error

    // 2. If studentIds provided, assign those students to this class
    if (studentIds && studentIds.length > 0) {
      const inserts = studentIds.map((studentId: string) => ({
        class_id: newClass.id,
        student_id: studentId
      }))
      const { error: assignError } = await supabase
        .from('class_students')
        .insert(inserts)

      if (assignError) {
        logger.error('Failed to assign students to class:', assignError)
        // Class was created successfully, but student assignment failed
        return NextResponse.json({
          ...newClass,
          warning: 'Class created but some students could not be assigned'
        })
      }
    }

    return NextResponse.json(newClass)
  } catch (error) {
    logger.error(error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function GET() {
  const { data: classes, error } = await supabase
    .from('classes')
    .select('*, teacher:teachers(*, user:users(*))')

  if (error) {
    logger.error(error)
    return new NextResponse('Internal Error', { status: 500 })
  }

  // For each class, also fetch the count of students
  const classIds = classes?.map(c => c.id) || []

  if (classIds.length > 0) {
    const { data: classStudents } = await supabase
      .from('class_students')
      .select('class_id, student:students(id, user:users(name), student_id)')
      .in('class_id', classIds)

    // Attach student count and list to each class
    const enriched = classes?.map(cls => {
      const clsStudents = classStudents?.filter(cs => cs.class_id === cls.id).map(cs => cs.student) || []
      return {
        ...cls,
        students: clsStudents,
        studentCount: clsStudents.length
      }
    })

    return NextResponse.json(enriched)
  }

  return NextResponse.json(classes?.map(c => ({ ...c, students: [], studentCount: 0 })))
}

// PUT — Update class (edit details + reassign students)
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const { id, name, department, year, classTeacherId, studentIds } = await req.json()

    if (!id) {
      return new NextResponse('Missing class id', { status: 400 })
    }

    // 1. Update class details
    const updateData: any = {}
    if (name) updateData.name = name
    if (department !== undefined) updateData.department = department
    if (year) updateData.year = year
    if (classTeacherId !== undefined) updateData.class_teacher_id = classTeacherId || null

    const { error: classError } = await supabase
      .from('classes')
      .update(updateData)
      .eq('id', id)

    if (classError) throw classError

    // 2. Reassign students if provided
    if (studentIds !== undefined) {
      // First, unassign all current students from this class
      await supabase
        .from('class_students')
        .delete()
        .eq('class_id', id)

      // Then assign the new set of students
      if (studentIds.length > 0) {
        const inserts = studentIds.map((studentId: string) => ({
          class_id: id,
          student_id: studentId
        }))
        const { error: assignError } = await supabase
          .from('class_students')
          .insert(inserts)

        if (assignError) throw assignError
      }
    }

    return NextResponse.json({ message: 'Class updated successfully' })
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

    if (!id) {
      return new NextResponse('Missing class id', { status: 400 })
    }

    // Unassign all students from this class first
    await supabase
      .from('class_students')
      .delete()
      .eq('class_id', id)

    // Delete the class
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ message: 'Class deleted successfully' })
  } catch (error) {
    logger.error(error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
