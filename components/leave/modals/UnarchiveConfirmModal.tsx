'use client'

import { Button } from '@/components/ui'

interface UnarchiveConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  loading?: boolean
  requestInfo: {
    employeeName: string
    leaveType: string
    startDate: string
    endDate: string
  }
}

export function UnarchiveConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  requestInfo
}: UnarchiveConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-4 border-black shadow-lg max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-black uppercase mb-2">Unarchive Leave Request</h2>
            <div className="w-full h-1 bg-blue-600 mb-4"></div>
            <p className="text-gray-700">
              Are you sure you want to unarchive this leave request? It will be restored to its previous status.
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

          {/* Info Message */}
          <div className="bg-blue-50 border-2 border-blue-600 p-4 mb-6">
            <p className="text-blue-800 font-bold text-sm uppercase">ℹ️ Information</p>
            <p className="text-blue-700 text-sm mt-1">
              This request will be restored to its original status (Pending, Approved, or Denied).
            </p>
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
              variant="primary"
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Unarchiving...' : 'Unarchive Request'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}