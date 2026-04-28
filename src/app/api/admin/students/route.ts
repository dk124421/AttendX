import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const { name, enrollmentNumber, password, courseId, branchId, year, contactEmail, parentEmail } = await req.json()

    if (!name || !enrollmentNumber || !password) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    // Check if enrollment number already exists
    const { data: existing } = await supabase
      .from('students')
      .select('id')
      .eq('student_id', enrollmentNumber)
      .maybeSingle()

    if (existing) {
      return new NextResponse('Enrollment number already exists', { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // Create virtual email from enrollment number
    const virtualEmail = `${enrollmentNumber}@student.attendx.edu`

    // 1. Create User (same name is allowed)
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert([{ name, email: virtualEmail, password: hashedPassword, role: 'STUDENT' }])
      .select()
      .single()

    if (userError) {
      if (userError.code === '23505') {
        return new NextResponse('Enrollment number already exists', { status: 400 })
      }
      throw userError
    }

    // 2. Create Student Profile with course, branch, year, parent_email
    const studentInsert: any = {
      user_id: user.id,
      student_id: enrollmentNumber,
    }
    if (courseId) studentInsert.course_id = courseId
    if (branchId) studentInsert.branch_id = branchId
    if (year) studentInsert.year = year
    if (contactEmail) studentInsert.contact_email = contactEmail
    studentInsert.parent_email = parentEmail || 'priyalbaldwa10@gmail.com'

    const { error: studentError } = await supabase
      .from('students')
      .insert([studentInsert])

    if (studentError) throw studentError

    return NextResponse.json(user)
  } catch (error) {
    console.error(error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const { data, error } = await supabase
      .from('students')
      .select('*, user:users(id, name, email, created_at), classes:class_students(class:classes(id, name, year, department))')
      .order('student_id', { ascending: true })

    if (error) throw error

    // Transform data to maintain backward compatibility where possible and expose classes array
    const transformed = data.map((s: any) => ({
      ...s,
      classes: s.classes?.map((cs: any) => cs.class).filter(Boolean) || [],
      // For legacy UI support, pick the first class as 'class'
      class: s.classes?.[0]?.class || null
    }))

    return NextResponse.json(transformed)
  } catch (error) {
    console.error(error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}


export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const { id, userId, name, enrollmentNumber, courseId, branchId, year, contactEmail, parentEmail } = await req.json()

    if (!id || !userId || !name || !enrollmentNumber) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    // 1. Update User
    const { error: userError } = await supabase
      .from('users')
      .update({ name })
      .eq('id', userId)

    if (userError) throw userError

    // 2. Update Student Profile with course, branch, year, parent_email
    const studentUpdate: any = {
      student_id: enrollmentNumber,
      course_id: courseId || null,
      branch_id: branchId || null,
      year: year || null,
      contact_email: contactEmail || null,
      parent_email: parentEmail || 'priyalbaldwa10@gmail.com',
    }

    const { error: studentError } = await supabase
      .from('students')
      .update(studentUpdate)
      .eq('id', id)

    if (studentError) throw studentError

    return NextResponse.json({ message: 'Student updated successfully' })
  } catch (error) {
    console.error(error)
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

    const { error: userError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (userError) {
      console.warn("User deletion failed:", userError);
      return new NextResponse('Cannot delete user (might have active relations)', { status: 400 })
    }

    return NextResponse.json({ message: 'Student deleted successfully' })
  } catch (error) {
    console.error(error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
