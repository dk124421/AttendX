import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logger } from '@/lib/logger'

// GET — List all courses with their branch count
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*, branches(*)')
      .order('name')

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    logger.error(error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

// POST — Create a new course
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const { name } = await req.json()

    if (!name || !name.trim()) {
      return new NextResponse('Course name is required', { status: 400 })
    }

    const { data, error } = await supabase
      .from('courses')
      .insert([{ name: name.trim() }])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return new NextResponse('A course with this name already exists', { status: 409 })
      }
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    logger.error(error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

// PUT — Update a course name
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const { id, name } = await req.json()

    if (!id || !name || !name.trim()) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const { error } = await supabase
      .from('courses')
      .update({ name: name.trim() })
      .eq('id', id)

    if (error) {
      if (error.code === '23505') {
        return new NextResponse('A course with this name already exists', { status: 409 })
      }
      throw error
    }

    return NextResponse.json({ message: 'Course updated successfully' })
  } catch (error) {
    logger.error(error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

// DELETE — Delete a course (cascades to branches)
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return new NextResponse('Missing course id', { status: 400 })
    }

    // Clear students referencing this course
    await supabase
      .from('students')
      .update({ course_id: null, branch_id: null })
      .eq('course_id', id)

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ message: 'Course deleted successfully' })
  } catch (error) {
    logger.error(error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
