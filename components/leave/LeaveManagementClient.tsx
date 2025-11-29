'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { DashboardStats } from '@/components/leave/DashboardStats'
import { LeaveRequestsTable } from '@/components/leave/LeaveRequestsTable'
import { LeaveRequestForm, LeaveRequestFormData } from '@/components/leave/LeaveRequestForm'

interface DashboardStatsType {
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

interface LeaveManagementClientProps {
  userRole: 'admin' | 'hr' | 'manager' | 'user'
  userName?: string
}

export default function LeaveManagementClient({ userRole, userName = '' }: LeaveManagementClientProps) {
  const [stats, setStats] = useState<DashboardStatsType | null>(null)
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filters, setFilters] = useState({
    status: '',
    employeeName: '',
    managerName: '',
    leaveType: ''
  })

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

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams()

      if (filters.status) queryParams.append('status', filters.status)
      if (filters.employeeName) queryParams.append('employeeName', filters.employeeName)
      if (filters.managerName) queryParams.append('managerName', filters.managerName)
      if (filters.leaveType) queryParams.append('leaveType', filters.leaveType)

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

  useEffect(() => {
    fetchStats()
    fetchRequests()
  }, [filters, fetchStats, fetchRequests])

  const handleAction = async (requestId: number, action: 'approve' | 'deny', approvedBy: string, adminNotes?: string) => {
    try {
      const response = await fetch(`/api/v1/leave/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, approvedBy, adminNotes })
      })

      const data = await response.json()

      if (data.success) {
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

  const handleCreateRequest = async (formData: LeaveRequestFormData) => {
    try {
      const response = await fetch('/api/v1/leave/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          managerName: formData.managerName,
          leaveType: formData.leaveType,
          startDate: formData.startDate,
          endDate: formData.endDate,
          shiftType: formData.shiftType,
          reason: formData.reason
        })
      })

      const data = await response.json()

      if (data.success) {
        alert('Leave request submitted successfully!')
        await fetchStats()
        await fetchRequests()
      } else {
        alert(`Failed to submit request: ${data.error}`)
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error creating leave request:', error)
      throw error
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">
          {userRole === 'user' ? 'My Leave Requests' : 'Leave Management Dashboard'}
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl border border-white/20 hover:shadow-[0_0_20px_rgba(52,199,89,0.5)] transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          New Request
        </button>
      </div>

      <LeaveRequestForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreateRequest}
        defaultFullName={userName}
      />

      {stats && userRole !== 'user' && <DashboardStats stats={stats} />}

      {/* Filters */}
      <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-[0_8px_32px_rgba(31,38,135,0.15)]">
        <h2 className="text-xl font-semibold text-white mb-6">Filters</h2>

        <div className={`grid grid-cols-1 gap-4 ${userRole === 'user' ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all"
            >
              <option value="" className="bg-gray-800">All</option>
              <option value="PENDING" className="bg-gray-800">Pending</option>
              <option value="APPROVED" className="bg-gray-800">Approved</option>
              <option value="DENIED" className="bg-gray-800">Denied</option>
              {userRole !== 'user' && <option value="ARCHIVED" className="bg-gray-800">Archived</option>}
              {userRole !== 'user' && <option value="DELETED" className="bg-gray-800">Deleted</option>}
            </select>
          </div>

          {userRole !== 'user' && (
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Employee Name</label>
              <input
                type="text"
                value={filters.employeeName}
                onChange={(e) => setFilters({ ...filters, employeeName: e.target.value })}
                placeholder="Search employee..."
                className="w-full px-4 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all"
              />
            </div>
          )}

          {userRole !== 'user' && (
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Manager Name</label>
              <input
                type="text"
                value={filters.managerName}
                onChange={(e) => setFilters({ ...filters, managerName: e.target.value })}
                placeholder="Search manager..."
                className="w-full px-4 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Leave Type</label>
            <input
              type="text"
              value={filters.leaveType}
              onChange={(e) => setFilters({ ...filters, leaveType: e.target.value })}
              placeholder="Search type..."
              className="w-full px-4 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/20 pt-4 mt-6">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-white/80">Current Role:</span>
            <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${
              userRole === 'admin' ? 'bg-red-500/30 text-red-200 border-red-400/40' :
              userRole === 'hr' ? 'bg-yellow-500/30 text-yellow-200 border-yellow-400/40' :
              userRole === 'manager' ? 'bg-blue-500/30 text-blue-200 border-blue-400/40' :
              'bg-green-500/30 text-green-200 border-green-400/40'
            }`}>
              {userRole.toUpperCase()}
            </span>
          </div>
          <div className="text-xs text-white/60">
            {userRole === 'admin' && 'Can archive and delete requests'}
            {userRole === 'hr' && 'Can archive requests'}
            {userRole === 'manager' && 'Can approve/deny requests'}
            {userRole === 'user' && 'Can submit leave requests'}
          </div>
        </div>
      </div>

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
