import { NextRequest, NextResponse } from 'next/server'
import { archiveRequest } from '@/lib/db/queries'
import { ArchiveActionSchema } from '@/lib/validators/leaveValidators'

/**
 * POST /api/v1/leave/requests/{id}/archive
 * Archive a leave request
 */
export async function POST(
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
    const validation = ArchiveActionSchema.safeParse({
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

    const { archivedBy, reason } = validation.data

    // Archive the request
    const updatedRequest = await archiveRequest(requestId, archivedBy, reason)

    return NextResponse.json({
      success: true,
      message: 'Leave request archived successfully',
      data: updatedRequest
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error archiving leave request:', errorMessage)

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
        error: 'Failed to archive leave request',
        message: errorMessage
      },
      { status: 500 }
    )
  }
}