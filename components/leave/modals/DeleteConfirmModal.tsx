'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string, deletedBy: string) => void
  loading?: boolean
  requestInfo: {
    employeeName: string
    leaveType: string
    startDate: string
    endDate: string
  }
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  requestInfo
}: DeleteConfirmModalProps) {
  const [reason, setReason] = useState('')
  const [deletedBy, setDeletedBy] = useState('')

  const handleConfirm = () => {
    if (!reason.trim()) {
      alert('Reason is required for deletion')
      return
    }
    if (!deletedBy.trim()) {
      alert('Your name is required for deletion')
      return
    }
    onConfirm(reason.trim(), deletedBy.trim())
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-4 border-black shadow-lg max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-black uppercase text-red-600 mb-2">Delete Leave Request</h2>
            <div className="w-full h-1 bg-red-600 mb-4"></div>

            {/* Warning Message */}
            <div className="bg-red-50 border-2 border-red-600 p-4 mb-4">
              <p className="text-red-800 font-bold text-sm uppercase">⚠️ Warning</p>
              <p className="text-red-700 text-sm mt-1">
                This action cannot be undone. The request will be marked as deleted and can only be restored within 7 days.
              </p>
            </div>

            <p className="text-gray-700">
              Are you sure you want to permanently delete this leave request?
            </p>
          </div>

          {/* Request Info */}
          <div className="bg-gray-50 p-4 border-2 border-black mb-6">
            <h3 className="font-bold text-sm uppercase mb-2">Request Details</h3>
            <div className="space-y-1 text-sm">
              <p><span className="font-semibold">Employee:</span> {requestInfo.employeeName}</p>
              <p><span className="font-semibold">Type:</span> {requestInfo.leaveType}</p>
              <p><span className="font-semibold">Dates:</span> {requestInfo.startDate} to {requestInfo.endDate}</p>
            </div>
          </div>

          {/* Your Name Field (Required) */}
          <div className="mb-4">
            <label className="block text-sm font-bold uppercase mb-2">
              Your Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={deletedBy}
              onChange={(e) => setDeletedBy(e.target.value)}
              placeholder="Enter your name"
              className="w-full p-3 border-2 border-black focus:outline-none focus:ring-4 focus:ring-red-300"
              disabled={loading}
              required
            />
            {!deletedBy.trim() && (
              <p className="text-red-600 text-xs mt-1">Your name is required</p>
            )}
          </div>

          {/* Reason Field (Required) */}
          <div className="mb-6">
            <label className="block text-sm font-bold uppercase mb-2">
              Reason for Deletion <span className="text-red-600">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a reason for deletion..."
              rows={3}
              className="w-full p-3 border-2 border-black focus:outline-none focus:ring-4 focus:ring-red-300"
              disabled={loading}
              required
            />
            {!reason.trim() && (
              <p className="text-red-600 text-xs mt-1">Reason is required</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="error"
              onClick={handleConfirm}
              disabled={loading || !reason.trim() || !deletedBy.trim()}
              className="flex-1"
            >
              {loading ? 'Deleting...' : 'Delete Request'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}