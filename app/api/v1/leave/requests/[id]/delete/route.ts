import { NextRequest, NextResponse } from 'next/server'
import { deleteRequest } from '@/lib/db/queries'
import { DeleteActionSchema } from '@/lib/validators/leaveValidators'
import { requireAuth } from '@/lib/api/auth'

/**
 * DELETE /api/v1/leave/requests/{id}/delete
 * Soft delete a leave request
 *
 * @requires ADMIN role
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check authentication and authorization
  const { user, response } = await requireAuth(['ADMIN'])
  if (response) return response

  try{
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
    const validation = DeleteActionSchema.safeParse({
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

    const { reason } = validation.data

    // Delete the request
    // Use authenticated user's email instead of client-provided name for security
    const updatedRequest = await deleteRequest(requestId, user!.email, reason)

    return NextResponse.json({
      success: true,
      message: 'Leave request deleted successfully',
      data: updatedRequest,
      warning: 'This request is marked for deletion and will be permanently removed after 7 days. It can be restored within the grace period.'
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error deleting leave request:', errorMessage)

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

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete leave request',
        message: errorMessage
      },
      { status: 500 }
    )
  }
}