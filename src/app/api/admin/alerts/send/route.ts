import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendStudentDetailedDebarredAlert, sendParentDebarredAlert } from '@/lib/email'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const { students, recipientType } = await req.json()
    // recipientType can be 'STUDENT', 'PARENT', or 'BOTH'

    if (!students || !Array.isArray(students) || students.length === 0) {
      return new NextResponse('students array is required', { status: 400 })
    }

    const monthName = new Date().toLocaleString('default', { month: 'long' })

    const studentIds = students.map((s: any) => s.id)

    // Fetch class-wise attendance data for the selected students
    const { data: attendances, error: attendanceError } = await supabase
      .from('attendance')
      .select('student_id, status, class:classes(id, name)')
      .in('student_id', studentIds)

    if (attendanceError) {
      throw attendanceError
    }

    // Group attendance records by student and class
    const studentClassStats: Record<string, Record<string, { className: string; total: number; present: number }>> = {}

    attendances?.forEach((record: any) => {
      const sId = record.student_id
      const classId = record.class?.id
      const className = record.class?.name || 'Unknown Class'

      if (!classId) return // Fallback just in case

      if (!studentClassStats[sId]) studentClassStats[sId] = {}
      if (!studentClassStats[sId][classId]) {
        studentClassStats[sId][classId] = { className, total: 0, present: 0 }
      }

      studentClassStats[sId][classId].total++
      if (record.status === 'PRESENT') {
        studentClassStats[sId][classId].present++
      }
    })

    const emailPromises: Promise<any>[] = []
    let totalEmailsAttempted = 0

    for (const student of students) {
      const stats = studentClassStats[student.id] || {}
      const classProgress = Object.values(stats).map(stat => ({
        className: stat.className,
        total: stat.total,
        attended: stat.present
      }))

      if ((recipientType === 'STUDENT' || recipientType === 'BOTH') && student.contactEmail) {
        totalEmailsAttempted++
        emailPromises.push(
          sendStudentDetailedDebarredAlert(
            student.name,
            student.contactEmail,
            student.percentage,
            monthName,
            classProgress
          )
        )
      }
      
      if ((recipientType === 'PARENT' || recipientType === 'BOTH') && student.parentEmail) {
        totalEmailsAttempted++
        emailPromises.push(
          sendParentDebarredAlert(
            student.name,
            student.parentEmail,
            student.percentage,
            monthName,
            student.totalClasses,
            student.attended
          )
        )
      }
    }

    if (totalEmailsAttempted === 0) {
      return new NextResponse('No valid email addresses found for the selected recipients', { status: 400 })
    }

    const results = await Promise.allSettled(emailPromises)

    const sent = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return NextResponse.json({
      message: `Emails sent: ${sent}, Failed: ${failed}`,
      sent,
      failed,
      total: totalEmailsAttempted,
    })
  } catch (error: any) {
    console.error('[ADMIN ALERTS SEND]', error)
    return new NextResponse(`Internal Error: ${error.message}`, { status: 500 })
  }
}
