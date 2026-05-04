import nodemailer from 'nodemailer'

const port = parseInt(process.env.SMTP_PORT || '465')

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: port,
  secure: port === 465, // true for port 465, false for other ports
  requireTLS: port === 587, // force STARTTLS for port 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

interface SendEmailParams {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    })
    console.log(`[EMAIL] Sent to ${to}: ${subject} (${info.messageId})`)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error(`[EMAIL] Failed to send to ${to}:`, error)
    return { success: false, error }
  }
}

// ──────────────── Email Templates ────────────────

export async function sendConsecutiveAbsentAlert(
  studentName: string,
  email: string,
  consecutiveDays: number
) {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
      <div style="background: linear-gradient(135deg, #dc2626, #ef4444); padding: 32px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 24px;">⚠️ Attendance Alert</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Continuous Absence Warning</p>
      </div>
      <div style="padding: 32px;">
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">Dear <strong>${studentName}</strong>,</p>
        <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #991b1b; font-size: 15px; margin: 0; font-weight: 600;">
            You have been absent for <span style="font-size: 20px; color: #dc2626;">${consecutiveDays}</span> consecutive days.
          </p>
        </div>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          This is an automated alert from the AttendX attendance management system. Continuous absence affects your attendance percentage and may lead to debarment from examinations.
        </p>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Please resume your classes immediately or contact your class teacher if you have any valid reason for absence.
        </p>
        <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">This is an automated email from AttendX. Please do not reply.</p>
        </div>
      </div>
    </div>
  `
  return sendEmail({ to: email, subject: `⚠️ Alert: ${consecutiveDays} Days Continuous Absence — AttendX`, html })
}

export async function sendMonthlyAbsentAlert(
  studentName: string,
  email: string,
  absentDays: number,
  monthName: string
) {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
      <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 32px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 24px;">📊 Monthly Absence Alert</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">${monthName} Attendance Report</p>
      </div>
      <div style="padding: 32px;">
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">Dear <strong>${studentName}</strong>,</p>
        <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #92400e; font-size: 15px; margin: 0; font-weight: 600;">
            You have been absent for <span style="font-size: 20px; color: #d97706;">${absentDays}</span> days in ${monthName} (non-consecutive).
          </p>
        </div>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Having 10 or more absent days in a month is a serious concern. Your attendance is being closely monitored by the administration.
        </p>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Please ensure regular attendance to avoid further action including possible debarment from examinations.
        </p>
        <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">This is an automated email from AttendX. Please do not reply.</p>
        </div>
      </div>
    </div>
  `
  return sendEmail({ to: email, subject: `📊 Alert: ${absentDays} Absent Days in ${monthName} — AttendX`, html })
}

export async function sendDebarredAlert(
  studentName: string,
  email: string,
  percentage: number,
  monthName: string
) {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
      <div style="background: linear-gradient(135deg, #7f1d1d, #991b1b); padding: 32px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 24px;">🚫 Debarment Warning</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Attendance Below Required Threshold</p>
      </div>
      <div style="padding: 32px;">
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">Dear <strong>${studentName}</strong>,</p>
        <div style="background: #fef2f2; border-left: 4px solid #7f1d1d; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #7f1d1d; font-size: 15px; margin: 0; font-weight: 600;">
            Your attendance for ${monthName} is <span style="font-size: 24px; color: #dc2626;">${percentage}%</span> which is below the required 75%.
          </p>
        </div>
        <div style="background: #fee2e2; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #991b1b; font-size: 14px; margin: 0; font-weight: 600;">
            ⚠️ You are at risk of being <strong>DEBARRED</strong> from end-semester examinations.
          </p>
        </div>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          This is a formal warning. Please contact your class teacher or Head of Department immediately to discuss your attendance situation.
        </p>
        <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">This is an automated email from AttendX. Please do not reply.</p>
        </div>
      </div>
    </div>
  `
  return sendEmail({ to: email, subject: `🚫 DEBARMENT WARNING: Attendance ${percentage}% — AttendX`, html })
}

interface DebarredStudent {
  name: string
  studentId: string
  percentage: number
  totalClasses: number
  attended: number
  absent: number
}

export async function sendDebarredListToTeacher(
  teacherName: string,
  teacherEmail: string,
  students: DebarredStudent[],
  monthName: string
) {
  const studentRows = students.map((s, i) => `
    <tr style="border-bottom: 1px solid #f1f5f9;">
      <td style="padding: 12px; font-size: 13px; color: #475569;">${i + 1}</td>
      <td style="padding: 12px; font-size: 13px; color: #1e293b; font-weight: 600;">${s.name}</td>
      <td style="padding: 12px; font-size: 13px; color: #64748b; font-family: monospace;">${s.studentId}</td>
      <td style="padding: 12px; font-size: 13px; color: #475569;">${s.totalClasses}</td>
      <td style="padding: 12px; font-size: 13px; color: #16a34a; font-weight: 600;">${s.attended}</td>
      <td style="padding: 12px; font-size: 13px; color: #dc2626; font-weight: 600;">${s.absent}</td>
      <td style="padding: 12px; font-size: 13px; color: ${s.percentage < 50 ? '#dc2626' : '#d97706'}; font-weight: 700;">${s.percentage}%</td>
    </tr>
  `).join('')

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 700px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
      <div style="background: linear-gradient(135deg, #1e3a5f, #2563eb); padding: 32px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 24px;">📋 Monthly Debarred Students List</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">${monthName} — Attendance Below 75%</p>
      </div>
      <div style="padding: 32px;">
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">Dear <strong>${teacherName}</strong>,</p>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          The following <strong style="color: #dc2626;">${students.length}</strong> student(s) have attendance below 75% for the month of ${monthName}:
        </p>
        <div style="overflow-x: auto; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background: #f8fafc;">
                <th style="padding: 12px; font-size: 11px; text-transform: uppercase; color: #64748b; text-align: left; font-weight: 700; letter-spacing: 0.5px;">#</th>
                <th style="padding: 12px; font-size: 11px; text-transform: uppercase; color: #64748b; text-align: left; font-weight: 700; letter-spacing: 0.5px;">Name</th>
                <th style="padding: 12px; font-size: 11px; text-transform: uppercase; color: #64748b; text-align: left; font-weight: 700; letter-spacing: 0.5px;">Enrollment</th>
                <th style="padding: 12px; font-size: 11px; text-transform: uppercase; color: #64748b; text-align: left; font-weight: 700; letter-spacing: 0.5px;">Total</th>
                <th style="padding: 12px; font-size: 11px; text-transform: uppercase; color: #64748b; text-align: left; font-weight: 700; letter-spacing: 0.5px;">Present</th>
                <th style="padding: 12px; font-size: 11px; text-transform: uppercase; color: #64748b; text-align: left; font-weight: 700; letter-spacing: 0.5px;">Absent</th>
                <th style="padding: 12px; font-size: 11px; text-transform: uppercase; color: #64748b; text-align: left; font-weight: 700; letter-spacing: 0.5px;">%</th>
              </tr>
            </thead>
            <tbody>
              ${studentRows}
            </tbody>
          </table>
        </div>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Please take necessary action regarding these students' attendance. Individual debarment warning emails have already been sent to each student.
        </p>
        <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">This is an automated email from AttendX. Please do not reply.</p>
        </div>
      </div>
    </div>
  `
  return sendEmail({
    to: teacherEmail,
    subject: `📋 Debarred Students List — ${monthName} (${students.length} students) — AttendX`,
    html,
  })
}

// ──────────────── Subject-Specific Debarment Alert ────────────────

interface DebarredSubjectAlertParams {
  studentName: string
  email: string
  className: string
  subjectName: string
  currentPercentage: number
  requiredPercentage: number
  totalClasses: number
  attended: number
}

export async function sendDebarredSubjectAlert({
  studentName,
  email,
  className,
  subjectName,
  currentPercentage,
  requiredPercentage,
  totalClasses,
  attended,
}: DebarredSubjectAlertParams) {
  const shortfall = requiredPercentage - currentPercentage
  const classesNeeded = totalClasses > 0
    ? Math.ceil(((requiredPercentage / 100) * (totalClasses + 1) - attended))
    : 0

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
      <div style="background: linear-gradient(135deg, #7f1d1d, #dc2626); padding: 32px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 24px;">🚫 Low Attendance Warning</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">${className} — ${subjectName}</p>
      </div>
      <div style="padding: 32px;">
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">Dear <strong>${studentName}</strong>,</p>
        
        <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #7f1d1d; font-size: 15px; margin: 0; font-weight: 600;">
            Your attendance in <strong>${subjectName}</strong> is currently 
            <span style="font-size: 24px; color: #dc2626;">${currentPercentage}%</span> 
            which is below the required <span style="font-size: 20px; color: #16a34a;">${requiredPercentage}%</span>.
          </p>
        </div>

        <div style="display: flex; gap: 12px; margin: 20px 0;">
          <div style="flex: 1; background: #f8fafc; border-radius: 12px; padding: 16px; text-align: center; border: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 24px; font-weight: 700; color: #1e3a5f;">${totalClasses}</p>
            <p style="margin: 4px 0 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Total Classes</p>
          </div>
          <div style="flex: 1; background: #f0fdf4; border-radius: 12px; padding: 16px; text-align: center; border: 1px solid #bbf7d0;">
            <p style="margin: 0; font-size: 24px; font-weight: 700; color: #16a34a;">${attended}</p>
            <p style="margin: 4px 0 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Attended</p>
          </div>
          <div style="flex: 1; background: #fef2f2; border-radius: 12px; padding: 16px; text-align: center; border: 1px solid #fecaca;">
            <p style="margin: 0; font-size: 24px; font-weight: 700; color: #dc2626;">${totalClasses - attended}</p>
            <p style="margin: 4px 0 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Absent</p>
          </div>
        </div>

        <div style="background: #fee2e2; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #991b1b; font-size: 14px; margin: 0; font-weight: 600;">
            ⚠️ You are short by <strong>${shortfall}%</strong>. You are at risk of being <strong>DEBARRED</strong> from examinations in this subject.
          </p>
        </div>

        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Please resume regular attendance immediately and contact your class teacher if you have a valid reason for absence. Failure to improve your attendance may result in debarment from end-semester examinations.
        </p>

        <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">This is an automated email from AttendX. Please do not reply.</p>
        </div>
      </div>
    </div>
  `
  return sendEmail({
    to: email,
    subject: `🚫 Low Attendance Warning: ${subjectName} (${currentPercentage}%) — ${className} — AttendX`,
    html,
  })
}

// ──────────────── Detailed Admin Alerts (Student vs Parent) ────────────────

export interface ClassProgress {
  className: string
  total: number
  attended: number
}

export async function sendStudentDetailedDebarredAlert(
  studentName: string,
  email: string,
  percentage: number,
  monthName: string,
  classProgress: ClassProgress[]
) {
  const classRows = classProgress.map(c => {
    const classPercent = c.total > 0 ? Math.round((c.attended / c.total) * 100) : 0
    return `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 12px; font-size: 13px; color: #1e293b; font-weight: 500;">${c.className}</td>
        <td style="padding: 12px; font-size: 13px; color: #64748b; text-align: center;">${c.total}</td>
        <td style="padding: 12px; font-size: 13px; color: #16a34a; text-align: center; font-weight: 600;">${c.attended}</td>
        <td style="padding: 12px; font-size: 13px; color: ${classPercent < 75 ? '#dc2626' : '#16a34a'}; text-align: center; font-weight: 700;">${classPercent}%</td>
      </tr>
    `
  }).join('')

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
      <div style="background: linear-gradient(135deg, #7f1d1d, #991b1b); padding: 32px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 24px;">🚫 Official Attendance Warning</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Detailed Attendance Report - ${monthName}</p>
      </div>
      <div style="padding: 32px;">
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">Dear <strong>${studentName}</strong>,</p>
        
        <div style="background: #fef2f2; border-left: 4px solid #7f1d1d; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #7f1d1d; font-size: 15px; margin: 0; font-weight: 600;">
            Your overall attendance is <span style="font-size: 24px; color: #dc2626;">${percentage}%</span> which is below the required 75%.
          </p>
        </div>

        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 12px;">
          Below is the detailed breakdown of your attendance across your assigned classes:
        </p>

        <div style="overflow-x: auto; margin: 20px 0; border: 1px solid #e2e8f0; border-radius: 8px;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f8fafc;">
                <th style="padding: 12px; font-size: 11px; text-transform: uppercase; color: #64748b; text-align: left; font-weight: 700;">Class / Subject</th>
                <th style="padding: 12px; font-size: 11px; text-transform: uppercase; color: #64748b; text-align: center; font-weight: 700;">Total</th>
                <th style="padding: 12px; font-size: 11px; text-transform: uppercase; color: #64748b; text-align: center; font-weight: 700;">Attended</th>
                <th style="padding: 12px; font-size: 11px; text-transform: uppercase; color: #64748b; text-align: center; font-weight: 700;">%</th>
              </tr>
            </thead>
            <tbody>
              ${classRows}
            </tbody>
          </table>
        </div>

        <div style="background: #fee2e2; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #991b1b; font-size: 14px; margin: 0; font-weight: 600;">
            ⚠️ You are at risk of being <strong>DEBARRED</strong> from end-semester examinations.
          </p>
        </div>

        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Please contact your class teacher or Head of Department immediately to discuss your attendance situation.
        </p>

        <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">This is an automated email from AttendX. Please do not reply.</p>
        </div>
      </div>
    </div>
  `
  return sendEmail({ to: email, subject: `🚫 Detailed Attendance Warning: ${percentage}% — AttendX`, html })
}

export async function sendParentDebarredAlert(
  studentName: string,
  email: string,
  percentage: number,
  monthName: string,
  totalClasses: number,
  attended: number
) {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
      <div style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); padding: 32px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 24px;">⚠️ Urgent: Student Attendance Alert</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Notification from the College Administration</p>
      </div>
      <div style="padding: 32px;">
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">Dear Parent/Guardian,</p>
        
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          This is an official communication regarding your ward, <strong>${studentName}</strong>, whose attendance for the month of ${monthName} has fallen below the mandatory requirement.
        </p>

        <div style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #64748b; font-size: 14px;">Total Classes:</span>
            <span style="color: #1e293b; font-weight: 600;">${totalClasses}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #64748b; font-size: 14px;">Classes Attended:</span>
            <span style="color: #16a34a; font-weight: 600;">${attended}</span>
          </div>
          <div style="display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 8px;">
            <span style="color: #475569; font-weight: 600; font-size: 15px;">Overall Attendance:</span>
            <span style="color: #dc2626; font-weight: 700; font-size: 16px;">${percentage}%</span>
          </div>
        </div>

        <div style="background: #fee2e2; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #991b1b; font-size: 14px; margin: 0; font-weight: 600; line-height: 1.6;">
            Please ensure that your child attends college regularly. If there is a valid medical or personal reason for their absence, kindly provide the necessary documentation to the department immediately.
          </p>
        </div>

        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Failure to maintain the minimum required attendance of 75% will result in <strong>debarment from end-semester examinations</strong>.
        </p>

        <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">This is an automated email from AttendX. Please do not reply.</p>
        </div>
      </div>
    </div>
  `
  return sendEmail({ to: email, subject: `⚠️ URGENT: Attendance Alert for ${studentName} — AttendX`, html })
}

// ──────────────── Security Alert ────────────────

export async function sendSecurityAlert(
  name: string,
  email: string,
  ipAddress: string
) {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
      <div style="background: linear-gradient(135deg, #0f172a, #334155); padding: 32px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 24px;">🔒 Security Alert</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Account Locked Due to Suspicious Activity</p>
      </div>
      <div style="padding: 32px;">
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">Dear <strong>${name}</strong>,</p>
        
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          We detected <strong>3 consecutive failed login attempts</strong> for your account. As a security precaution, your account has been temporarily locked for 15 minutes.
        </p>

        <div style="background: #f8fafc; border-left: 4px solid #334155; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #64748b; font-size: 14px;">Attempted From IP:</span>
            <span style="color: #1e293b; font-weight: 600; font-family: monospace;">${ipAddress}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748b; font-size: 14px;">Time:</span>
            <span style="color: #1e293b; font-weight: 600;">${new Date().toLocaleString()}</span>
          </div>
        </div>

        <div style="background: #fee2e2; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #991b1b; font-size: 14px; margin: 0; font-weight: 600; line-height: 1.6;">
            If this was not you, please contact the administrator immediately to secure your account.
          </p>
        </div>

        <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">This is an automated security email from AttendX. Please do not reply.</p>
        </div>
      </div>
    </div>
  `
  return sendEmail({ to: email, subject: `🔒 Security Alert: Account Locked — AttendX`, html })
}
