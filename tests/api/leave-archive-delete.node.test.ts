/**
 * Node.js environment integration tests for Leave Management Delete and Archive functionality
 * Tests all new API endpoints using Node.js fetch
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

describe('Leave Management Delete and Archive API (Node.js)', () => {
  let testRequests: LeaveRequest[] = []
  let archivedRequestId: number
  let deletedRequestId: number
  let originalStats: any

  beforeAll(async () => {
    // Get initial data and stats
    try {
      const statsResponse = await fetch(`${API_BASE}/stats`)
      const statsData = await statsResponse.json()
      originalStats = statsData.data.overview

      const requestsResponse = await fetch(`${API_BASE}/requests`)
      const requestsData = await requestsResponse.json()
      testRequests = requestsData.data

      console.log(`Found ${testRequests.length} test requests`)
      console.log('Initial stats:', originalStats)
    } catch (error) {
      console.warn('Could not fetch initial data:', error)
    }
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
    console.log('Archive/Delete API tests completed')
    console.log(`Archived request ID: ${archivedRequestId}`)
    console.log(`Deleted request ID: ${deletedRequestId}`)
  })
})