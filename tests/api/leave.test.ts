/**
 * Integration tests for Leave Management API endpoints
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'

const API_BASE = 'http://localhost:3000/api/v1/leave'

describe('Leave Management API', () => {
  describe('GET /api/v1/leave/sync', () => {
    it('should return sync service status', async () => {
      const response = await fetch(`${API_BASE}/sync`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('status')
      expect(data).toHaveProperty('connected')
    })
  })

  describe('GET /api/v1/leave/requests', () => {
    it('should return list of leave requests', async () => {
      const response = await fetch(`${API_BASE}/requests`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('count')
      expect(data).toHaveProperty('data')
      expect(Array.isArray(data.data)).toBe(true)
    })

    it('should filter by status', async () => {
      const response = await fetch(`${API_BASE}/requests?status=PENDING`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      // All returned requests should have PENDING status
      data.data.forEach((request: any) => {
        expect(request.status).toBe('PENDING')
      })
    })

    it('should filter by employee name', async () => {
      const response = await fetch(`${API_BASE}/requests?employeeName=John`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('GET /api/v1/leave/stats', () => {
    it('should return dashboard statistics', async () => {
      const response = await fetch(`${API_BASE}/stats`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('success', true)
      expect(data.data).toHaveProperty('overview')
      expect(data.data).toHaveProperty('recentRequests')
      expect(data.data).toHaveProperty('upcomingLeaves')

      // Verify overview structure
      expect(data.data.overview).toHaveProperty('total')
      expect(data.data.overview).toHaveProperty('pending')
      expect(data.data.overview).toHaveProperty('approved')
      expect(data.data.overview).toHaveProperty('denied')
      expect(data.data.overview).toHaveProperty('approvedDaysThisMonth')
    })
  })

  describe('POST /api/v1/leave/approve', () => {
    it('should return validation error for missing fields', async () => {
      const response = await fetch(`${API_BASE}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid request data')
    })

    it('should return validation error for invalid requestId', async () => {
      const response = await fetch(`${API_BASE}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: 'invalid',
          approvedBy: 'Admin'
        })
      })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should return not found for non-existent request', async () => {
      const response = await fetch(`${API_BASE}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: 999999,
          approvedBy: 'Admin'
        })
      })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Leave request not found')
    })
  })

  describe('POST /api/v1/leave/deny', () => {
    it('should return validation error for missing fields', async () => {
      const response = await fetch(`${API_BASE}/deny`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid request data')
    })

    it('should return not found for non-existent request', async () => {
      const response = await fetch(`${API_BASE}/deny`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: 999999,
          approvedBy: 'Admin'
        })
      })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Leave request not found')
    })
  })

  describe('POST /api/v1/leave/sync', () => {
    it('should trigger sync with Google Forms', async () => {
      const response = await fetch(`${API_BASE}/sync`, {
        method: 'POST'
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('success')
      expect(data).toHaveProperty('message')
      expect(data).toHaveProperty('synced')
      expect(data).toHaveProperty('skipped')
      expect(data).toHaveProperty('errors')
    })
  })
})
