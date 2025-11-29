import { NextRequest, NextResponse } from 'next/server'
import { denyRequest } from '@/lib/db/queries'
import { LeaveActionSchema } from '@/lib/validators/leaveValidators'
import { requireAuth } from '@/lib/api/auth'

/**
 * POST /api/v1/leave/deny
 * Deny a leave request
 *
 * @requires ADMIN, MANAGER role
 */
export async function POST(request: NextRequest) {
  // Check authentication and authorization
  const { user, response } = await requireAuth(['ADMIN', 'MANAGER'])
  if (response) return response

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

    const { requestId, adminNotes } = validation.data

    // Deny the request (atomic transaction)
    // Use authenticated user's email instead of client-provided name for security
    const updatedRequest = await denyRequest(requestId, user!.email, adminNotes)

    return NextResponse.json({
      success: true,
      message: 'Leave request denied successfully',
      data: updatedRequest
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error denying leave request:', errorMessage)

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
        error: 'Failed to deny leave request',
        message: errorMessage
      },
      { status: 500 }
    )
  }
}
