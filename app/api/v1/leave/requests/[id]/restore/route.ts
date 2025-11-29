import { NextRequest, NextResponse } from 'next/server'
import { restoreRequest } from '@/lib/db/queries'
import { RestoreActionSchema } from '@/lib/validators/leaveValidators'
import { requireAuth } from '@/lib/api/auth'

/**
 * POST /api/v1/leave/requests/{id}/restore
 * Restore a soft-deleted leave request (admin function)
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
    const validation = RestoreActionSchema.safeParse({
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

    const { restoredBy, reason } = validation.data

    // Restore the request
    const updatedRequest = await restoreRequest(requestId, restoredBy, reason)

    return NextResponse.json({
      success: true,
      message: 'Leave request restored successfully',
      data: updatedRequest
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error restoring leave request:', errorMessage)

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

    if (errorMessage.includes('Request is not deleted')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Request is not deleted'
        },
        { status: 400 }
      )
    }

    if (errorMessage.includes('Cannot restore request deleted more than 7 days ago')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot restore request deleted more than 7 days ago'
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to restore leave request',
        message: errorMessage
      },
      { status: 500 }
    )
  }
}