'use client'

import { useState, useEffect, useCallback } from 'react'
import { DashboardStats } from '@/components/leave/DashboardStats'
import { LeaveRequestsTable } from '@/components/leave/LeaveRequestsTable'
import { SyncButton } from '@/components/leave/SyncButton'

// Define types for better type safety
interface DashboardStats {
  overview: {
    total: number
    pending: number
    approved: number
    denied: number
    approvedDaysThisMonth: number
    archived?: number
    deleted?: number
    expiringSoon?: number
  }
  recentRequests: unknown[]
  upcomingLeaves: unknown[]
}

interface LeaveRequest {
  id: number
  formResponseId: string
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
}

export default function LeaveManagementPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: '',
    employeeName: '',
    managerName: '',
    leaveType: ''
  })

  // User role simulation (in real app, this would come from auth context)
  const [userRole] = useState<'admin' | 'hr' | 'manager'>('admin')

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/leave/stats')
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }, [])

  // Fetch leave requests
  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams()

      if (filters.status) queryParams.append('status', filters.status)
      if (filters.employeeName) queryParams.append('employeeName', filters.employeeName)
      if (filters.managerName) queryParams.append('managerName', filters.managerName)
      if (filters.leaveType) queryParams.append('leaveType', filters.leaveType)

      // Automatically include archived/deleted requests when filtering by their statuses
      if (filters.status === 'ARCHIVED') queryParams.append('includeArchived', 'true')
      if (filters.status === 'DELETED') queryParams.append('includeDeleted', 'true')

      const response = await fetch(`/api/v1/leave/requests?${queryParams.toString()}`)
      const data = await response.json()

      if (data.success) {
        setRequests(data.data)
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Load data on mount and when filters change
  useEffect(() => {
    fetchStats()
    fetchRequests()
  }, [filters, fetchStats, fetchRequests])

  // Handle approval/denial
  const handleAction = async (requestId: number, action: 'approve' | 'deny', approvedBy: string, adminNotes?: string) => {
    try {
      const response = await fetch(`/api/v1/leave/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, approvedBy, adminNotes })
      })

      const data = await response.json()

      if (data.success) {
        // Refresh data
        await fetchStats()
        await fetchRequests()
        alert(`Leave request ${action}d successfully!`)
      } else {
        alert(`Failed to ${action} request: ${data.error}`)
      }
    } catch (error) {
      console.error(`Error ${action}ing request:`, error)
      alert(`Error ${action}ing request`)
    }
  }

  // Handle archive operation
  const handleArchive = async (requestId: number, reason?: string) => {
    try {
      const response = await fetch(`/api/v1/leave/requests/${requestId}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })

      const data = await response.json()

      if (data.success) {
        await fetchStats()
        await fetchRequests()
        alert('Leave request archived successfully!')
      } else {
        alert(`Failed to archive request: ${data.error}`)
      }
    } catch (error) {
      console.error('Error archiving request:', error)
      alert('Error archiving request')
    }
  }

  // Handle unarchive operation
  const handleUnarchive = async (requestId: number) => {
    try {
      const response = await fetch(`/api/v1/leave/requests/${requestId}/unarchive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()

      if (data.success) {
        await fetchStats()
        await fetchRequests()
        alert('Leave request unarchived successfully!')
      } else {
        alert(`Failed to unarchive request: ${data.error}`)
      }
    } catch (error) {
      console.error('Error unarchiving request:', error)
      alert('Error unarchiving request')
    }
  }

  // Handle delete operation
  const handleDelete = async (requestId: number, reason: string, deletedBy: string) => {
    try {
      const response = await fetch(`/api/v1/leave/requests/${requestId}/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, deletedBy })
      })

      const data = await response.json()

      if (data.success) {
        await fetchStats()
        await fetchRequests()
        alert('Leave request deleted successfully!')
      } else {
        alert(`Failed to delete request: ${data.error}`)
      }
    } catch (error) {
      console.error('Error deleting request:', error)
      alert('Error deleting request')
    }
  }

  // Handle restore operation
  const handleRestore = async (requestId: number) => {
    try {
      const response = await fetch(`/api/v1/leave/requests/${requestId}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()

      if (data.success) {
        await fetchStats()
        await fetchRequests()
        alert('Leave request restored successfully!')
      } else {
        alert(`Failed to restore request: ${data.error}`)
      }
    } catch (error) {
      console.error('Error restoring request:', error)
      alert('Error restoring request')
    }
  }

  // Handle sync
  const handleSync = async () => {
    try {
      const response = await fetch('/api/v1/leave/sync', {
        method: 'POST'
      })

      const data = await response.json()

      if (data.success) {
        alert(`Sync completed! Synced: ${data.synced}, Skipped: ${data.skipped}, Errors: ${data.errors}`)
        // Refresh data
        await fetchStats()
        await fetchRequests()
      } else {
        alert(`Sync failed: ${data.error}`)
      }
    } catch (error) {
      console.error('Error syncing:', error)
      alert('Error syncing with Google Forms')
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Leave Management Dashboard</h1>
        <SyncButton onSync={handleSync} />
      </div>

      {/* Dashboard Stats */}
      {stats && <DashboardStats stats={stats} />}

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow border-4 border-black">
        <h2 className="text-2xl font-black uppercase mb-6">Filters</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-bold uppercase mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border-2 border-black font-semibold focus:outline-none focus:ring-4 focus:ring-blue-300"
            >
              <option value="">All</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="DENIED">Denied</option>
              <option value="ARCHIVED">Archived</option>
              <option value="DELETED">Deleted</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold uppercase mb-2">Employee Name</label>
            <input
              type="text"
              value={filters.employeeName}
              onChange={(e) => setFilters({ ...filters, employeeName: e.target.value })}
              placeholder="Search employee..."
              className="w-full px-3 py-2 border-2 border-black font-semibold focus:outline-none focus:ring-4 focus:ring-blue-300"
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase mb-2">Manager Name</label>
            <input
              type="text"
              value={filters.managerName}
              onChange={(e) => setFilters({ ...filters, managerName: e.target.value })}
              placeholder="Search manager..."
              className="w-full px-3 py-2 border-2 border-black font-semibold focus:outline-none focus:ring-4 focus:ring-blue-300"
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase mb-2">Leave Type</label>
            <input
              type="text"
              value={filters.leaveType}
              onChange={(e) => setFilters({ ...filters, leaveType: e.target.value })}
              placeholder="Search type..."
              className="w-full px-3 py-2 border-2 border-black font-semibold focus:outline-none focus:ring-4 focus:ring-blue-300"
            />
          </div>

          </div>

        {/* Role indicator */}
        <div className="flex items-center justify-between border-t-2 border-black pt-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-bold uppercase">Current Role:</span>
            <span className={`px-3 py-1 text-sm font-black uppercase border-2 border-black ${
              userRole === 'admin' ? 'bg-red-100 text-red-800' :
              userRole === 'hr' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {userRole}
            </span>
          </div>
          <div className="text-xs text-gray-600">
            {userRole === 'admin' && 'Can archive and delete requests'}
            {userRole === 'hr' && 'Can archive requests'}
            {userRole === 'manager' && 'Can approve/deny requests only'}
          </div>
        </div>
      </div>

      {/* Leave Requests Table */}
      <LeaveRequestsTable
        requests={requests}
        loading={loading}
        onAction={handleAction}
        onArchive={handleArchive}
        onUnarchive={handleUnarchive}
        onDelete={handleDelete}
        onRestore={handleRestore}
        userRole={userRole}
      />
    </div>
  )
}
