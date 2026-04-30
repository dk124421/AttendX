import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendDebarredAlert } from '@/lib/email'

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

    const emailsToSend: { studentName: string; email: string; percentage: number }[] = []

    for (const student of students) {
      if ((recipientType === 'STUDENT' || recipientType === 'BOTH') && student.contactEmail) {
        emailsToSend.push({
          studentName: student.name,
          email: student.contactEmail,
          percentage: student.percentage,
        })
      }
      if ((recipientType === 'PARENT' || recipientType === 'BOTH') && student.parentEmail) {
        // We still address the parent email with the student's name, or we could change the template. 
        // For now, using the student's name is standard for parent notifications.
        emailsToSend.push({
          studentName: student.name,
          email: student.parentEmail,
          percentage: student.percentage,
        })
      }
    }

    if (emailsToSend.length === 0) {
      return new NextResponse('No valid email addresses found for the selected recipients', { status: 400 })
    }

    const results = await Promise.allSettled(
      emailsToSend.map(info =>
        sendDebarredAlert(info.studentName, info.email, info.percentage, monthName)
      )
    )

    const sent = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return NextResponse.json({
      message: `Emails sent: ${sent}, Failed: ${failed}`,
      sent,
      failed,
      total: emailsToSend.length,
    })
  } catch (error: any) {
    console.error('[ADMIN ALERTS SEND]', error)
    return new NextResponse(`Internal Error: ${error.message}`, { status: 500 })
  }
}
