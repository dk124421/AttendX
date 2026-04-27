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
    // Fetch counts in parallel
    const [studentsRes, teachersRes, classesRes] = await Promise.all([
      supabase.from('students').select('id', { count: 'exact', head: true }),
      supabase.from('teachers').select('id', { count: 'exact', head: true }),
      supabase.from('classes').select('id', { count: 'exact', head: true }),
    ])

    const totalStudents = studentsRes.count ?? 0
    const totalTeachers = teachersRes.count ?? 0
    const totalClasses = classesRes.count ?? 0

    // Calculate today's attendance percentage
    const today = new Date().toISOString().split('T')[0]

    const { data: todayRecords } = await supabase
      .from('attendance')
      .select('status')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)

    let attendancePercentage = 0
    if (todayRecords && todayRecords.length > 0) {
      const presentCount = todayRecords.filter((r: any) => r.status === 'PRESENT').length
      attendancePercentage = Math.round((presentCount / todayRecords.length) * 100)
    }

    // Get recent classes with teacher info
    const { data: recentClasses } = await supabase
      .from('classes')
      .select('id, name, year, department, class_teacher_id, teacher:teachers(id, user:users(name))')
      .order('created_at', { ascending: false })
      .limit(4)

    // ── Class-wise today's attendance stats ──
    const { data: allClasses } = await supabase
      .from('classes')
      .select('id, name')

    let classAttendance: { id: string; name: string; present: number; total: number }[] = []

    if (allClasses && allClasses.length > 0) {
      // Get total students per class
      const { data: allStudents } = await supabase
        .from('students')
        .select('id, class_id')

      // Get today's attendance records
      const { data: todayAll } = await supabase
        .from('attendance')
        .select('student_id, class_id, status')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)

      classAttendance = allClasses.map((cls: any) => {
        const classStudents = allStudents?.filter((s: any) => s.class_id === cls.id) || []
        const classRecords = todayAll?.filter((r: any) => r.class_id === cls.id) || []
        const presentCount = classRecords.filter((r: any) => r.status === 'PRESENT').length
        return {
          id: cls.id,
          name: cls.name,
          present: presentCount,
          total: classStudents.length,
        }
      })
    }

    // Get student counts per class
    const classIds = (recentClasses || []).map(c => c.id)
    let classCounts: Record<string, number> = {}
    if (classIds.length > 0) {
      const { data: students } = await supabase
        .from('students')
        .select('class_id')
        .in('class_id', classIds)

      for (const s of (students || [])) {
        if (s.class_id) {
          classCounts[s.class_id] = (classCounts[s.class_id] || 0) + 1
        }
      }
    }

    // Enrich classes with student count
    const enrichedClasses = (recentClasses || []).map(c => ({
      ...c,
      studentCount: classCounts[c.id] || 0,
      teacherName: (c as any).teacher?.user?.name || null,
    }))

    return NextResponse.json({
      totalStudents,
      totalTeachers,
      totalClasses,
      attendancePercentage,
      recentClasses: enrichedClasses,
      classAttendance,
    })
  } catch (error) {
    console.error(error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
