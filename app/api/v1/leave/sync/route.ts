import { NextResponse } from 'next/server'
import { formsPoller } from '@/lib/services/googleFormsPoller'
import { parseFormResponses, validateLeaveRequest } from '@/lib/parsers/formResponseParser'
import { createLeaveRequest, formResponseExists } from '@/lib/db/queries'
import prisma from '@/lib/db/client'

/**
 * POST /api/v1/leave/sync
 * Manually trigger synchronization with Google Forms
 */
export async function POST() {
  try {
    console.log('🔄 Starting Google Forms sync...')

    // Fetch form responses
    const responses = await formsPoller.fetchFormResponses()
    console.log(`📥 Fetched ${responses.length} form response(s)`)

    if (responses.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No form responses to sync',
        synced: 0,
        skipped: 0,
        errors: 0
      })
    }

    // Parse responses
    const parsed = parseFormResponses(responses)
    console.log(`✅ Parsed ${parsed.length} response(s)`)

    // Track results
    let synced = 0
    let skipped = 0
    let errors = 0

    // Process each parsed response
    for (const request of parsed) {
      try {
        // Validate request
        if (!validateLeaveRequest(request)) {
          console.warn(`⚠️  Invalid request from ${request.employeeName}`)
          errors++
          continue
        }

        // Check if already exists (deduplication)
        const exists = await formResponseExists(request.formResponseId)
        if (exists) {
          console.log(`⏭️  Skipping duplicate: ${request.formResponseId}`)
          skipped++
          continue
        }

        // Create leave request
        const created = await createLeaveRequest(request)

        // Create audit log
        await prisma.auditLog.create({
          data: {
            entityType: 'leave_request',
            entityId: created.id,
            action: 'CREATED',
            performedBy: 'SYSTEM',
            details: JSON.stringify({
              source: 'google_forms',
              syncedAt: new Date().toISOString()
            })
          }
        })

        console.log(`✅ Created leave request for ${request.employeeName}`)
        synced++
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error(`❌ Error processing request:`, errorMessage)
        errors++
      }
    }

    console.log(`\n📊 Sync Summary:`)
    console.log(`   - Synced: ${synced}`)
    console.log(`   - Skipped: ${skipped}`)
    console.log(`   - Errors: ${errors}`)

    return NextResponse.json({
      success: true,
      message: 'Sync completed',
      synced,
      skipped,
      errors,
      total: responses.length
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Sync failed:', errorMessage)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to sync with Google Forms',
        message: errorMessage
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/v1/leave/sync
 * Check sync service status
 */
export async function GET() {
  try {
    // Verify Google Forms API connection
    const connected = await formsPoller.verifyConnection()

    if (!connected) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Unable to connect to Google Forms API'
        },
        { status: 503 }
      )
    }

    // Get last sync time from audit log
    const lastSync = await prisma.auditLog.findFirst({
      where: {
        action: 'CREATED',
        performedBy: 'SYSTEM'
      },
      orderBy: { timestamp: 'desc' }
    })

    return NextResponse.json({
      status: 'healthy',
      connected: true,
      lastSyncAt: lastSync?.timestamp || null,
      message: 'Google Forms sync service is operational'
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      {
        status: 'error',
        message: errorMessage
      },
      { status: 500 }
    )
  }
}
