import { NextRequest, NextResponse } from 'next/server'
import { deleteRequest } from '@/lib/db/queries'
import { DeleteActionSchema } from '@/lib/validators/leaveValidators'

/**
 * DELETE /api/v1/leave/requests/{id}/delete
 * Soft delete a leave request
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { deletedBy, reason } = validation.data

    // Delete the request
    const updatedRequest = await deleteRequest(requestId, deletedBy, reason)

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