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
    // ── 1. Monthly attendance trend (last 6 months) ──
    const months: { label: string; start: string; end: string }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const year = d.getFullYear()
      const month = d.getMonth()
      const start = new Date(year, month, 1).toISOString()
      const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString()
      months.push({
        label: d.toLocaleString('default', { month: 'short' }),
        start,
        end,
      })
    }

    const trendPromises = months.map(async (m) => {
      const { data } = await supabase
        .from('attendance')
        .select('status')
        .gte('created_at', m.start)
        .lte('created_at', m.end)

      const total = data?.length || 0
      const present = data?.filter((r: any) => r.status === 'PRESENT').length || 0
      return {
        label: m.label,
        percentage: total > 0 ? Math.round((present / total) * 100) : 0,
      }
    })

    const attendanceTrend = await Promise.all(trendPromises)

    // ── 2. Class-wise attendance comparison ──
    const { data: allClasses } = await supabase
      .from('classes')
      .select('id, name')

    const { data: allAttendance } = await supabase
      .from('attendance')
      .select('class_id, status')

    const classComparison = (allClasses || []).map((cls: any) => {
      const records = (allAttendance || []).filter((r: any) => r.class_id === cls.id)
      const total = records.length
      const present = records.filter((r: any) => r.status === 'PRESENT').length
      return {
        name: cls.name,
        percentage: total > 0 ? Math.round((present / total) * 100) : 0,
      }
    })

    // ── 3. Overall status distribution ──
    const totalAll = allAttendance?.length || 0
    const presentAll = allAttendance?.filter((r: any) => r.status === 'PRESENT').length || 0
    const absentAll = allAttendance?.filter((r: any) => r.status === 'ABSENT').length || 0
    const lateAll = totalAll - presentAll - absentAll

    const statusDistribution = {
      present: totalAll > 0 ? Math.round((presentAll / totalAll) * 100) : 0,
      absent: totalAll > 0 ? Math.round((absentAll / totalAll) * 100) : 0,
      late: totalAll > 0 ? Math.round((lateAll / totalAll) * 100) : 0,
    }

    // ── 4. Top performing students ──
    const { data: allStudents } = await supabase
      .from('students')
      .select('id, student_id, user:users(name)')

    const studentStats = (allStudents || []).map((s: any) => {
      const records = (allAttendance || []).filter((r: any) => r.student_id === s.id)
      const total = records.length
      const present = records.filter((r: any) => r.status === 'PRESENT').length
      return {
        name: (s.user as any)?.name || 'Unknown',
        studentId: s.student_id,
        percentage: total > 0 ? Math.round((present / total) * 100) : 0,
        totalRecords: total,
      }
    })
      .filter((s: any) => s.totalRecords > 0)
      .sort((a: any, b: any) => b.percentage - a.percentage)
      .slice(0, 10)

    // ── 5. Low attendance students (below 75%) ──
    const lowAttendance = (allStudents || []).map((s: any) => {
      const records = (allAttendance || []).filter((r: any) => r.student_id === s.id)
      const total = records.length
      const present = records.filter((r: any) => r.status === 'PRESENT').length
      return {
        name: (s.user as any)?.name || 'Unknown',
        studentId: s.student_id,
        percentage: total > 0 ? Math.round((present / total) * 100) : 0,
        totalRecords: total,
      }
    })
      .filter((s: any) => s.totalRecords > 0 && s.percentage < 75)
      .sort((a: any, b: any) => a.percentage - b.percentage)
      .slice(0, 10)

    return NextResponse.json({
      attendanceTrend,
      classComparison,
      statusDistribution,
      topStudents: studentStats,
      lowAttendance,
    })
  } catch (error) {
    console.error(error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
