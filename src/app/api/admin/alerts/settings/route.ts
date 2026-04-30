import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'monthly_alert_date')
      .single()

    if (error) {
      // If table doesn't exist yet, return a default
      if (error.code === '42P01' || error.code === 'PGRST205') {
        return NextResponse.json({ date: '28', requiresSetup: true })
      }
      throw error
    }

    return NextResponse.json({ date: data?.value || '28', requiresSetup: false })
  } catch (error: any) {
    console.error('[SETTINGS GET]', error)
    return NextResponse.json({ date: '28', error: error.message }, { status: 200 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const { date } = await req.json()

    if (!date || isNaN(parseInt(date)) || parseInt(date) < 1 || parseInt(date) > 28) {
      return new NextResponse('Invalid date. Must be between 1 and 28.', { status: 400 })
    }

    const { error } = await supabase
      .from('settings')
      .upsert({ key: 'monthly_alert_date', value: date.toString() }, { onConflict: 'key' })

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') {
        return new NextResponse('Settings table not found. Please run the SQL setup script.', { status: 500 })
      }
      throw error
    }

    return NextResponse.json({ success: true, date })
  } catch (error: any) {
    console.error('[SETTINGS POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
