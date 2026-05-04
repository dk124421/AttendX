import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { logger } from '@/lib/logger'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*, teacher:teachers(teacher_id), student:students(student_id, class:classes(name))')
    
    if (error) throw error
    
    return NextResponse.json(users)
  } catch (error) {
    logger.error(error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const { name, idNumber, password, contactEmail } = await req.json()

    if (!name || !idNumber || !password) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // Create virtual email from teacher ID
    const virtualEmail = `${idNumber}@teacher.attendx.edu`

    // 1. Create User
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert([{ name, email: virtualEmail, password: hashedPassword, role: 'TEACHER' }])
      .select()
      .single()

    if (userError) throw userError

    // 2. Create Teacher Profile
    const finalContactEmail = contactEmail || 'priyalbaldwa10@gmail.com';
    const { error: teacherError } = await supabase
      .from('teachers')
      .insert([{ user_id: user.id, teacher_id: idNumber, contact_email: finalContactEmail }])

    if (teacherError) throw teacherError

    return NextResponse.json(user)
  } catch (error) {
    logger.error(error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
