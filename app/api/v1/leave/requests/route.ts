import { NextRequest, NextResponse } from 'next/server'
import { getLeaveRequests, createLeaveRequest } from '@/lib/db/queries'
import { requireAuth } from '@/lib/api/auth'

/**
 * GET /api/v1/leave/requests
 * List all leave requests with optional filters
 * - USER role: Only see their own requests
 * - MANAGER/ADMIN role: See all requests
 */
export async function GET(request: NextRequest) {
  try {
    const { user, response } = await requireAuth()
    if (response) return response

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const filters: {
      status?: string
      employeeName?: string
      managerName?: string
      leaveType?: string
      startDate?: Date
      endDate?: Date
      includeArchived?: boolean
      includeDeleted?: boolean
      userId?: string
    } = {
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

    // If user is regular USER, only show their own requests
    if (user!.role === 'USER') {
      filters.userId = user!.id
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

/**
 * POST /api/v1/leave/requests
 * Create a new leave request
 */
export async function POST(request: NextRequest) {
  try {
    const { user, response } = await requireAuth()
    if (response) return response

    const body = await request.json()
    const { fullName, managerName, leaveType, startDate, endDate, shiftType, reason } = body

    // Validate required fields
    if (!fullName || !managerName || !leaveType || !startDate || !endDate || !reason) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Calculate duration
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    let durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

    // Adjust for half days
    if (shiftType === 'Morning Half' || shiftType === 'Afternoon Half') {
      durationDays = durationDays * 0.5
    }

    // Create leave request
    const leaveRequest = await createLeaveRequest({
      formResponseId: `WEB-${Date.now()}-${user!.id}`,
      userId: user!.id,
      employeeName: fullName,
      managerName,
      leaveType,
      startDate: start,
      endDate: end,
      shiftType: shiftType || 'Full Day',
      reason,
      durationDays: Math.ceil(durationDays),
      submittedAt: new Date()
    })

    return NextResponse.json({
      success: true,
      message: 'Leave request submitted successfully',
      data: leaveRequest
    }, { status: 201 })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error creating leave request:', errorMessage)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create leave request',
        message: errorMessage
      },
      { status: 500 }
    )
  }
}
