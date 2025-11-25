'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'

interface ArchiveConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason?: string) => void
  loading?: boolean
  requestInfo: {
    employeeName: string
    leaveType: string
    startDate: string
    endDate: string
  }
}

export function ArchiveConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  requestInfo
}: ArchiveConfirmModalProps) {
  const [reason, setReason] = useState('')

  const handleConfirm = () => {
    onConfirm(reason.trim() || undefined)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-4 border-black shadow-lg max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-black uppercase mb-2">Archive Leave Request</h2>
            <div className="w-full h-1 bg-black mb-4"></div>
            <p className="text-gray-700">
              Are you sure you want to archive this leave request? Archived requests can be restored later.
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

          {/* Reason Field (Optional) */}
          <div className="mb-6">
            <label className="block text-sm font-bold uppercase mb-2">
              Reason for Archiving (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for archiving..."
              rows={3}
              className="w-full p-3 border-2 border-black focus:outline-none focus:ring-4 focus:ring-yellow-300"
              disabled={loading}
            />
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
              variant="warning"
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Archiving...' : 'Archive Request'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}