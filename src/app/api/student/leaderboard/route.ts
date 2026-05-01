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
    const { searchParams } = new URL(req.url)
    const filterType = searchParams.get('filterType') || 'class' // 'class' | 'course'
    const filterId = searchParams.get('filterId') || ''           // classId or course name

    // Get student profile
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, classes:class_students(class:classes(id, name, department))')
      .eq('user_id', session.user.id)
      .single()

    if (studentError || !student) {
      return NextResponse.json({ top: [], bottom: [], myRank: null, error: 'Student profile not found' })
    }

    const myClasses = student.classes?.map((cs: any) => cs.class).filter(Boolean) || []

    if (myClasses.length === 0) {
      return NextResponse.json({ top: [], bottom: [], myRank: null, error: 'You are not assigned to any class yet' })
    }

    let targetClassIds: string[] = []
    
    if (filterType === 'course' && filterId) {
      // Course-wise: find all classes whose name starts with this course prefix
      // e.g., filterId = "BTECH" → match all classes like "BTECH CS-AI CG&M", "B.TECH CS-AI DAA", "B.TECH All-PME"
      const { data: allClasses } = await supabase
        .from('classes')
        .select('id, name')

      const prefix = filterId.toLowerCase()
      targetClassIds = (allClasses || [])
        .filter((c: any) => {
          const n = c.name.toLowerCase().replace(/[.\-]/g, '')
          const p = prefix.replace(/[.\-]/g, '')
          return n.startsWith(p)
        })
        .map((c: any) => c.id)
    } else if (filterType === 'class' && filterId) {
      // Single class
      targetClassIds = [filterId]
    } else {
      // Default: use student's first assigned class
      targetClassIds = [myClasses[0].id]
    }

    if (targetClassIds.length === 0) {
      return NextResponse.json({ top: [], bottom: [], myRank: null, error: 'No classes found for this filter' })
    }

    // Get all students in the target classes via class_students junction table
    const { data: classStudentLinks, error: csError } = await supabase
      .from('class_students')
      .select('student_id, class_id, student:students(id, student_id, user:users(name))')
      .in('class_id', targetClassIds)

    if (csError) throw csError

    // Deduplicate students (a student may be in multiple target classes)
    const studentMap = new Map<string, any>()
    ;(classStudentLinks || []).forEach((link: any) => {
      if (link.student && !studentMap.has(link.student.id)) {
        studentMap.set(link.student.id, link.student)
      }
    })

    const allStudents = Array.from(studentMap.values())
    if (allStudents.length === 0) {
      return NextResponse.json({ top: [], bottom: [], myRank: null })
    }

    const studentIds = allStudents.map((s: any) => s.id)

    // Get attendance records for these students in target classes
    const { data: attendances, error: attError } = await supabase
      .from('attendance')
      .select('student_id, status')
      .in('class_id', targetClassIds)
      .in('student_id', studentIds)

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

    const results = allStudents.map((s: any) => {
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
    logger.error('[STUDENT LEADERBOARD] Error:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
