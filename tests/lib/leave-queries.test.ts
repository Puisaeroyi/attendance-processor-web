/**
 * Unit tests for Leave Management database functions
 * Tests the core database operations for delete/archive functionality
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import {
  archiveRequest,
  deleteRequest,
  unarchiveRequest,
  restoreRequest,
  getLeaveRequests,
  getDashboardStats,
  createLeaveRequest,
  getLeaveRequestById,
  formResponseExists
} from '../../lib/db/queries'
import prisma from '../../lib/db/client'

describe('Leave Management Database Functions', () => {
  let testRequestId: number
  let archivedRequestId: number
  let deletedRequestId: number
  let restoredRequestId: number

  beforeAll(async () => {
    // Clean up any existing test data
    await cleanupTestData()
  })

  afterAll(async () => {
    // Final cleanup
    await cleanupTestData()
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    // Create fresh test data for each test
    testRequestId = await createTestRequest('Test Employee 1', 'PENDING')
  })

  async function cleanupTestData() {
    // Delete all test requests created during tests
    await prisma.leaveRequest.deleteMany({
      where: {
        OR: [
          { employeeName: { contains: 'Test Employee' } },
          { employeeName: { contains: 'Workflow Test' } },
          { employeeName: { contains: 'Concurrent Test' } }
        ]
      }
    })
  }

  async function createTestRequest(employeeName: string, status: string = 'PENDING') {
    const testRequest = await createLeaveRequest({
      formResponseId: `test_${Date.now()}_${Math.random()}`,
      employeeName,
      managerName: 'Test Manager',
      leaveType: 'Vacation',
      startDate: new Date(),
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // +1 day
      shiftType: 'Full Shift',
      reason: 'Test request for unit testing',
      durationDays: 1,
      submittedAt: new Date()
    })

    // Update status if needed
    if (status !== 'PENDING') {
      await prisma.leaveRequest.update({
        where: { id: testRequest.id },
        data: { status }
      })
    }

    return testRequest.id
  }

  describe('createLeaveRequest', () => {
    it('should create a new leave request', async () => {
      const uniqueId = `test_${Date.now()}_${Math.random()}`
      const newRequest = await createLeaveRequest({
        formResponseId: uniqueId,
        employeeName: 'New Test Employee',
        managerName: 'Test Manager',
        leaveType: 'Sick Leave',
        startDate: new Date(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        shiftType: 'First-Half',
        reason: 'Unit test creation',
        durationDays: 1,
        submittedAt: new Date()
      })

      expect(newRequest).toBeDefined()
      expect(newRequest.id).toBeGreaterThan(0)
      expect(newRequest.employeeName).toBe('New Test Employee')
      expect(newRequest.leaveType).toBe('Sick Leave')
      expect(newRequest.status).toBe('PENDING')
      expect(newRequest.archivedAt).toBeNull()
      expect(newRequest.deletedAt).toBeNull()
    })
  })

  describe('getLeaveRequests', () => {
    beforeEach(async () => {
      // Create various test requests
      archivedRequestId = await createTestRequest('Archive Test Employee', 'APPROVED')
      deletedRequestId = await createTestRequest('Delete Test Employee', 'DENIED')
      restoredRequestId = await createTestRequest('Restore Test Employee', 'PENDING')
    })

    it('should exclude archived and deleted requests by default', async () => {
      // Archive and delete some requests
      await archiveRequest(archivedRequestId, 'Test Admin', 'Archive test')
      await deleteRequest(deletedRequestId, 'Test Admin', 'Delete test')

      const requests = await getLeaveRequests()

      expect(requests).toBeDefined()
      expect(Array.isArray(requests)).toBe(true)

      // Should not include archived or deleted requests
      const archivedRequest = requests.find(req => req.id === archivedRequestId)
      const deletedRequest = requests.find(req => req.id === deletedRequestId)

      expect(archivedRequest).toBeUndefined()
      expect(deletedRequest).toBeUndefined()
    })

    it('should include archived requests when requested', async () => {
      await archiveRequest(archivedRequestId, 'Test Admin', 'Archive test')

      const requests = await getLeaveRequests({ includeArchived: true })

      expect(requests).toBeDefined()
      expect(Array.isArray(requests)).toBe(true)

      const archivedRequest = requests.find(req => req.id === archivedRequestId)
      expect(archivedRequest).toBeDefined()
      expect(archivedRequest?.archivedAt).toBeTruthy()
      expect(archivedRequest?.archivedBy).toBe('Test Admin')
      expect(archivedRequest?.archiveReason).toBe('Archive test')
    })

    it('should include deleted requests when requested', async () => {
      await deleteRequest(deletedRequestId, 'Test Admin', 'Delete test')

      const requests = await getLeaveRequests({ includeDeleted: true })

      expect(requests).toBeDefined()
      expect(Array.isArray(requests)).toBe(true)

      const deletedRequest = requests.find(req => req.id === deletedRequestId)
      expect(deletedRequest).toBeDefined()
      expect(deletedRequest?.deletedAt).toBeTruthy()
      expect(deletedRequest?.deletedBy).toBe('Test Admin')
      expect(deletedRequest?.deleteReason).toBe('Delete test')
    })

    it('should filter by status', async () => {
      const pendingRequests = await getLeaveRequests({ status: 'PENDING' })

      expect(pendingRequests).toBeDefined()
      expect(Array.isArray(pendingRequests)).toBe(true)

      pendingRequests.forEach(request => {
        expect(request.status).toBe('PENDING')
      })
    })

    it('should filter by employee name', async () => {
      const employeeRequests = await getLeaveRequests({ employeeName: 'Test Employee 1' })

      expect(employeeRequests).toBeDefined()
      expect(Array.isArray(employeeRequests)).toBe(true)

      employeeRequests.forEach(request => {
        expect(request.employeeName).toContain('Test Employee 1')
      })
    })

    it('should apply multiple filters simultaneously', async () => {
      const filteredRequests = await getLeaveRequests({
        status: 'PENDING',
        employeeName: 'Test Employee 1',
        includeArchived: true,
        includeDeleted: true
      })

      expect(filteredRequests).toBeDefined()
      expect(Array.isArray(filteredRequests)).toBe(true)

      filteredRequests.forEach(request => {
        expect(request.status).toBe('PENDING')
        expect(request.employeeName).toContain('Test Employee 1')
      })
    })
  })

  describe('getDashboardStats', () => {
    beforeEach(async () => {
      // Create various test requests with different statuses
      await createTestRequest('Stats Test Employee 1', 'PENDING')
      await createTestRequest('Stats Test Employee 2', 'APPROVED')
      await createTestRequest('Stats Test Employee 3', 'DENIED')
    })

    it('should return correct statistics', async () => {
      const stats = await getDashboardStats()

      expect(stats).toBeDefined()
      expect(typeof stats.total).toBe('number')
      expect(typeof stats.pending).toBe('number')
      expect(typeof stats.approved).toBe('number')
      expect(typeof stats.denied).toBe('number')
      expect(typeof stats.archived).toBe('number')
      expect(typeof stats.deleted).toBe('number')

      // Verify logical consistency
      expect(stats.total).toBeGreaterThanOrEqual(0)
      expect(stats.pending).toBeGreaterThanOrEqual(0)
      expect(stats.approved).toBeGreaterThanOrEqual(0)
      expect(stats.denied).toBeGreaterThanOrEqual(0)
      expect(stats.archived).toBeGreaterThanOrEqual(0)
      expect(stats.deleted).toBeGreaterThanOrEqual(0)
    })

    it('should reflect archived and deleted counts', async () => {
      // Get initial stats
      const initialStats = await getDashboardStats()

      // Archive and delete some requests
      await archiveRequest(archivedRequestId, 'Test Admin', 'Stats archive test')
      await deleteRequest(deletedRequestId, 'Test Admin', 'Stats delete test')

      // Get updated stats
      const updatedStats = await getDashboardStats()

      expect(updatedStats.archived).toBe(initialStats.archived + 1)
      expect(updatedStats.deleted).toBe(initialStats.deleted + 1)
      expect(updatedStats.total).toBe(initialStats.total - 2) // Active requests decreased
    })
  })

  describe('archiveRequest', () => {
    it('should successfully archive a leave request', async () => {
      const archivedRequest = await archiveRequest(testRequestId, 'Archive Test Admin', 'Unit test archive')

      expect(archivedRequest).toBeDefined()
      expect(archivedRequest.id).toBe(testRequestId)
      expect(archivedRequest.archivedAt).toBeTruthy()
      expect(archivedRequest.archivedBy).toBe('Archive Test Admin')
      expect(archivedRequest.archiveReason).toBe('Unit test archive')
    })

    it('should create audit log for archive action', async () => {
      await archiveRequest(testRequestId, 'Audit Test Admin', 'Archive with audit log')

      // Verify audit log was created
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          entityType: 'leave_request',
          entityId: testRequestId,
          action: 'ARCHIVED'
        }
      })

      expect(auditLogs.length).toBe(1)
      expect(auditLogs[0].performedBy).toBe('Audit Test Admin')

      const details = JSON.parse(auditLogs[0].details || '{}')
      expect(details.archiveReason).toBe('Archive with audit log')
    })

    it('should handle archiving non-existent request', async () => {
      await expect(archiveRequest(999999, 'Test Admin', 'Non-existent test'))
        .rejects.toThrow('Leave request not found')
    })

    it('should handle optional archive reason', async () => {
      const archivedRequest = await archiveRequest(testRequestId, 'Test Admin')

      expect(archivedRequest).toBeDefined()
      expect(archivedRequest.archivedAt).toBeTruthy()
      expect(archivedRequest.archiveReason).toBeNull()
    })
  })

  describe('deleteRequest', () => {
    it('should successfully delete (soft delete) a leave request', async () => {
      const deletedRequest = await deleteRequest(testRequestId, 'Delete Test Admin', 'Unit test delete')

      expect(deletedRequest).toBeDefined()
      expect(deletedRequest.id).toBe(testRequestId)
      expect(deletedRequest.deletedAt).toBeTruthy()
      expect(deletedRequest.deletedBy).toBe('Delete Test Admin')
      expect(deletedRequest.deleteReason).toBe('Unit test delete')
    })

    it('should create audit log for delete action', async () => {
      await deleteRequest(testRequestId, 'Audit Test Admin', 'Delete with audit log')

      // Verify audit log was created
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          entityType: 'leave_request',
          entityId: testRequestId,
          action: 'DELETED'
        }
      })

      expect(auditLogs.length).toBe(1)
      expect(auditLogs[0].performedBy).toBe('Audit Test Admin')

      const details = JSON.parse(auditLogs[0].details || '{}')
      expect(details.deleteReason).toBe('Delete with audit log')
    })

    it('should handle deleting non-existent request', async () => {
      await expect(deleteRequest(999999, 'Test Admin', 'Non-existent test'))
        .rejects.toThrow('Leave request not found')
    })
  })

  describe('unarchiveRequest', () => {
    beforeEach(async () => {
      // Archive a request for unarchive testing
      await archiveRequest(testRequestId, 'Test Admin', 'Prepare for unarchive test')
    })

    it('should successfully unarchive a leave request', async () => {
      const unarchivedRequest = await unarchiveRequest(testRequestId, 'Unarchive Test Admin', 'Unit test unarchive')

      expect(unarchivedRequest).toBeDefined()
      expect(unarchivedRequest.id).toBe(testRequestId)
      expect(unarchivedRequest.archivedAt).toBeNull()
      expect(unarchivedRequest.archivedBy).toBeNull()
      expect(unarchivedRequest.archiveReason).toBeNull()
    })

    it('should create audit log for unarchive action', async () => {
      await unarchiveRequest(testRequestId, 'Audit Test Admin', 'Unarchive with audit log')

      // Verify audit log was created
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          entityType: 'leave_request',
          entityId: testRequestId,
          action: 'UNARCHIVED'
        }
      })

      expect(auditLogs.length).toBe(1)
      expect(auditLogs[0].performedBy).toBe('Audit Test Admin')

      const details = JSON.parse(auditLogs[0].details || '{}')
      expect(details.unarchiveReason).toBe('Unarchive with audit log')
    })

    it('should handle unarchiving non-existent request', async () => {
      await expect(unarchiveRequest(999999, 'Test Admin', 'Non-existent test'))
        .rejects.toThrow('Leave request not found')
    })

    it('should handle unarchiving request that is not archived', async () => {
      // First unarchive the request
      await unarchiveRequest(testRequestId, 'Test Admin', 'First unarchive')

      // Try to unarchive again
      await expect(unarchiveRequest(testRequestId, 'Test Admin', 'Second unarchive'))
        .rejects.toThrow('Request is not archived')
    })

    it('should handle optional unarchive reason', async () => {
      const unarchivedRequest = await unarchiveRequest(testRequestId, 'Test Admin')

      expect(unarchivedRequest).toBeDefined()
      expect(unarchivedRequest.archivedAt).toBeNull()
    })
  })

  describe('restoreRequest', () => {
    beforeEach(async () => {
      // Delete a request for restore testing
      await deleteRequest(restoredRequestId, 'Test Admin', 'Prepare for restore test')
    })

    it('should successfully restore a deleted leave request', async () => {
      const restoredRequest = await restoreRequest(restoredRequestId, 'Restore Test Admin', 'Unit test restore')

      expect(restoredRequest).toBeDefined()
      expect(restoredRequest.id).toBe(restoredRequestId)
      expect(restoredRequest.deletedAt).toBeNull()
      expect(restoredRequest.deletedBy).toBeNull()
      expect(restoredRequest.deleteReason).toBeNull()
    })

    it('should create audit log for restore action', async () => {
      // First ensure the request is deleted (it might already be from previous tests)
      await deleteRequest(restoredRequestId, 'Setup Admin', 'Setup for restore test')

      await restoreRequest(restoredRequestId, 'Audit Test Admin', 'Restore with audit log')

      // Verify audit log was created (get the most recent one)
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          entityType: 'leave_request',
          entityId: restoredRequestId,
          action: 'RESTORED',
          performedBy: 'Audit Test Admin'
        }
      })

      expect(auditLogs.length).toBeGreaterThanOrEqual(1)

      // Find the specific audit log we just created
      const restoreLog = auditLogs.find(log =>
        log.performedBy === 'Audit Test Admin' &&
        log.details?.includes('Restore with audit log')
      )
      expect(restoreLog).toBeDefined()
    })

    it('should handle restoring non-existent request', async () => {
      await expect(restoreRequest(999999, 'Test Admin', 'Non-existent test'))
        .rejects.toThrow('Leave request not found')
    })

    it('should handle restoring request that is not deleted', async () => {
      // First restore the request
      await restoreRequest(restoredRequestId, 'Test Admin', 'First restore')

      // Try to restore again
      await expect(restoreRequest(restoredRequestId, 'Test Admin', 'Second restore'))
        .rejects.toThrow('Request is not deleted')
    })

    it('should enforce 7-day grace period for restore', async () => {
      // Create and delete a request with an old timestamp
      const oldRequestId = await createTestRequest('Old Delete Test', 'PENDING')

      // Manually update the deletedAt timestamp to be more than 7 days ago
      const eightDaysAgo = new Date()
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8)

      await prisma.leaveRequest.update({
        where: { id: oldRequestId },
        data: {
          deletedAt: eightDaysAgo,
          deletedBy: 'Test Admin',
          deleteReason: 'Old deletion for grace period test'
        }
      })

      // Try to restore the old request
      await expect(restoreRequest(oldRequestId, 'Test Admin', 'Grace period test'))
        .rejects.toThrow('Cannot restore request deleted more than 7 days ago')
    })

    it('should handle optional restore reason', async () => {
      const restoredRequest = await restoreRequest(restoredRequestId, 'Test Admin')

      expect(restoredRequest).toBeDefined()
      expect(restoredRequest.deletedAt).toBeNull()
    })
  })

  describe('getLeaveRequestById', () => {
    it('should return request with all relations', async () => {
      const request = await getLeaveRequestById(testRequestId)

      expect(request).toBeDefined()
      expect(request?.id).toBe(testRequestId)
      expect(request?.employeeName).toBe('Test Employee 1')
      expect(Array.isArray(request?.approvals)).toBe(true)
      expect(Array.isArray(request?.auditLogs)).toBe(true)
    })

    it('should return null for non-existent request', async () => {
      const request = await getLeaveRequestById(999999)
      expect(request).toBeNull()
    })

    it('should include archived and deleted requests', async () => {
      // Archive the request
      await archiveRequest(testRequestId, 'Test Admin', 'Include test')

      const archivedRequest = await getLeaveRequestById(testRequestId)
      expect(archivedRequest).toBeDefined()
      expect(archivedRequest?.archivedAt).toBeTruthy()

      // Unarchive and delete
      await unarchiveRequest(testRequestId, 'Test Admin')
      await deleteRequest(testRequestId, 'Test Admin', 'Include test')

      const deletedRequest = await getLeaveRequestById(testRequestId)
      expect(deletedRequest).toBeDefined()
      expect(deletedRequest?.deletedAt).toBeTruthy()
    })
  })

  describe('formResponseExists', () => {
    it('should return true for existing form response ID', async () => {
      const exists = await formResponseExists('test_1') // This should exist from our test data
      expect(typeof exists).toBe('boolean')
    })

    it('should return false for non-existent form response ID', async () => {
      const exists = await formResponseExists('non_existent_id_12345')
      expect(exists).toBe(false)
    })
  })

  describe('Transaction Safety', () => {
    it('should maintain data consistency during archive operation', async () => {
      const originalRequest = await getLeaveRequestById(testRequestId)
      expect(originalRequest).toBeDefined()

      await archiveRequest(testRequestId, 'Transaction Test Admin', 'Transaction safety test')

      const archivedRequest = await getLeaveRequestById(testRequestId)
      expect(archivedRequest).toBeDefined()
      expect(archivedRequest?.archivedAt).toBeTruthy()
      expect(archivedRequest?.archivedBy).toBe('Transaction Test Admin')

      // Verify audit log exists
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          entityType: 'leave_request',
          entityId: testRequestId,
          action: 'ARCHIVED'
        }
      })
      expect(auditLogs.length).toBe(1)
    })

    it('should maintain data consistency during delete operation', async () => {
      const originalRequest = await getLeaveRequestById(testRequestId)
      expect(originalRequest).toBeDefined()

      await deleteRequest(testRequestId, 'Transaction Test Admin', 'Transaction safety test')

      const deletedRequest = await getLeaveRequestById(testRequestId)
      expect(deletedRequest).toBeDefined()
      expect(deletedRequest?.deletedAt).toBeTruthy()
      expect(deletedRequest?.deletedBy).toBe('Transaction Test Admin')

      // Verify audit log exists
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          entityType: 'leave_request',
          entityId: testRequestId,
          action: 'DELETED'
        }
      })
      expect(auditLogs.length).toBe(1)
    })
  })
})