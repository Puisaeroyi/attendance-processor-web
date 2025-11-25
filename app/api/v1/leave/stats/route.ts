import { NextResponse } from 'next/server'
import prisma from '@/lib/db/client'
import { getDashboardStats } from '@/lib/db/queries'

/**
 * GET /api/v1/leave/stats
 * Get dashboard statistics
 */
export async function GET() {
  try {
    // Get counts by status using the enhanced query function
    const stats = await getDashboardStats()
    const { total: totalRequests, pending: pendingCount, approved: approvedCount, denied: deniedCount } = stats

    // Get recent requests (last 10)
    const recentRequests = await prisma.leaveRequest.findMany({
      take: 10,
      orderBy: { submittedAt: 'desc' },
      select: {
        id: true,
        employeeName: true,
        leaveType: true,
        startDate: true,
        endDate: true,
        status: true,
        submittedAt: true
      }
    })

    // Get upcoming leaves (approved, start date in future)
    const upcomingLeaves = await prisma.leaveRequest.findMany({
      where: {
        status: 'APPROVED',
        startDate: { gte: new Date() }
      },
      orderBy: { startDate: 'asc' },
      take: 10,
      select: {
        id: true,
        employeeName: true,
        leaveType: true,
        startDate: true,
        endDate: true,
        durationDays: true
      }
    })

    // Calculate total approved days this month
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const approvedThisMonth = await prisma.leaveRequest.findMany({
      where: {
        status: 'APPROVED',
        startDate: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth
        }
      },
      select: {
        durationDays: true
      }
    })

    const totalApprovedDaysThisMonth = approvedThisMonth.reduce(
      (sum, req) => sum + req.durationDays,
      0
    )

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          total: totalRequests,
          pending: pendingCount,
          approved: approvedCount,
          denied: deniedCount,
          archived: stats.archived,
          deleted: stats.deleted,
          approvedDaysThisMonth: totalApprovedDaysThisMonth
        },
        recentRequests,
        upcomingLeaves
      }
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error fetching stats:', errorMessage)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch statistics',
        message: errorMessage
      },
      { status: 500 }
    )
  }
}
