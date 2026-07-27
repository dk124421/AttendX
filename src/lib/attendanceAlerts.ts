import { supabase } from './supabase'
import { logger } from './logger'
import {
  sendConsecutiveAbsentAlert,
  sendMonthlyAbsentAlert,
  sendDebarredAlert,
  sendDebarredListToTeacher,
} from './email'

// ─────────────────────────────────────────────────────────
// 1. Check if student has been absent for 5+ consecutive days
// ─────────────────────────────────────────────────────────
export async function checkConsecutiveAbsences(studentId: string) {
  try {
    // Get the student's attendance records ordered by date DESC
    const { data: records, error } = await supabase
      .from('attendance')
      .select('date, status')
      .eq('student_id', studentId)
      .order('date', { ascending: false })

    if (error || !records || records.length === 0) return

    // Extract unique dates and their statuses
    const dateMap = new Map<string, string>()
    records.forEach((r: any) => {
      const dateKey = new Date(r.date).toISOString().split('T')[0]
      // If student was present in ANY class that day, mark as PRESENT
      if (!dateMap.has(dateKey) || r.status === 'PRESENT') {
        dateMap.set(dateKey, r.status)
      }
    })

    // Sort dates descending
    const sortedDates = Array.from(dateMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))

    // Count consecutive absent days from the most recent
    let consecutiveAbsentDays = 0
    for (const [, status] of sortedDates) {
      if (status === 'ABSENT') {
        consecutiveAbsentDays++
      } else {
        break
      }
    }

    if (consecutiveAbsentDays >= 5) {
      // Check if alert was already sent recently (within the past 7 days)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)

      const { data: existingAlert } = await supabase
        .from('attendance_alerts')
        .select('id')
        .eq('student_id', studentId)
        .eq('alert_type', 'CONSECUTIVE_ABSENT')
        .gte('sent_at', weekAgo.toISOString())
        .limit(1)

      if (existingAlert && existingAlert.length > 0) {
        logger.info(`[ALERT] Consecutive absent alert already sent recently for student ${studentId}`)
        return
      }

      // Get student's email info
      const studentInfo = await getStudentEmailInfo(studentId)
      if (!studentInfo) return

      // Send email
      const result = await sendConsecutiveAbsentAlert(
        studentInfo.name,
        studentInfo.email,
        consecutiveAbsentDays
      )

      if (result.success) {
        // Record the alert
        await supabase.from('attendance_alerts').insert({
          student_id: studentId,
          alert_type: 'CONSECUTIVE_ABSENT',
          alert_month: new Date().getMonth() + 1,
          alert_year: new Date().getFullYear(),
          details: { consecutiveDays: consecutiveAbsentDays, email: studentInfo.email },
        })
        logger.info(`[ALERT] Consecutive absent alert sent to ${studentInfo.name} (${consecutiveAbsentDays} days)`)
      }

      // Also save as in-app notification
      await supabase.from('notifications').insert({
        user_id: studentInfo.userId,
        title: 'Continuous Absence Warning',
        message: `You have been absent for ${consecutiveAbsentDays} consecutive days. Please resume classes immediately.`,
      })
    }
  } catch (err) {
    logger.error('[ALERT] Error checking consecutive absences', err)
  }
}

// ─────────────────────────────────────────────────────────
// 2. Check if student has 10+ non-consecutive absent days in current month
// ─────────────────────────────────────────────────────────
export async function checkMonthlyNonConsecutiveAbsences(
  studentId: string,
  month: number,
  year: number
) {
  try {
    const startOfMonth = new Date(year, month - 1, 1).toISOString()
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999).toISOString()

    const { data: records, error } = await supabase
      .from('attendance')
      .select('date, status')
      .eq('student_id', studentId)
      .eq('status', 'ABSENT')
      .gte('date', startOfMonth)
      .lte('date', endOfMonth)

    if (error || !records) return

    // Count unique absent dates
    const absentDates = new Set<string>()
    records.forEach((r: any) => {
      absentDates.add(new Date(r.date).toISOString().split('T')[0])
    })

    const absentDays = absentDates.size

    if (absentDays >= 10) {
      // Check if alert was already sent for this month
      const { data: existingAlert } = await supabase
        .from('attendance_alerts')
        .select('id')
        .eq('student_id', studentId)
        .eq('alert_type', 'MONTHLY_ABSENT')
        .eq('alert_month', month)
        .eq('alert_year', year)
        .limit(1)

      if (existingAlert && existingAlert.length > 0) {
        logger.info(`[ALERT] Monthly absent alert already sent for student ${studentId} (${month}/${year})`)
        return
      }

      const studentInfo = await getStudentEmailInfo(studentId)
      if (!studentInfo) return

      const monthName = new Date(year, month - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })

      const result = await sendMonthlyAbsentAlert(
        studentInfo.name,
        studentInfo.email,
        absentDays,
        monthName
      )

      if (result.success) {
        await supabase.from('attendance_alerts').insert({
          student_id: studentId,
          alert_type: 'MONTHLY_ABSENT',
          alert_month: month,
          alert_year: year,
          details: { absentDays, email: studentInfo.email },
        })
        logger.info(`[ALERT] Monthly absent alert sent to ${studentInfo.name} (${absentDays} days in ${monthName})`)
      }

      await supabase.from('notifications').insert({
        user_id: studentInfo.userId,
        title: 'Monthly Absence Alert',
        message: `You have been absent for ${absentDays} days in ${monthName}. Please improve your attendance.`,
      })
    }
  } catch (err) {
    logger.error('[ALERT] Error checking monthly absences', err)
  }
}

// ─────────────────────────────────────────────────────────
// 3. Generate Monthly Debarred Report (<75% attendance)
// ─────────────────────────────────────────────────────────
export async function generateMonthlyDebarredReport(month: number, year: number) {
  try {
    const startOfMonth = new Date(year, month - 1, 1).toISOString()
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999).toISOString()
    const monthName = new Date(year, month - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })

    // Get all students
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select(`
        id,
        student_id,
        contact_email,
        class_id,
        user:users(id, name, email)
      `)

    if (studentsError || !students) {
      logger.error('[DEBARRED] Failed to fetch students', studentsError)
      return { success: false, error: 'Failed to fetch students' }
    }

    // Get all attendance records for the month
    const { data: attendanceRecords, error: attError } = await supabase
      .from('attendance')
      .select('student_id, status')
      .gte('date', startOfMonth)
      .lte('date', endOfMonth)

    if (attError) {
      logger.error('[DEBARRED] Failed to fetch attendance', attError)
      return { success: false, error: 'Failed to fetch attendance' }
    }

    // Calculate per-student statistics
    const statsMap: Record<string, { total: number; present: number }> = {}
    attendanceRecords?.forEach((r: any) => {
      if (!statsMap[r.student_id]) statsMap[r.student_id] = { total: 0, present: 0 }
      statsMap[r.student_id].total++
      if (r.status === 'PRESENT') statsMap[r.student_id].present++
    })

    const debarredStudents: any[] = []
    let emailsSent = 0
    let emailsFailed = 0

    for (const student of students) {
      const stats = statsMap[student.id]
      if (!stats || stats.total === 0) continue

      const percentage = Math.round((stats.present / stats.total) * 100)

      if (percentage < 75) {
        const userName = (student.user as any)?.name || 'Student'
        const userEmail = student.contact_email || (student.user as any)?.email
        const userId = (student.user as any)?.id

        const debarredInfo = {
          name: userName,
          studentId: student.student_id,
          percentage,
          totalClasses: stats.total,
          attended: stats.present,
          absent: stats.total - stats.present,
        }
        debarredStudents.push({ ...debarredInfo, classId: student.class_id, userId })

        // Check if debarred alert already sent for this month
        const { data: existingAlert } = await supabase
          .from('attendance_alerts')
          .select('id')
          .eq('student_id', student.id)
          .eq('alert_type', 'DEBARRED')
          .eq('alert_month', month)
          .eq('alert_year', year)
          .limit(1)

        if (existingAlert && existingAlert.length > 0) {
          logger.info(`[DEBARRED] Alert already sent for ${userName} (${month}/${year})`)
          continue
        }

        if (userEmail && !userEmail.endsWith('@student.attendx.edu')) {
          const result = await sendDebarredAlert(userName, userEmail, percentage, monthName)
          if (result.success) {
            emailsSent++
          } else {
            emailsFailed++
          }
        }

        // Record alert
        await supabase.from('attendance_alerts').insert({
          student_id: student.id,
          alert_type: 'DEBARRED',
          alert_month: month,
          alert_year: year,
          details: { percentage, email: userEmail },
        })

        // In-app notification
        if (userId) {
          await supabase.from('notifications').insert({
            user_id: userId,
            title: '🚫 Debarment Warning',
            message: `Your attendance for ${monthName} is ${percentage}% (below 75%). You are at risk of debarment.`,
          })
        }
      }
    }

    // ─── Send summary list to all teachers who teach these classes ───
    if (debarredStudents.length > 0) {
      const classIds = [...new Set(debarredStudents.map(s => s.classId).filter(Boolean))]

      // Get teachers assigned to these classes
      const { data: assignments } = await supabase
        .from('teacher_assignments')
        .select(`
          teacher:teachers(
            id,
            user:users(name, email)
          )
        `)
        .in('class_id', classIds)

      const sentToTeachers = new Set<string>()

      if (assignments) {
        for (const assignment of assignments) {
          const teacher = (assignment as any).teacher
          if (!teacher?.user?.email) continue
          if (sentToTeachers.has(teacher.user.email)) continue

          const studentsForTeacher = debarredStudents.map(s => ({
            name: s.name,
            studentId: s.studentId,
            percentage: s.percentage,
            totalClasses: s.totalClasses,
            attended: s.attended,
            absent: s.absent,
          }))

          await sendDebarredListToTeacher(
            teacher.user.name || 'Teacher',
            teacher.user.email,
            studentsForTeacher,
            monthName
          )

          sentToTeachers.add(teacher.user.email)
        }
      }
    }

    logger.info(`[DEBARRED] Monthly report complete: ${debarredStudents.length} debarred, ${emailsSent} emails sent, ${emailsFailed} failed`)

    return {
      success: true,
      debarredCount: debarredStudents.length,
      emailsSent,
      emailsFailed,
      debarredStudents: debarredStudents.map(s => ({
        name: s.name,
        studentId: s.studentId,
        percentage: s.percentage,
        totalClasses: s.totalClasses,
        attended: s.attended,
        absent: s.absent,
      })),
    }
  } catch (err) {
    logger.error('[DEBARRED] Error generating report', err)
    return { success: false, error: 'Internal error' }
  }
}

// ─────────────────────────────────────────────────────────
// Helper: Get student's name and email
// ─────────────────────────────────────────────────────────
async function getStudentEmailInfo(studentId: string) {
  const { data: student, error } = await supabase
    .from('students')
    .select(`
      id,
      student_id,
      contact_email,
      user:users(id, name, email)
    `)
    .eq('id', studentId)
    .single()

  if (error || !student) return null

  const user = student.user as any
  const email = student.contact_email || user?.email

  // Don't send to fake virtual emails
  if (!email || email.endsWith('@student.attendx.edu')) {
    logger.info(`[ALERT] No valid email for student ${studentId}, skipping email send`)
    return null
  }

  return {
    name: user?.name || 'Student',
    email,
    userId: user?.id,
  }
}
