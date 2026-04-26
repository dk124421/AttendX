import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const { name, code, sem, year } = await req.json()
    const { data: subject, error } = await supabase
      .from('subjects')
      .insert([{ name, code, sem, year }])
      .select()
      .single()

    if (error) throw error
    
    return NextResponse.json(subject)
  } catch (error) {
    console.error(error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function GET() {
  const { data: subjects, error } = await supabase
    .from('subjects')
    .select('*')
  
  if (error) {
    console.error(error)
    return new NextResponse('Internal Error', { status: 500 })
  }
  
  return NextResponse.json(subjects)
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const { id, name, code, sem, year } = await req.json()

    if (!id) {
      return new NextResponse('Missing subject id', { status: 400 })
    }

    const { data: subject, error } = await supabase
      .from('subjects')
      .update({ name, code, sem, year })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(subject)
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

    if (!id) {
      return new NextResponse('Missing subject id', { status: 400 })
    }

    // Delete any teacher_assignments referencing this subject first
    await supabase
      .from('teacher_assignments')
      .delete()
      .eq('subject_id', id)

    // Delete the subject
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ message: 'Subject deleted successfully' })
  } catch (error) {
    console.error(error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
