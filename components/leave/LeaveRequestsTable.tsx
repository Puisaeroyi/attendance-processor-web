'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui'
import {
  ArchiveConfirmModal,
  DeleteConfirmModal,
  UnarchiveConfirmModal,
  RestoreConfirmModal
} from './modals'

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

interface TableProps {
  requests: LeaveRequest[]
  loading: boolean
  onAction: (requestId: number, action: 'approve' | 'deny', approvedBy: string, adminNotes?: string) => Promise<void>
  onArchive: (requestId: number, reason?: string) => Promise<void>
  onUnarchive: (requestId: number) => Promise<void>
  onDelete: (requestId: number, reason: string, deletedBy: string) => Promise<void>
  onRestore: (requestId: number) => Promise<void>
  userRole?: 'admin' | 'hr' | 'manager'
}

export function LeaveRequestsTable({
  requests,
  loading,
  onAction,
  onArchive,
  onUnarchive,
  onDelete,
  onRestore,
  userRole = 'admin'
}: TableProps) {
  const [actioningId, setActioningId] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [modalData, setModalData] = useState<{
    requestId: number
    action: 'approve' | 'deny'
  } | null>(null)
  const [approvedBy, setApprovedBy] = useState('')
  const [adminNotes, setAdminNotes] = useState('')

  // New modal states for archive/delete operations
  const [archiveModalOpen, setArchiveModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [unarchiveModalOpen, setUnarchiveModalOpen] = useState(false)
  const [restoreModalOpen, setRestoreModalOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)

  const handleActionClick = (requestId: number, action: 'approve' | 'deny') => {
    setModalData({ requestId, action })
    setShowModal(true)
  }

  const handleConfirmAction = async () => {
    if (!modalData || !approvedBy.trim()) {
      alert('Please enter your name')
      return
    }

    setActioningId(modalData.requestId)
    await onAction(modalData.requestId, modalData.action, approvedBy, adminNotes || undefined)
    setActioningId(null)
    setShowModal(false)
    setApprovedBy('')
    setAdminNotes('')
    setModalData(null)
  }

  // New handlers for archive/delete operations
  const handleArchive = (request: LeaveRequest) => {
    setSelectedRequest(request)
    setArchiveModalOpen(true)
  }

  const handleDelete = (request: LeaveRequest) => {
    setSelectedRequest(request)
    setDeleteModalOpen(true)
  }

  const handleUnarchive = (request: LeaveRequest) => {
    setSelectedRequest(request)
    setUnarchiveModalOpen(true)
  }

  const handleRestore = (request: LeaveRequest) => {
    setSelectedRequest(request)
    setRestoreModalOpen(true)
  }

  const handleArchiveConfirm = async (reason?: string) => {
    if (!selectedRequest) return
    setActioningId(selectedRequest.id)
    try {
      await onArchive(selectedRequest.id, reason)
    } finally {
      setActioningId(null)
      setArchiveModalOpen(false)
      setSelectedRequest(null)
    }
  }

  const handleDeleteConfirm = async (reason: string, deletedBy: string) => {
    if (!selectedRequest) return
    setActioningId(selectedRequest.id)
    try {
      await onDelete(selectedRequest.id, reason, deletedBy)
    } finally {
      setActioningId(null)
      setDeleteModalOpen(false)
      setSelectedRequest(null)
    }
  }

  const handleUnarchiveConfirm = async () => {
    if (!selectedRequest) return
    setActioningId(selectedRequest.id)
    try {
      await onUnarchive(selectedRequest.id)
    } finally {
      setActioningId(null)
      setUnarchiveModalOpen(false)
      setSelectedRequest(null)
    }
  }

  const handleRestoreConfirm = async () => {
    if (!selectedRequest) return
    setActioningId(selectedRequest.id)
    try {
      await onRestore(selectedRequest.id)
    } finally {
      setActioningId(null)
      setRestoreModalOpen(false)
      setSelectedRequest(null)
    }
  }

  // Check if request can be restored (within 7 days of deletion)
  const canRestore = (request: LeaveRequest) => {
    if (!request.deletedAt) return false
    const deletedDate = new Date(request.deletedAt)
    const now = new Date()
    const daysDiff = Math.ceil((now.getTime() - deletedDate.getTime()) / (1000 * 60 * 60 * 24))
    return daysDiff <= 7
  }

  // Calculate days until expiry for restore modal
  const getDaysUntilExpiry = (request: LeaveRequest) => {
    if (!request.deletedAt) return 0
    const deletedDate = new Date(request.deletedAt)
    const expiryDate = new Date(deletedDate.getTime() + (7 * 24 * 60 * 60 * 1000))
    const now = new Date()
    return Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="bg-white p-8 rounded-lg shadow text-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow text-center">
        <p className="text-gray-500">No leave requests found</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Manager
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leave Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shift
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{request.employeeName}</div>
                    <div className="text-xs text-gray-500">Submitted: {formatDate(request.submittedAt)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.managerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.leaveType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>{formatDate(request.startDate)}</div>
                    <div className="text-xs text-gray-500">to {formatDate(request.endDate)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.shiftType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.durationDays}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {request.archivedAt ? (
                      <Badge variant="warning">ARCHIVED</Badge>
                    ) : request.deletedAt ? (
                      <Badge variant="error">
                        DELETED
                        {canRestore(request) && (
                          <span className="ml-1 text-xs">
                            ({getDaysUntilExpiry(request)}d left)
                          </span>
                        )}
                      </Badge>
                    ) : (
                      <Badge
                        variant={
                          request.status === 'PENDING' ? 'warning' :
                          request.status === 'APPROVED' ? 'success' :
                          'error'
                        }
                      >
                        {request.status}
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-wrap gap-2">
                      {/* Original approve/deny actions for pending requests */}
                      {request.status === 'PENDING' && !request.archivedAt && !request.deletedAt && (
                        <>
                          <button
                            onClick={() => handleActionClick(request.id, 'approve')}
                            disabled={actioningId === request.id}
                            className="px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleActionClick(request.id, 'deny')}
                            disabled={actioningId === request.id}
                            className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 disabled:opacity-50"
                          >
                            Deny
                          </button>
                        </>
                      )}

                      {/* Archive action for active, non-archived, non-deleted requests */}
                      {!request.archivedAt && !request.deletedAt && userRole !== 'manager' && (
                        <>
                          {userRole === 'hr' && (
                            <button
                              onClick={() => handleArchive(request)}
                              disabled={actioningId === request.id}
                              className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 disabled:opacity-50"
                            >
                              Archive
                            </button>
                          )}
                          {userRole === 'admin' && (
                            <button
                              onClick={() => handleDelete(request)}
                              disabled={actioningId === request.id}
                              className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 disabled:opacity-50 font-bold"
                            >
                              Delete
                            </button>
                          )}
                        </>
                      )}

                      {/* Unarchive action for archived requests */}
                      {request.archivedAt && (
                        <button
                          onClick={() => handleUnarchive(request)}
                          disabled={actioningId === request.id}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 disabled:opacity-50"
                        >
                          Unarchive
                        </button>
                      )}

                      {/* Restore action for deleted requests within grace period */}
                      {request.deletedAt && canRestore(request) && (
                        <button
                          onClick={() => handleRestore(request)}
                          disabled={actioningId === request.id}
                          className="px-3 py-1 bg-orange-100 text-orange-800 rounded hover:bg-orange-200 disabled:opacity-50 font-bold"
                        >
                          Restore
                        </button>
                      )}

                      {/* Show expiry warning for deleted requests */}
                      {request.deletedAt && !canRestore(request) && (
                        <span className="text-xs text-gray-500 italic">Expired</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Original Action Modal */}
      {showModal && modalData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white border-4 border-black shadow-lg max-w-md w-full mx-4 p-6">
            <h2 className="text-2xl font-black uppercase mb-4">
              {modalData.action === 'approve' ? 'Approve' : 'Deny'} Leave Request
            </h2>
            <div className="w-full h-1 bg-black mb-6"></div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold uppercase mb-2">Your Name *</label>
                <input
                  type="text"
                  value={approvedBy}
                  onChange={(e) => setApprovedBy(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-4 focus:ring-blue-300"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold uppercase mb-2">Notes (optional)</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add any notes..."
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-4 focus:ring-blue-300"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowModal(false)
                  setApprovedBy('')
                  setAdminNotes('')
                  setModalData(null)
                }}
                className="flex-1 px-4 py-2 border-2 border-black bg-gray-100 hover:bg-gray-200 font-bold uppercase"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={actioningId !== null}
                className={`flex-1 px-4 py-2 border-2 border-black font-bold uppercase text-white ${
                  modalData.action === 'approve'
                    ? 'bg-green-600 hover:bg-green-700 disabled:opacity-50'
                    : 'bg-red-600 hover:bg-red-700 disabled:opacity-50'
                }`}
              >
                Confirm {modalData.action === 'approve' ? 'Approval' : 'Denial'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Confirmation Modal */}
      {selectedRequest && (
        <ArchiveConfirmModal
          isOpen={archiveModalOpen}
          onClose={() => {
            setArchiveModalOpen(false)
            setSelectedRequest(null)
          }}
          onConfirm={handleArchiveConfirm}
          loading={actioningId === selectedRequest?.id}
          requestInfo={{
            employeeName: selectedRequest.employeeName,
            leaveType: selectedRequest.leaveType,
            startDate: formatDate(selectedRequest.startDate),
            endDate: formatDate(selectedRequest.endDate)
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {selectedRequest && (
        <DeleteConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false)
            setSelectedRequest(null)
          }}
          onConfirm={handleDeleteConfirm}
          loading={actioningId === selectedRequest?.id}
          requestInfo={{
            employeeName: selectedRequest.employeeName,
            leaveType: selectedRequest.leaveType,
            startDate: formatDate(selectedRequest.startDate),
            endDate: formatDate(selectedRequest.endDate)
          }}
        />
      )}

      {/* Unarchive Confirmation Modal */}
      {selectedRequest && (
        <UnarchiveConfirmModal
          isOpen={unarchiveModalOpen}
          onClose={() => {
            setUnarchiveModalOpen(false)
            setSelectedRequest(null)
          }}
          onConfirm={handleUnarchiveConfirm}
          loading={actioningId === selectedRequest?.id}
          requestInfo={{
            employeeName: selectedRequest.employeeName,
            leaveType: selectedRequest.leaveType,
            startDate: formatDate(selectedRequest.startDate),
            endDate: formatDate(selectedRequest.endDate)
          }}
        />
      )}

      {/* Restore Confirmation Modal */}
      {selectedRequest && (
        <RestoreConfirmModal
          isOpen={restoreModalOpen}
          onClose={() => {
            setRestoreModalOpen(false)
            setSelectedRequest(null)
          }}
          onConfirm={handleRestoreConfirm}
          loading={actioningId === selectedRequest?.id}
          requestInfo={{
            employeeName: selectedRequest.employeeName,
            leaveType: selectedRequest.leaveType,
            startDate: formatDate(selectedRequest.startDate),
            endDate: formatDate(selectedRequest.endDate),
            deletedAt: selectedRequest.deletedAt!,
            daysUntilExpiry: getDaysUntilExpiry(selectedRequest)
          }}
        />
      )}
    </>
  )
}
