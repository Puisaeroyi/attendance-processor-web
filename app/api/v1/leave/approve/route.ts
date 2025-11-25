import { NextRequest, NextResponse } from 'next/server'
import { approveRequest } from '@/lib/db/queries'
import { LeaveActionSchema } from '@/lib/validators/leaveValidators'

/**
 * POST /api/v1/leave/approve
 * Approve a leave request
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validation = LeaveActionSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: validation.error.issues
        },
        { status: 400 }
      )
    }

    const { requestId, adminNotes, approvedBy } = validation.data

    // Approve the request (atomic transaction)
    const updatedRequest = await approveRequest(requestId, approvedBy, adminNotes)

    return NextResponse.json({
      success: true,
      message: 'Leave request approved successfully',
      data: updatedRequest
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error approving leave request:', errorMessage)

    // Handle not found error
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        {
          success: false,
          error: 'Leave request not found'
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to approve leave request',
        message: errorMessage
      },
      { status: 500 }
    )
  }
}
