import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'STUDENT') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const subjectId = searchParams.get('subjectId')

    // Get student profile and class_id
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, class_id')
      .eq('user_id', session.user.id)
      .single()

    if (studentError || !student) {
      console.error('[STUDENT LEADERBOARD] Student profile not found:', studentError)
      return NextResponse.json({ top: [], bottom: [], myRank: null, error: 'Student profile not found' })
    }

    if (!student.class_id) {
      console.warn('[STUDENT LEADERBOARD] Student has no class assigned:', student.id)
      return NextResponse.json({ top: [], bottom: [], myRank: null, error: 'You are not assigned to any class yet' })
    }

    const classId = student.class_id

    // Get all students in the same class
    const { data: classmates, error: classmatesError } = await supabase
      .from('students')
      .select('id, student_id, user:users(name)')
      .eq('class_id', classId)

    if (classmatesError) throw classmatesError
    if (!classmates || classmates.length === 0) {
      return NextResponse.json({ top: [], bottom: [], myRank: null })
    }

    const studentIds = classmates.map((s: any) => s.id)

    // Get attendance records for all classmates in this class
    let query = supabase
      .from('attendance')
      .select('student_id, status')
      .eq('class_id', classId)
      .in('student_id', studentIds)

    if (subjectId === 'general') {
      query = query.is('subject_id', null)
    } else if (subjectId && subjectId !== 'overall') {
      query = query.eq('subject_id', subjectId)
    }

    const { data: attendances, error: attError } = await query

    if (attError) throw attError

    // Calculate stats per student
    const statsMap: Record<string, { total: number; present: number }> = {}
    attendances?.forEach((a: any) => {
      if (!statsMap[a.student_id]) {
        statsMap[a.student_id] = { total: 0, present: 0 }
      }
      statsMap[a.student_id].total++
      if (a.status === 'PRESENT') statsMap[a.student_id].present++
    })

    const results = classmates.map((s: any) => {
      const stats = statsMap[s.id] || { total: 0, present: 0 }
      const percentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100 * 10) / 10 : 0
      return {
        id: s.id,
        studentId: s.student_id,
        name: (s.user as any)?.name || 'Unknown',
        avatar: ((s.user as any)?.name || 'U').substring(0, 2).toUpperCase(),
        totalClasses: stats.total,
        attended: stats.present,
        percentage,
        isMe: s.id === student.id,
      }
    })

    // Sort descending
    results.sort((a: any, b: any) => b.percentage - a.percentage)
    results.forEach((r: any, i: number) => { r.rank = i + 1 })

    const top = results.slice(0, 5)
    const bottom = results.length > 5
      ? results.slice(-5).reverse()
      : results.slice().reverse()

    const myEntry = results.find((r: any) => r.isMe) || null

    return NextResponse.json({ top, bottom, myRank: myEntry })
  } catch (error) {
    console.error('[STUDENT LEADERBOARD] Error:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
