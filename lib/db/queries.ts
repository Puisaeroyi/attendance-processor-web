import prisma from './client'
import { Prisma } from '@prisma/client'

/**
 * Create a new leave request
 */
export async function createLeaveRequest(data: {
  formResponseId?: string
  userId?: string
  employeeName: string
  managerName: string
  leaveType: string
  startDate: Date
  endDate: Date
  shiftType: string
  reason: string
  durationDays: number
  submittedAt: Date
}) {
  return await prisma.leaveRequest.create({
    data,
    include: {
      approvals: true
    }
  })
}

/**
 * Get all leave requests with optional filters
 */
export async function getLeaveRequests(filters?: {
  status?: string
  employeeName?: string
  managerName?: string
  leaveType?: string
  startDate?: Date
  endDate?: Date
  includeArchived?: boolean
  includeDeleted?: boolean
  userId?: string
}) {
  const where: Prisma.LeaveRequestWhereInput = {}

  // Handle status-based filtering for archived/deleted requests
  if (filters?.status === 'ARCHIVED') {
    // When filtering by ARCHIVED status, only return archived requests
    where.archivedAt = { not: null }
    where.deletedAt = null // Exclude deleted requests even when filtering archived
  } else if (filters?.status === 'DELETED') {
    // When filtering by DELETED status, only return deleted requests
    where.deletedAt = { not: null }
  } else {
    // For all other statuses, apply default inclusion/exclusion rules
    if (!filters?.includeArchived) {
      where.archivedAt = null
    }
    if (!filters?.includeDeleted) {
      where.deletedAt = null
    }
  }

  // Apply status filter (but not for ARCHIVED/DELETED as those are handled above)
  if (filters?.status && filters.status !== 'ARCHIVED' && filters.status !== 'DELETED') {
    where.status = filters.status
  }

  if (filters?.employeeName) {
    where.employeeName = { contains: filters.employeeName }
  }
  if (filters?.managerName) {
    where.managerName = filters.managerName
  }
  if (filters?.leaveType) {
    where.leaveType = filters.leaveType
  }
  if (filters?.startDate) {
    where.startDate = { gte: filters.startDate }
  }
  if (filters?.endDate) {
    where.endDate = { lte: filters.endDate }
  }
  if (filters?.userId) {
    where.userId = filters.userId
  }

  return await prisma.leaveRequest.findMany({
    where,
    include: {
      approvals: true
    },
    orderBy: { submittedAt: 'desc' }
  })
}

/**
 * Get pending leave requests
 */
export async function getPendingRequests() {
  return await prisma.leaveRequest.findMany({
    where: { status: 'PENDING' },
    include: { approvals: true },
    orderBy: { submittedAt: 'desc' }
  })
}

/**
 * Get a single leave request by ID
 */
export async function getLeaveRequestById(id: number) {
  return await prisma.leaveRequest.findUnique({
    where: { id },
    include: {
      approvals: true
    }
  })
}

/**
 * Check if a form response already exists
 */
export async function formResponseExists(formResponseId: string): Promise<boolean> {
  const count = await prisma.leaveRequest.count({
    where: { formResponseId }
  })
  return count > 0
}

/**
 * Approve a leave request (atomic transaction)
 */
export async function approveRequest(
  requestId: number,
  approvedBy: string,
  adminNotes?: string
) {
  return await prisma.$transaction(async (tx) => {
    // Update request status
    const updatedRequest = await tx.leaveRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        updatedAt: new Date()
      }
    })

    // Create approval record
    await tx.leaveApproval.create({
      data: {
        requestId,
        action: 'APPROVED',
        approvedBy,
        adminNotes
      }
    })

    // Log action in audit trail
    await tx.auditLog.create({
      data: {
        entityType: 'leave_request',
        entityId: requestId,
        action: 'APPROVED',
        performedBy: approvedBy,
        status: 'SUCCESS',
        metadata: JSON.stringify({ notes: adminNotes })
      }
    })

    return updatedRequest
  })
}

/**
 * Deny a leave request (atomic transaction)
 */
export async function denyRequest(
  requestId: number,
  deniedBy: string,
  adminNotes?: string
) {
  return await prisma.$transaction(async (tx) => {
    // Update request status
    const updatedRequest = await tx.leaveRequest.update({
      where: { id: requestId },
      data: {
        status: 'DENIED',
        updatedAt: new Date()
      }
    })

    // Create approval record (action = DENIED)
    await tx.leaveApproval.create({
      data: {
        requestId,
        action: 'DENIED',
        approvedBy: deniedBy,
        adminNotes
      }
    })

    // Log action in audit trail
    await tx.auditLog.create({
      data: {
        entityType: 'leave_request',
        entityId: requestId,
        action: 'DENIED',
        performedBy: deniedBy,
        status: 'SUCCESS',
        metadata: JSON.stringify({ notes: adminNotes })
      }
    })

    return updatedRequest
  })
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats() {
  const [
    total,
    pending,
    approved,
    denied,
    archived,
    deleted
  ] = await Promise.all([
    // Count active requests (not archived or deleted)
    prisma.leaveRequest.count({
      where: {
        archivedAt: null,
        deletedAt: null
      }
    }),
    prisma.leaveRequest.count({
      where: { status: 'PENDING', archivedAt: null, deletedAt: null }
    }),
    prisma.leaveRequest.count({
      where: { status: 'APPROVED', archivedAt: null, deletedAt: null }
    }),
    prisma.leaveRequest.count({
      where: { status: 'DENIED', archivedAt: null, deletedAt: null }
    }),
    prisma.leaveRequest.count({
      where: { archivedAt: { not: null }, deletedAt: null }
    }),
    prisma.leaveRequest.count({
      where: { deletedAt: { not: null } }
    })
  ])

  return {
    total,
    pending,
    approved,
    denied,
    archived,
    deleted
  }
}

/**
 * Get audit logs for a specific leave request
 */
export async function getAuditLogs(requestId: number) {
  return await prisma.auditLog.findMany({
    where: {
      entityType: 'leave_request',
      entityId: requestId
    },
    orderBy: { timestamp: 'desc' }
  })
}

/**
 * Archive a leave request (atomic transaction)
 */
export async function archiveRequest(
  requestId: number,
  archivedBy: string,
  reason?: string
) {
  return await prisma.$transaction(async (tx) => {
    // Get the current request for audit trail
    const currentRequest = await tx.leaveRequest.findUnique({
      where: { id: requestId }
    })

    if (!currentRequest) {
      throw new Error('Leave request not found')
    }

    // Update request with archive info
    const updatedRequest = await tx.leaveRequest.update({
      where: { id: requestId },
      data: {
        archivedAt: new Date(),
        archivedBy,
        archiveReason: reason || null,
        updatedAt: new Date()
      }
    })

    // Log action in audit trail
    await tx.auditLog.create({
      data: {
        entityType: 'leave_request',
        entityId: requestId,
        action: 'ARCHIVED',
        performedBy: archivedBy,
        status: 'SUCCESS',
        metadata: JSON.stringify({
          previousStatus: currentRequest.status,
          archiveReason: reason || null,
          timestamp: new Date().toISOString()
        })
      }
    })

    return updatedRequest
  })
}

/**
 * Delete (soft delete) a leave request (atomic transaction)
 */
export async function deleteRequest(
  requestId: number,
  deletedBy: string,
  reason: string
) {
  return await prisma.$transaction(async (tx) => {
    // Get the current request for audit trail
    const currentRequest = await tx.leaveRequest.findUnique({
      where: { id: requestId }
    })

    if (!currentRequest) {
      throw new Error('Leave request not found')
    }

    // Update request with delete info
    const updatedRequest = await tx.leaveRequest.update({
      where: { id: requestId },
      data: {
        deletedAt: new Date(),
        deletedBy,
        deleteReason: reason,
        updatedAt: new Date()
      }
    })

    // Log action in audit trail
    await tx.auditLog.create({
      data: {
        entityType: 'leave_request',
        entityId: requestId,
        action: 'DELETED',
        performedBy: deletedBy,
        status: 'SUCCESS',
        metadata: JSON.stringify({
          previousStatus: currentRequest.status,
          deleteReason: reason,
          timestamp: new Date().toISOString()
        })
      }
    })

    return updatedRequest
  })
}

/**
 * Unarchive a leave request (atomic transaction)
 */
export async function unarchiveRequest(
  requestId: number,
  unarchivedBy: string,
  reason?: string
) {
  return await prisma.$transaction(async (tx) => {
    // Get the current request for audit trail
    const currentRequest = await tx.leaveRequest.findUnique({
      where: { id: requestId }
    })

    if (!currentRequest) {
      throw new Error('Leave request not found')
    }

    if (!currentRequest.archivedAt) {
      throw new Error('Request is not archived')
    }

    // Update request to remove archive info
    const updatedRequest = await tx.leaveRequest.update({
      where: { id: requestId },
      data: {
        archivedAt: null,
        archivedBy: null,
        archiveReason: null,
        updatedAt: new Date()
      }
    })

    // Log action in audit trail
    await tx.auditLog.create({
      data: {
        entityType: 'leave_request',
        entityId: requestId,
        action: 'UNARCHIVED',
        performedBy: unarchivedBy,
        status: 'SUCCESS',
        metadata: JSON.stringify({
          currentStatus: currentRequest.status,
          unarchiveReason: reason || null,
          timestamp: new Date().toISOString()
        })
      }
    })

    return updatedRequest
  })
}

/**
 * Restore a soft-deleted leave request (admin function) (atomic transaction)
 */
export async function restoreRequest(
  requestId: number,
  restoredBy: string,
  reason?: string
) {
  return await prisma.$transaction(async (tx) => {
    // Get the current request for audit trail
    const currentRequest = await tx.leaveRequest.findUnique({
      where: { id: requestId }
    })

    if (!currentRequest) {
      throw new Error('Leave request not found')
    }

    if (!currentRequest.deletedAt) {
      throw new Error('Request is not deleted')
    }

    // Check if within 7-day grace period
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    if (currentRequest.deletedAt < sevenDaysAgo) {
      throw new Error('Cannot restore request deleted more than 7 days ago')
    }

    // Update request to remove delete info
    const updatedRequest = await tx.leaveRequest.update({
      where: { id: requestId },
      data: {
        deletedAt: null,
        deletedBy: null,
        deleteReason: null,
        updatedAt: new Date()
      }
    })

    // Log action in audit trail
    await tx.auditLog.create({
      data: {
        entityType: 'leave_request',
        entityId: requestId,
        action: 'RESTORED',
        performedBy: restoredBy,
        status: 'SUCCESS',
        metadata: JSON.stringify({
          restoredFromStatus: currentRequest.status,
          restoreReason: reason || null,
          timestamp: new Date().toISOString()
        })
      }
    })

    return updatedRequest
  })
}
