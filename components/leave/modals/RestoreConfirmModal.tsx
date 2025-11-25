'use client'

import { Button } from '@/components/ui'

interface RestoreConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  loading?: boolean
  requestInfo: {
    employeeName: string
    leaveType: string
    startDate: string
    endDate: string
    deletedAt: string
    daysUntilExpiry: number
  }
}

export function RestoreConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  requestInfo
}: RestoreConfirmModalProps) {
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
            <h2 className="text-2xl font-black uppercase text-orange-600 mb-2">Restore Deleted Request</h2>
            <div className="w-full h-1 bg-orange-600 mb-4"></div>
            <p className="text-gray-700">
              Are you sure you want to restore this deleted leave request? This action can only be performed within the 7-day grace period.
            </p>
          </div>

          {/* Request Info */}
          <div className="bg-gray-50 p-4 border-2 border-black mb-6">
            <h3 className="font-bold text-sm uppercase mb-2">Request Details</h3>
            <div className="space-y-1 text-sm">
              <p><span className="font-semibold">Employee:</span> {requestInfo.employeeName}</p>
              <p><span className="font-semibold">Type:</span> {requestInfo.leaveType}</p>
              <p><span className="font-semibold">Dates:</span> {requestInfo.startDate} to {requestInfo.endDate}</p>
              <p><span className="font-semibold">Deleted:</span> {new Date(requestInfo.deletedAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Grace Period Warning */}
          <div className={`p-4 border-2 mb-6 ${
            requestInfo.daysUntilExpiry <= 2
              ? 'bg-red-50 border-red-600'
              : 'bg-orange-50 border-orange-600'
          }`}>
            <p className={`font-bold text-sm uppercase ${
              requestInfo.daysUntilExpiry <= 2 ? 'text-red-800' : 'text-orange-800'
            }`}>
              ⏰ Grace Period Information
            </p>
            <p className={`text-sm mt-1 ${
              requestInfo.daysUntilExpiry <= 2 ? 'text-red-700' : 'text-orange-700'
            }`}>
              {requestInfo.daysUntilExpiry <= 1
                ? 'This request expires in less than 24 hours!'
                : `This request can be restored for ${requestInfo.daysUntilExpiry} more day(s).`
              }
              After the grace period, it cannot be restored.
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
              variant="warning"
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Restoring...' : 'Restore Request'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}