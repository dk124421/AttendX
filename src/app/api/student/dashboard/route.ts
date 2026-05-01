import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logger } from '@/lib/logger'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'STUDENT') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*, classes:class_students(class:classes(id, name, department, year))')
      .eq('user_id', session.user.id)
      .single()

    if (studentError || !student) return new NextResponse('Student profile not found', { status: 404 })

    const { data: attendances, error: attendanceError } = await supabase
      .from('attendance')
      .select(`
        *,
        class:classes(id, name)
      `)
      .eq('student_id', student.id)
      .order('date', { ascending: true })

    if (attendanceError) throw attendanceError

    // Calculate overall percentage
    const totalClasses = attendances.length
    const presentClasses = attendances.filter((a: any) => a.status === 'PRESENT').length
    const overallPercentage = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0

    // Group by class for class progress
    const classStats: Record<string, { name: string; total: number; present: number }> = {}
    attendances.forEach((record: any) => {
      const className = record.class?.name || 'Unknown Class'
      const classId = record.class_id
      if (!classStats[classId]) {
        classStats[classId] = { name: className, total: 0, present: 0 }
      }
      classStats[classId].total++
      if (record.status === 'PRESENT') {
        classStats[classId].present++
      }
    })

    const classProgress = Object.keys(classStats).map(classId => ({
      className: classStats[classId].name,
      totalClasses: classStats[classId].total,
      attendedClasses: classStats[classId].present,
      percentage: classStats[classId].total > 0
        ? (classStats[classId].present / classStats[classId].total) * 100
        : 0
    }))

    // Today's attendance
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayEnd = new Date(today)
    todayEnd.setHours(23, 59, 59, 999)

    const todayAttendance = attendances
      .filter((a: any) => {
        const d = new Date(a.date)
        return d >= today && d <= todayEnd
      })
      .map((a: any) => ({
        subject: a.class?.name || 'Class',
        status: a.status
      }))

    const todayPresent = todayAttendance.filter((a: any) => a.status === 'PRESENT').length
    const todayTotal = todayAttendance.length
    const todayPercentage = todayTotal > 0 ? Math.round((todayPresent / todayTotal) * 100) : 0

    // ── Calculate Real Streak ──
    // Group attendance by date, check consecutive days with at least one PRESENT
    const dateMap: Record<string, boolean> = {}
    attendances.forEach((a: any) => {
      const dateStr = new Date(a.date).toISOString().split('T')[0]
      if (a.status === 'PRESENT') {
        dateMap[dateStr] = true
      } else if (!(dateStr in dateMap)) {
        dateMap[dateStr] = false
      }
    })

    // Count consecutive present days going back from today
    let currentStreak = 0
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    
    // Start from today and go backwards
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(now)
      checkDate.setDate(checkDate.getDate() - i)
      const dateStr = checkDate.toISOString().split('T')[0]
      
      if (dateMap[dateStr] === true) {
        currentStreak++
      } else if (dateMap[dateStr] === false) {
        // There was attendance taken but student was absent → break streak
        break
      } else {
        // No attendance records for this day
        // If it's today and no records yet, skip (don't break streak)
        if (i === 0) continue
        // For past days with no records (could be weekend/holiday), skip
        // But if we've already started counting, break after 2 consecutive empty days
        const prevDate = new Date(now)
        prevDate.setDate(prevDate.getDate() - i - 1)
        const prevStr = prevDate.toISOString().split('T')[0]
        if (!(prevStr in dateMap)) {
          // Two consecutive days with no records — likely a gap, stop counting
          break
        }
        // Single day gap (weekend/holiday) — continue
        continue
      }
    }

    return NextResponse.json({
      overallPercentage: Math.round(overallPercentage),
      currentStreak,
      classProgress,
      todayAttendance,
      todayPercentage,
      recentAttendances: attendances.slice(-5)
    })
  } catch (error) {
    logger.error(error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
