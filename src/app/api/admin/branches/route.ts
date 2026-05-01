import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logger } from '@/lib/logger'

// GET — List branches, optionally filtered by courseId
export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get('courseId')

    let query = supabase
      .from('branches')
      .select('*, course:courses(id, name)')
      .order('name')

    if (courseId) {
      query = query.eq('course_id', courseId)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    logger.error(error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

// POST — Create a new branch under a course
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const { name, courseId } = await req.json()

    if (!name || !name.trim() || !courseId) {
      return new NextResponse('Branch name and courseId are required', { status: 400 })
    }

    const { data, error } = await supabase
      .from('branches')
      .insert([{ name: name.trim(), course_id: courseId }])
      .select('*, course:courses(id, name)')
      .single()

    if (error) {
      if (error.code === '23505') {
        return new NextResponse('This branch already exists in this course', { status: 409 })
      }
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    logger.error(error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

// PUT — Update a branch name
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
      .from('branches')
      .update({ name: name.trim() })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ message: 'Branch updated successfully' })
  } catch (error) {
    logger.error(error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

// DELETE — Delete a branch
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return new NextResponse('Missing branch id', { status: 400 })
    }

    // Clear students referencing this branch
    await supabase
      .from('students')
      .update({ branch_id: null })
      .eq('branch_id', id)

    const { error } = await supabase
      .from('branches')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ message: 'Branch deleted successfully' })
  } catch (error) {
    logger.error(error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
