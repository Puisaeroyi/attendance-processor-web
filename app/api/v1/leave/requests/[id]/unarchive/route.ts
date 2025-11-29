import { NextRequest, NextResponse } from 'next/server'
import { unarchiveRequest } from '@/lib/db/queries'
import { UnarchiveActionSchema } from '@/lib/validators/leaveValidators'
import { requireAuth } from '@/lib/api/auth'

/**
 * POST /api/v1/leave/requests/{id}/unarchive
 * Unarchive a leave request
 *
 * @requires ADMIN role
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check authentication and authorization
  const { user, response } = await requireAuth(['ADMIN'])
  if (response) return response

  try {
    // Validate request ID
    const { id: requestIdStr } = await params
    const requestId = parseInt(requestIdStr)
    if (isNaN(requestId) || requestId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request ID'
        },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = UnarchiveActionSchema.safeParse({
      requestId,
      ...body
    })

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

    const { unarchivedBy, reason } = validation.data

    // Unarchive the request
    const updatedRequest = await unarchiveRequest(requestId, unarchivedBy, reason)

    return NextResponse.json({
      success: true,
      message: 'Leave request unarchived successfully',
      data: updatedRequest
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error unarchiving leave request:', errorMessage)

    // Handle specific error cases
    if (errorMessage.includes('Leave request not found')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Leave request not found'
        },
        { status: 404 }
      )
    }

    if (errorMessage.includes('Request is not archived')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Request is not archived'
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to unarchive leave request',
        message: errorMessage
      },
      { status: 500 }
    )
  }
}