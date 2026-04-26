import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/admin/calendar — fetch events for a month
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    let query = supabase.from('calendar_events').select('*')

    if (month && year) {
      const startDate = `${year}-${month.padStart(2, '0')}-01`
      const endDate = new Date(Number(year), Number(month), 0).toISOString().split('T')[0]
      query = query.gte('date', startDate).lte('date', endDate)
    }

    const { data, error } = await query.order('date', { ascending: true })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('[CALENDAR] GET Error:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

// POST /api/admin/calendar — create event (admin only)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const { title, date, type } = await req.json()

    if (!title || !date || !type) {
      return new NextResponse('Missing required fields: title, date, type', { status: 400 })
    }

    const { data, error } = await supabase
      .from('calendar_events')
      .insert([{
        title,
        date,
        type, // HOLIDAY, EVENT, EXAM
        created_by: session.user.id,
      }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('[CALENDAR] POST Error:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

// DELETE /api/admin/calendar — delete event (admin only)
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return new NextResponse('Missing event id', { status: 400 })
    }

    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ message: 'Event deleted' })
  } catch (error) {
    console.error('[CALENDAR] DELETE Error:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
