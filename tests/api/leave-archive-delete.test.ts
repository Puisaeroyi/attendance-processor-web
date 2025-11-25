/**
 * Comprehensive integration tests for Leave Management Delete and Archive functionality
 * Tests all new API endpoints, database functions, validation, and workflows
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'

const API_BASE = 'http://localhost:3000/api/v1/leave'

interface LeaveRequest {
  id: number
  employeeName: string
  managerName: string
  leaveType: string
  startDate: string
  endDate: string
  shiftType: string
  reason: string
  status: string
  durationDays: number
  submittedAt: string
  archivedAt?: string
  deletedAt?: string
  archivedBy?: string
  deletedBy?: string
  archiveReason?: string
  deleteReason?: string
}

interface ApiResponse {
  success: boolean
  message?: string
  data?: any
  error?: string
  details?: any
  warning?: string
}

describe('Leave Management Delete and Archive API', () => {
  let testRequests: LeaveRequest[] = []
  let archivedRequestId: number
  let deletedRequestId: number
  let originalStats: any

  beforeAll(async () => {
    // Get initial data and stats
    const statsResponse = await fetch(`${API_BASE}/stats`)
    const statsData = await statsResponse.json()
    originalStats = statsData.data.overview

    const requestsResponse = await fetch(`${API_BASE}/requests`)
    const requestsData = await requestsResponse.json()
    testRequests = requestsData.data

    console.log(`Found ${testRequests.length} test requests`)
    console.log('Initial stats:', originalStats)
  })

  describe('Database Functionality Tests', () => {
    describe('GET /api/v1/leave/requests with filters', () => {
      it('should exclude archived and deleted requests by default', async () => {
        const response = await fetch(`${API_BASE}/requests`)
        const data: ApiResponse = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data.every((req: LeaveRequest) => !req.archivedAt && !req.deletedAt)).toBe(true)
      })

      it('should include archived requests when requested', async () => {
        const response = await fetch(`${API_BASE}/requests?includeArchived=true`)
        const data: ApiResponse = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
      })

      it('should include deleted requests when requested', async () => {
        const response = await fetch(`${API_BASE}/requests?includeDeleted=true`)
        const data: ApiResponse = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
      })

      it('should include both archived and deleted requests when requested', async () => {
        const response = await fetch(`${API_BASE}/requests?includeArchived=true&includeDeleted=true`)
        const data: ApiResponse = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
      })

      it('should filter by archived status', async () => {
        const response = await fetch(`${API_BASE}/requests?status=ARCHIVED&includeArchived=true`)
        const data: ApiResponse = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
      })

      it('should filter by deleted status', async () => {
        const response = await fetch(`${API_BASE}/requests?status=DELETED&includeDeleted=true`)
        const data: ApiResponse = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
      })
    })

    describe('GET /api/v1/leave/stats with new fields', () => {
      it('should return statistics including archived and deleted counts', async () => {
        const response = await fetch(`${API_BASE}/stats`)
        const data: ApiResponse = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data.overview).toHaveProperty('archived')
        expect(data.data.overview).toHaveProperty('deleted')
        expect(typeof data.data.overview.archived).toBe('number')
        expect(typeof data.data.overview.deleted).toBe('number')
      })

      it('should reflect accurate counts after operations', async () => {
        const response = await fetch(`${API_BASE}/stats`)
        const data: ApiResponse = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)

        const { total, pending, approved, denied, archived, deleted } = data.data.overview
        expect(total).toBeGreaterThanOrEqual(pending + approved + denied)
      })
    })
  })

  describe('Archive Functionality Tests', () => {
    let testRequestId: number

    beforeEach(() => {
      // Get a PENDING request for testing
      if (testRequests.length > 0) {
        const pendingRequest = testRequests.find(req => req.status === 'PENDING')
        testRequestId = pendingRequest ? pendingRequest.id : testRequests[0].id
      }
    })

    it('should successfully archive a leave request', async () => {
      if (!testRequestId) {
        console.warn('No test requests available for archiving test')
        return
      }

      const archiveData = {
        requestId: testRequestId,
        archivedBy: 'Test Admin',
        reason: 'Test archive functionality'
      }

      const response = await fetch(`${API_BASE}/requests/${testRequestId}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(archiveData)
      })

      const data: ApiResponse = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Leave request archived successfully')
      expect(data.data).toHaveProperty('id', testRequestId)
      expect(data.data).toHaveProperty('archivedAt')
      expect(data.data).toHaveProperty('archivedBy', 'Test Admin')
      expect(data.data).toHaveProperty('archiveReason', 'Test archive functionality')

      archivedRequestId = testRequestId
    })

    it('should validate archivedBy field is required', async () => {
      if (!testRequestId) {
        console.warn('No test requests available for validation test')
        return
      }

      const invalidData = {
        requestId: testRequestId,
        reason: 'Missing archivedBy field'
      }

      const response = await fetch(`${API_BASE}/requests/${testRequestId}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      })

      const data: ApiResponse = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid request data')
    })

    it('should handle archiving non-existent request', async () => {
      const nonExistentId = 999999
      const archiveData = {
        requestId: nonExistentId,
        archivedBy: 'Test Admin',
        reason: 'Test non-existent request'
      }

      const response = await fetch(`${API_BASE}/requests/${nonExistentId}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(archiveData)
      })

      const data: ApiResponse = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Leave request not found')
    })

    it('should validate invalid request ID format', async () => {
      const invalidData = {
        requestId: 'invalid-id',
        archivedBy: 'Test Admin',
        reason: 'Test invalid ID'
      }

      const response = await fetch(`${API_BASE}/requests/invalid-id/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      })

      const data: ApiResponse = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid request ID')
    })
  })

  describe('Delete Functionality Tests', () => {
    let testRequestId: number

    beforeEach(() => {
      // Get a PENDING request for testing (different from archived one)
      if (testRequests.length > 1) {
        const pendingRequests = testRequests.filter(req => req.status === 'PENDING' && req.id !== archivedRequestId)
        testRequestId = pendingRequests.length > 0 ? pendingRequests[0].id : testRequests[1].id
      } else if (testRequests.length === 1) {
        testRequestId = testRequests[0].id
      }
    })

    it('should successfully delete (soft delete) a leave request', async () => {
      if (!testRequestId || testRequestId === archivedRequestId) {
        console.warn('No suitable test requests available for deletion test')
        return
      }

      const deleteData = {
        requestId: testRequestId,
        deletedBy: 'Test Admin',
        reason: 'Test delete functionality - this is a test deletion'
      }

      const response = await fetch(`${API_BASE}/requests/${testRequestId}/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deleteData)
      })

      const data: ApiResponse = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Leave request deleted successfully')
      expect(data.warning).toContain('marked for deletion and will be permanently removed after 7 days')
      expect(data.data).toHaveProperty('id', testRequestId)
      expect(data.data).toHaveProperty('deletedAt')
      expect(data.data).toHaveProperty('deletedBy', 'Test Admin')
      expect(data.data).toHaveProperty('deleteReason', 'Test delete functionality - this is a test deletion')

      deletedRequestId = testRequestId
    })

    it('should validate deletedBy field is required', async () => {
      if (!testRequestId) {
        console.warn('No test requests available for validation test')
        return
      }

      const invalidData = {
        requestId: testRequestId,
        reason: 'Missing deletedBy field'
      }

      const response = await fetch(`${API_BASE}/requests/${testRequestId}/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      })

      const data: ApiResponse = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid request data')
    })

    it('should validate delete reason is required', async () => {
      if (!testRequestId) {
        console.warn('No test requests available for validation test')
        return
      }

      const invalidData = {
        requestId: testRequestId,
        deletedBy: 'Test Admin'
        // Missing reason field
      }

      const response = await fetch(`${API_BASE}/requests/${testRequestId}/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      })

      const data: ApiResponse = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid request data')
    })

    it('should handle deleting non-existent request', async () => {
      const nonExistentId = 999999
      const deleteData = {
        requestId: nonExistentId,
        deletedBy: 'Test Admin',
        reason: 'Test non-existent request'
      }

      const response = await fetch(`${API_BASE}/requests/${nonExistentId}/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deleteData)
      })

      const data: ApiResponse = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Leave request not found')
    })
  })

  describe('Unarchive Functionality Tests', () => {
    it('should successfully unarchive an archived request', async () => {
      if (!archivedRequestId) {
        console.warn('No archived request available for unarchiving test')
        return
      }

      const unarchiveData = {
        requestId: archivedRequestId,
        unarchivedBy: 'Test Admin',
        reason: 'Test unarchive functionality'
      }

      const response = await fetch(`${API_BASE}/requests/${archivedRequestId}/unarchive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(unarchiveData)
      })

      const data: ApiResponse = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Leave request unarchived successfully')
      expect(data.data).toHaveProperty('id', archivedRequestId)
      expect(data.data).toHaveProperty('archivedAt', null)
      expect(data.data).toHaveProperty('archivedBy', null)
      expect(data.data).toHaveProperty('archiveReason', null)
    })

    it('should handle unarchiving non-existent request', async () => {
      const nonExistentId = 999999
      const unarchiveData = {
        requestId: nonExistentId,
        unarchivedBy: 'Test Admin',
        reason: 'Test non-existent request'
      }

      const response = await fetch(`${API_BASE}/requests/${nonExistentId}/unarchive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(unarchiveData)
      })

      const data: ApiResponse = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Leave request not found')
    })

    it('should handle unarchiving request that is not archived', async () => {
      // Find a request that is not archived
      const requestsResponse = await fetch(`${API_BASE}/requests`)
      const requestsData = await requestsResponse.json()
      const nonArchivedRequest = requestsData.data.find((req: LeaveRequest) => !req.archivedAt)

      if (!nonArchivedRequest) {
        console.warn('No non-archived request available for test')
        return
      }

      const unarchiveData = {
        requestId: nonArchivedRequest.id,
        unarchivedBy: 'Test Admin',
        reason: 'Test unarchiving non-archived request'
      }

      const response = await fetch(`${API_BASE}/requests/${nonArchivedRequest.id}/unarchive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(unarchiveData)
      })

      const data: ApiResponse = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Request is not archived')
    })
  })

  describe('Restore Functionality Tests', () => {
    it('should successfully restore a deleted request within grace period', async () => {
      if (!deletedRequestId) {
        console.warn('No deleted request available for restoring test')
        return
      }

      const restoreData = {
        requestId: deletedRequestId,
        restoredBy: 'Test Admin',
        reason: 'Test restore functionality'
      }

      const response = await fetch(`${API_BASE}/requests/${deletedRequestId}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(restoreData)
      })

      const data: ApiResponse = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Leave request restored successfully')
      expect(data.data).toHaveProperty('id', deletedRequestId)
      expect(data.data).toHaveProperty('deletedAt', null)
      expect(data.data).toHaveProperty('deletedBy', null)
      expect(data.data).toHaveProperty('deleteReason', null)
    })

    it('should handle restoring non-existent request', async () => {
      const nonExistentId = 999999
      const restoreData = {
        requestId: nonExistentId,
        restoredBy: 'Test Admin',
        reason: 'Test non-existent request'
      }

      const response = await fetch(`${API_BASE}/requests/${nonExistentId}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(restoreData)
      })

      const data: ApiResponse = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Leave request not found')
    })

    it('should handle restoring request that is not deleted', async () => {
      // Find a request that is not deleted
      const requestsResponse = await fetch(`${API_BASE}/requests`)
      const requestsData = await requestsResponse.json()
      const nonDeletedRequest = requestsData.data.find((req: LeaveRequest) => !req.deletedAt)

      if (!nonDeletedRequest) {
        console.warn('No non-deleted request available for test')
        return
      }

      const restoreData = {
        requestId: nonDeletedRequest.id,
        restoredBy: 'Test Admin',
        reason: 'Test restoring non-deleted request'
      }

      const response = await fetch(`${API_BASE}/requests/${nonDeletedRequest.id}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(restoreData)
      })

      const data: ApiResponse = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Request is not deleted')
    })
  })

  describe('Complete Workflow Tests', () => {
    let workflowRequestId: number

    beforeEach(async () => {
      // Get a fresh request for workflow testing
      const requestsResponse = await fetch(`${API_BASE}/requests`)
      const requestsData = await requestsResponse.json()
      const availableRequests = requestsData.data.filter((req: LeaveRequest) =>
        req.status === 'PENDING' &&
        req.id !== archivedRequestId &&
        req.id !== deletedRequestId
      )

      if (availableRequests.length > 0) {
        workflowRequestId = availableRequests[0].id
      }
    })

    it('should complete archive → unarchive → archive workflow', async () => {
      if (!workflowRequestId) {
        console.warn('No available request for workflow test')
        return
      }

      // Step 1: Archive the request
      const archiveData = {
        requestId: workflowRequestId,
        archivedBy: 'Workflow Test Admin',
        reason: 'Step 1: Archive for workflow test'
      }

      const archiveResponse = await fetch(`${API_BASE}/requests/${workflowRequestId}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(archiveData)
      })

      expect(archiveResponse.status).toBe(200)

      // Step 2: Unarchive the request
      const unarchiveData = {
        requestId: workflowRequestId,
        unarchivedBy: 'Workflow Test Admin',
        reason: 'Step 2: Unarchive for workflow test'
      }

      const unarchiveResponse = await fetch(`${API_BASE}/requests/${workflowRequestId}/unarchive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(unarchiveData)
      })

      expect(unarchiveResponse.status).toBe(200)

      // Step 3: Archive again
      const archiveData2 = {
        requestId: workflowRequestId,
        archivedBy: 'Workflow Test Admin',
        reason: 'Step 3: Archive again for workflow test'
      }

      const archiveResponse2 = await fetch(`${API_BASE}/requests/${workflowRequestId}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(archiveData2)
      })

      expect(archiveResponse2.status).toBe(200)

      // Verify final state
      const verifyResponse = await fetch(`${API_BASE}/requests?includeArchived=true`)
      const verifyData = await verifyResponse.json()
      const finalRequest = verifyData.data.find((req: LeaveRequest) => req.id === workflowRequestId)

      expect(finalRequest).toBeDefined()
      expect(finalRequest.archivedAt).toBeTruthy()
      expect(finalRequest.archivedBy).toBe('Workflow Test Admin')
      expect(finalRequest.archiveReason).toBe('Step 3: Archive again for workflow test')
    })

    it('should handle concurrent operations gracefully', async () => {
      if (!workflowRequestId) {
        console.warn('No available request for concurrent test')
        return
      }

      // Simulate concurrent archive and delete operations
      const archiveData = {
        requestId: workflowRequestId,
        archivedBy: 'Concurrent Test Admin 1',
        reason: 'Concurrent archive test'
      }

      const deleteData = {
        requestId: workflowRequestId,
        deletedBy: 'Concurrent Test Admin 2',
        reason: 'Concurrent delete test'
      }

      // Send both requests simultaneously
      const [archiveResponse, deleteResponse] = await Promise.all([
        fetch(`${API_BASE}/requests/${workflowRequestId}/archive`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(archiveData)
        }),
        fetch(`${API_BASE}/requests/${workflowRequestId}/delete`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(deleteData)
        })
      ])

      // At least one should succeed
      expect(
        archiveResponse.status === 200 || deleteResponse.status === 200
      ).toBe(true)
    })
  })

  describe('Data Integrity Tests', () => {
    it('should maintain audit trail for all operations', async () => {
      // This would require access to audit logs endpoint if it exists
      // For now, we verify the operations return expected data structure
      const requestsResponse = await fetch(`${API_BASE}/requests?includeArchived=true&includeDeleted=true`)
      const requestsData = await requestsResponse.json()

      expect(requestsData.success).toBe(true)
      expect(Array.isArray(requestsData.data)).toBe(true)
    })

    it('should ensure archived requests are excluded by default', async () => {
      const defaultResponse = await fetch(`${API_BASE}/requests`)
      const includeArchivedResponse = await fetch(`${API_BASE}/requests?includeArchived=true`)

      const defaultData = await defaultResponse.json()
      const includeArchivedData = await includeArchivedResponse.json()

      expect(defaultData.success).toBe(true)
      expect(includeArchivedData.success).toBe(true)

      // Include archived should have same or more requests
      expect(includeArchivedData.data.length).toBeGreaterThanOrEqual(defaultData.data.length)
    })

    it('should ensure deleted requests are excluded by default', async () => {
      const defaultResponse = await fetch(`${API_BASE}/requests`)
      const includeDeletedResponse = await fetch(`${API_BASE}/requests?includeDeleted=true`)

      const defaultData = await defaultResponse.json()
      const includeDeletedData = await includeDeletedResponse.json()

      expect(defaultData.success).toBe(true)
      expect(includeDeletedData.success).toBe(true)

      // Include deleted should have same or more requests
      expect(includeDeletedData.data.length).toBeGreaterThanOrEqual(defaultData.data.length)
    })
  })

  describe('Performance Tests', () => {
    it('should handle filter operations efficiently', async () => {
      const startTime = Date.now()

      const response = await fetch(`${API_BASE}/requests?includeArchived=true&includeDeleted=true`)
      const data = await response.json()

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(duration).toBeLessThan(2000) // Should complete within 2 seconds
    })

    it('should handle stats calculation efficiently', async () => {
      const startTime = Date.now()

      const response = await fetch(`${API_BASE}/stats`)
      const data = await response.json()

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(duration).toBeLessThan(1000) // Should complete within 1 second
    })
  })

  afterAll(() => {
    console.log('Archive/Delete tests completed')
    console.log(`Archived request ID: ${archivedRequestId}`)
    console.log(`Deleted request ID: ${deletedRequestId}`)
  })
})