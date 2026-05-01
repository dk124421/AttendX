import { NextResponse } from 'next/server'
import { generateMonthlyDebarredReport } from '@/lib/attendanceAlerts'
import { logger } from '@/lib/logger'

// GET /api/alerts/cron
// Intended to be called by an external cron service (e.g., Vercel Cron, cron-job.org)
// at the end of each month to auto-generate the debarred report.
//
// Setup: Add a cron job that hits this endpoint with the secret key:
//   GET https://your-domain.com/api/alerts/cron?secret=YOUR_CRON_SECRET
//
// For Vercel: Add to vercel.json:
//   { "crons": [{ "path": "/api/alerts/cron", "schedule": "0 0 28-31 * *" }] }

export async function GET(req: Request) {
  try {
    // Simple secret-based auth for cron endpoint
    const { searchParams } = new URL(req.url)
    const secret = searchParams.get('secret')
    const cronSecret = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET

    if (secret !== cronSecret) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()

    logger.info(`[CRON] Auto-generating monthly debarred report for ${month}/${year}`)

    const result = await generateMonthlyDebarredReport(month, year)

    return NextResponse.json({
      message: `Cron report generated for ${month}/${year}`,
      ...result,
    })
  } catch (error) {
    logger.error('[CRON] Error:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
