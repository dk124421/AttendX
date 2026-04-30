import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * POST /api/admin/seed-attendance
 * 
 * Seeds random past attendance records.
 * Accepts optional: { teacherName, startDate, endDate }
 * - teacherName: finds teacher by name and seeds for their assigned classes
 * - startDate / endDate: date range (YYYY-MM-DD), defaults to last 30 days
 * 
 * If no teacherName is provided, seeds for the first class found.
 * Working days only (Mon-Fri, skipping Sat & Sun).
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const { teacherName, startDate, endDate } = body

    let targetTeacherId: string | null = null
    let targetClassIds: string[] = []
    let targetClassName = ''

    if (teacherName) {
      // Find teacher by name (case-insensitive partial match)
      const { data: users } = await supabase
        .from('users')
        .select('id, name')
        .ilike('name', `%${teacherName}%`)
        .eq('role', 'TEACHER')

      if (!users || users.length === 0) {
        return new NextResponse(`Teacher "${teacherName}" not found`, { status: 404 })
      }

      const teacherUserId = users[0].id

      // Get teacher profile
      const { data: teacherProfile } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', teacherUserId)
        .single()

      if (!teacherProfile) {
        return new NextResponse('Teacher profile not found', { status: 404 })
      }

      targetTeacherId = teacherProfile.id

      // Get classes assigned to this teacher (via teacher_assignments + class_teacher_id)
      const { data: assignments } = await supabase
        .from('teacher_assignments')
        .select('class_id')
        .eq('teacher_id', targetTeacherId)

      const { data: classTeacherClasses } = await supabase
        .from('classes')
        .select('id, name')
        .eq('class_teacher_id', targetTeacherId)

      const assignedClassIds = new Set<string>()
      assignments?.forEach(a => { if (a.class_id) assignedClassIds.add(a.class_id) })
      classTeacherClasses?.forEach(c => assignedClassIds.add(c.id))

      targetClassIds = Array.from(assignedClassIds)
      targetClassName = `${users[0].name}'s classes`

      if (targetClassIds.length === 0) {
        return new NextResponse(`Teacher "${users[0].name}" has no assigned classes`, { status: 404 })
      }
    } else {
      // Fallback: use first class
      const { data: classes } = await supabase
        .from('classes')
        .select('id, name, class_teacher_id')

      if (!classes || classes.length === 0) {
        return new NextResponse('No classes found', { status: 404 })
      }

      const targetClass = classes.find(c =>
        c.name?.toLowerCase().includes('ai-cs') ||
        c.name?.toLowerCase().includes('b.tech')
      ) || classes[0]

      targetClassIds = [targetClass.id]
      targetTeacherId = targetClass.class_teacher_id
      targetClassName = targetClass.name
    }

    // Get subjects
    const { data: subjects } = await supabase
      .from('subjects')
      .select('id, name')

    if (!subjects || subjects.length === 0) {
      return new NextResponse('No subjects found. Create subjects first.', { status: 404 })
    }

    // Calculate date range
    const end = endDate ? new Date(endDate) : new Date()
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Generate working days (Mon-Fri only, skip Sat & Sun)
    const workingDays: string[] = []
    const current = new Date(start)
    while (current <= end) {
      const dow = current.getDay()
      if (dow !== 0 && dow !== 6) { // Skip Sunday (0) and Saturday (6)
        workingDays.push(current.toISOString().split('T')[0])
      }
      current.setDate(current.getDate() + 1)
    }

    let totalInserted = 0
    const classResults: any[] = []

    for (const classId of targetClassIds) {
      // Get students in this class via class_students junction
      const { data: classStudentLinks } = await supabase
        .from('class_students')
        .select('student:students(id, student_id)')
        .eq('class_id', classId)

      const students = (classStudentLinks || [])
        .map((link: any) => link.student)
        .filter(Boolean)

      if (!students || students.length === 0) continue

      const { data: classInfo } = await supabase
        .from('classes')
        .select('name')
        .eq('id', classId)
        .single()

      const allRecords: any[] = []

      for (const student of students) {
        // Random target attendance between 50% and 90%
        const targetPct = Math.floor(Math.random() * 41) + 50

        for (const subject of subjects) {
          for (const dateStr of workingDays) {
            const roll = Math.random() * 100
            const status = roll < targetPct ? 'PRESENT' : 'ABSENT'

            allRecords.push({
              student_id: student.id,
              class_id: classId,
              subject_id: subject.id,
              teacher_id: targetTeacherId,
              date: `${dateStr}T09:00:00.000Z`,
              status,
            })
          }
        }
      }

      // Insert in batches
      const batchSize = 500
      let inserted = 0

      for (let i = 0; i < allRecords.length; i += batchSize) {
        const batch = allRecords.slice(i, i + batchSize)
        const { error } = await supabase
          .from('attendance')
          .upsert(batch, { onConflict: 'student_id,class_id,subject_id,date' })

        if (error) {
          console.error(`Batch error:`, error)
          throw error
        }
        inserted += batch.length
      }

      // Update streaks
      for (const student of students) {
        const randomStreak = Math.floor(Math.random() * 8)
        await supabase
          .from('students')
          .update({ current_streak: randomStreak })
          .eq('id', student.id)
      }

      totalInserted += inserted
      classResults.push({
        class: classInfo?.name || classId,
        students: students.length,
        records: inserted,
      })
    }

    return NextResponse.json({
      message: 'Seed data created successfully!',
      teacher: teacherName || 'default',
      dateRange: `${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`,
      workingDays: workingDays.length,
      subjects: subjects.length,
      classes: classResults,
      totalRecords: totalInserted,
    })
  } catch (error) {
    console.error('Seed error:', error)
    return new NextResponse('Internal Error: ' + (error as any)?.message, { status: 500 })
  }
}
