import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { logger } from '@/lib/logger'

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const { userId, newPassword } = await req.json()

    if (!userId || !newPassword) {
      return new NextResponse('Missing userId or newPassword', { status: 400 })
    }

    if (newPassword.length < 4) {
      return new NextResponse('Password must be at least 4 characters', { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    const { error } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', userId)

    if (error) throw error

    return NextResponse.json({ message: 'Password updated successfully' })
  } catch (error) {
    logger.error(error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
