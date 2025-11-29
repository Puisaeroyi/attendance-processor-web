'use client'

import { RotateCcw, X, Clock } from 'lucide-react'

interface RestoreConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  loading: boolean
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
  loading,
  requestInfo
}: RestoreConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-6 max-w-md w-full mx-4 shadow-[0_8px_32px_rgba(31,38,135,0.3)] animate-glass-scale-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-xl">
              <RotateCcw className="w-6 h-6 text-orange-300" />
            </div>
            <h2 className="text-xl font-bold text-white">Restore Request</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-orange-500/15 border border-orange-400/30 rounded-xl p-4 mb-4 flex items-start gap-3">
          <Clock className="w-5 h-5 text-orange-300 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-orange-200 text-sm font-medium">
              {requestInfo.daysUntilExpiry} days left to restore
            </p>
            <p className="text-orange-200/70 text-xs mt-1">
              After expiry, this request will be permanently deleted.
            </p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 mb-4">
          <p className="text-sm text-white/90 font-medium">{requestInfo.employeeName}</p>
          <p className="text-sm text-white/70">{requestInfo.leaveType}</p>
          <p className="text-xs text-white/60 mt-1">
            {requestInfo.startDate} - {requestInfo.endDate}
          </p>
        </div>

        <p className="text-white/70 text-sm mb-6">
          This will restore the deleted request and make it active again.
        </p>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white font-medium hover:bg-white/20 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl border border-white/20 hover:shadow-[0_0_20px_rgba(255,149,0,0.5)] transition-all disabled:opacity-50"
          >
            {loading ? 'Restoring...' : 'Restore'}
          </button>
        </div>
      </div>
    </div>
  )
}
