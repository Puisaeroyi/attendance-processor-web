'use client'

import { ArchiveRestore, X } from 'lucide-react'

interface UnarchiveConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  loading: boolean
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
  loading,
  requestInfo
}: UnarchiveConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-6 max-w-md w-full mx-4 shadow-[0_8px_32px_rgba(31,38,135,0.3)] animate-glass-scale-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-xl">
              <ArchiveRestore className="w-6 h-6 text-blue-300" />
            </div>
            <h2 className="text-xl font-bold text-white">Unarchive Request</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 mb-4">
          <p className="text-sm text-white/90 font-medium">{requestInfo.employeeName}</p>
          <p className="text-sm text-white/70">{requestInfo.leaveType}</p>
          <p className="text-xs text-white/60 mt-1">
            {requestInfo.startDate} - {requestInfo.endDate}
          </p>
        </div>

        <p className="text-white/70 text-sm mb-6">
          This will restore the request from the archive and make it active again.
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
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl border border-white/20 hover:shadow-[0_0_20px_rgba(0,122,255,0.5)] transition-all disabled:opacity-50"
          >
            {loading ? 'Unarchiving...' : 'Unarchive'}
          </button>
        </div>
      </div>
    </div>
  )
}
