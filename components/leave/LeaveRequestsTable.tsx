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
  userRole?: 'admin' | 'hr' | 'manager' | 'user'
}

export function LeaveRequestsTable({
  requests,
  loading,
  onAction,
  onArchive,
  onUnarchive,
  onDelete,
  onRestore,
  userRole = 'user'
}: TableProps) {
  const [actioningId, setActioningId] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [modalData, setModalData] = useState<{
    requestId: number
    action: 'approve' | 'deny'
  } | null>(null)
  const [approvedBy] = useState('Thomas_Nguyen')
  const [adminNotes, setAdminNotes] = useState('')

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
    if (!modalData) return

    setActioningId(modalData.requestId)
    await onAction(modalData.requestId, modalData.action, approvedBy, adminNotes || undefined)
    setActioningId(null)
    setShowModal(false)
    setAdminNotes('')
    setModalData(null)
  }

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

  const canRestore = (request: LeaveRequest) => {
    if (!request.deletedAt) return false
    const deletedDate = new Date(request.deletedAt)
    const now = new Date()
    const daysDiff = Math.ceil((now.getTime() - deletedDate.getTime()) / (1000 * 60 * 60 * 24))
    return daysDiff <= 7
  }

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
      <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-8 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-white/30 border-t-white rounded-full mx-auto mb-4"></div>
        <p className="text-white/70">Loading...</p>
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-8 text-center">
        <p className="text-white/70">No leave requests found</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(31,38,135,0.15)]">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-white/10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">Manager</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">Leave Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">Dates</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">Shift</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">Days</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {requests.map((request) => (
                <tr key={request.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-white">{request.employeeName}</div>
                    <div className="text-xs text-white/60">Submitted: {formatDate(request.submittedAt)}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-white/90">{request.managerName}</td>
                  <td className="px-6 py-4 text-sm text-white/90">{request.leaveType}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-white/90">{formatDate(request.startDate)}</div>
                    <div className="text-xs text-white/60">to {formatDate(request.endDate)}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-white/90">{request.shiftType}</td>
                  <td className="px-6 py-4 text-sm text-white/90">{request.durationDays}</td>
                  <td className="px-6 py-4">
                    {request.archivedAt ? (
                      <Badge variant="warning">ARCHIVED</Badge>
                    ) : request.deletedAt ? (
                      <Badge variant="error">
                        DELETED
                        {canRestore(request) && (
                          <span className="ml-1 text-xs">({getDaysUntilExpiry(request)}d left)</span>
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
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {request.status === 'PENDING' && !request.archivedAt && !request.deletedAt &&
                       (userRole === 'admin' || userRole === 'hr' || userRole === 'manager') && (
                        <>
                          <button
                            onClick={() => handleActionClick(request.id, 'approve')}
                            disabled={actioningId === request.id}
                            className="px-3 py-1.5 bg-green-500/25 text-green-200 rounded-lg hover:bg-green-500/40 transition-colors text-sm font-medium disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleActionClick(request.id, 'deny')}
                            disabled={actioningId === request.id}
                            className="px-3 py-1.5 bg-red-500/25 text-red-200 rounded-lg hover:bg-red-500/40 transition-colors text-sm font-medium disabled:opacity-50"
                          >
                            Deny
                          </button>
                        </>
                      )}

                      {!request.archivedAt && !request.deletedAt && userRole !== 'manager' && userRole !== 'user' && (
                        <>
                          {userRole === 'hr' && (
                            <button
                              onClick={() => handleArchive(request)}
                              disabled={actioningId === request.id}
                              className="px-3 py-1.5 bg-yellow-500/25 text-yellow-200 rounded-lg hover:bg-yellow-500/40 transition-colors text-sm font-medium disabled:opacity-50"
                            >
                              Archive
                            </button>
                          )}
                          {userRole === 'admin' && (
                            <button
                              onClick={() => handleDelete(request)}
                              disabled={actioningId === request.id}
                              className="px-3 py-1.5 bg-red-500/25 text-red-200 rounded-lg hover:bg-red-500/40 transition-colors text-sm font-medium disabled:opacity-50"
                            >
                              Delete
                            </button>
                          )}
                        </>
                      )}

                      {request.archivedAt && (
                        <button
                          onClick={() => handleUnarchive(request)}
                          disabled={actioningId === request.id}
                          className="px-3 py-1.5 bg-blue-500/25 text-blue-200 rounded-lg hover:bg-blue-500/40 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                          Unarchive
                        </button>
                      )}

                      {request.deletedAt && canRestore(request) && (
                        <button
                          onClick={() => handleRestore(request)}
                          disabled={actioningId === request.id}
                          className="px-3 py-1.5 bg-orange-500/25 text-orange-200 rounded-lg hover:bg-orange-500/40 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                          Restore
                        </button>
                      )}

                      {request.deletedAt && !canRestore(request) && (
                        <span className="text-xs text-white/50 italic">Expired</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approve/Deny Modal */}
      {showModal && modalData && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-6 max-w-md w-full mx-4 shadow-[0_8px_32px_rgba(31,38,135,0.3)] animate-glass-scale-in">
            <h2 className="text-2xl font-bold text-white mb-2">
              {modalData.action === 'approve' ? 'Approve' : 'Deny'} Leave Request
            </h2>
            <div className="w-full h-px bg-white/20 mb-6"></div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">Approved/Denied By</label>
                <div className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white font-medium">
                  {approvedBy}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">Notes (optional)</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add any notes..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowModal(false)
                  setAdminNotes('')
                  setModalData(null)
                }}
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white font-medium hover:bg-white/20 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={actioningId !== null}
                className={`flex-1 px-4 py-3 font-semibold rounded-xl border border-white/20 text-white transition-all disabled:opacity-50 ${
                  modalData.action === 'approve'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:shadow-[0_0_20px_rgba(52,199,89,0.5)]'
                    : 'bg-gradient-to-r from-red-500 to-pink-500 hover:shadow-[0_0_20px_rgba(255,59,48,0.5)]'
                }`}
              >
                Confirm {modalData.action === 'approve' ? 'Approval' : 'Denial'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Other Modals */}
      {selectedRequest && (
        <>
          <ArchiveConfirmModal
            isOpen={archiveModalOpen}
            onClose={() => { setArchiveModalOpen(false); setSelectedRequest(null); }}
            onConfirm={handleArchiveConfirm}
            loading={actioningId === selectedRequest?.id}
            requestInfo={{
              employeeName: selectedRequest.employeeName,
              leaveType: selectedRequest.leaveType,
              startDate: formatDate(selectedRequest.startDate),
              endDate: formatDate(selectedRequest.endDate)
            }}
          />
          <DeleteConfirmModal
            isOpen={deleteModalOpen}
            onClose={() => { setDeleteModalOpen(false); setSelectedRequest(null); }}
            onConfirm={handleDeleteConfirm}
            loading={actioningId === selectedRequest?.id}
            requestInfo={{
              employeeName: selectedRequest.employeeName,
              leaveType: selectedRequest.leaveType,
              startDate: formatDate(selectedRequest.startDate),
              endDate: formatDate(selectedRequest.endDate)
            }}
          />
          <UnarchiveConfirmModal
            isOpen={unarchiveModalOpen}
            onClose={() => { setUnarchiveModalOpen(false); setSelectedRequest(null); }}
            onConfirm={handleUnarchiveConfirm}
            loading={actioningId === selectedRequest?.id}
            requestInfo={{
              employeeName: selectedRequest.employeeName,
              leaveType: selectedRequest.leaveType,
              startDate: formatDate(selectedRequest.startDate),
              endDate: formatDate(selectedRequest.endDate)
            }}
          />
          <RestoreConfirmModal
            isOpen={restoreModalOpen}
            onClose={() => { setRestoreModalOpen(false); setSelectedRequest(null); }}
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
        </>
      )}
    </>
  )
}
