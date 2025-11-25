import { NextRequest, NextResponse } from 'next/server'
import { getLeaveRequests } from '@/lib/db/queries'
import { LeaveRequestFiltersSchema } from '@/lib/validators/leaveValidators'

/**
 * GET /api/v1/leave/requests
 * List all leave requests with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const filters = {
      status: searchParams.get('status') || undefined,
      employeeName: searchParams.get('employeeName') || undefined,
      managerName: searchParams.get('managerName') || undefined,
      leaveType: searchParams.get('leaveType') || undefined,
      startDate: searchParams.get('startDate')
        ? new Date(searchParams.get('startDate')!)
        : undefined,
      endDate: searchParams.get('endDate')
        ? new Date(searchParams.get('endDate')!)
        : undefined,
      includeArchived: searchParams.get('includeArchived') === 'true',
      includeDeleted: searchParams.get('includeDeleted') === 'true'
    }

    // Fetch requests with filters
    const requests = await getLeaveRequests(filters)

    return NextResponse.json({
      success: true,
      count: requests.length,
      data: requests
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error fetching leave requests:', errorMessage)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch leave requests',
        message: errorMessage
      },
      { status: 500 }
    )
  }
}
