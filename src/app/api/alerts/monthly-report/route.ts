import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateMonthlyDebarredReport } from '@/lib/attendanceAlerts'
import { logger } from '@/lib/logger'

// POST /api/alerts/monthly-report
// Manually trigger the monthly debarred report
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session || !['ADMIN', 'TEACHER'].includes(session.user.role)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const body = await req.json()
    let { month, year } = body

    // Default to current month/year
    if (!month || !year) {
      const now = new Date()
      month = month || now.getMonth() + 1
      year = year || now.getFullYear()
    }

    logger.info(`[MONTHLY REPORT] Generating report for ${month}/${year} (triggered by ${session.user.email})`)

    const result = await generateMonthlyDebarredReport(month, year)

    return NextResponse.json(result)
  } catch (error) {
    logger.error('[MONTHLY REPORT] Error:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
