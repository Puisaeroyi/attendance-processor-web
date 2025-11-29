'use client'

import { useState } from 'react'
import { Archive, X } from 'lucide-react'

interface ArchiveConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason?: string) => Promise<void>
  loading: boolean
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
  loading,
  requestInfo
}: ArchiveConfirmModalProps) {
  const [reason, setReason] = useState('')

  if (!isOpen) return null

  const handleConfirm = async () => {
    await onConfirm(reason || undefined)
    setReason('')
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-6 max-w-md w-full mx-4 shadow-[0_8px_32px_rgba(31,38,135,0.3)] animate-glass-scale-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-xl">
              <Archive className="w-6 h-6 text-yellow-300" />
            </div>
            <h2 className="text-xl font-bold text-white">Archive Request</h2>
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

        <p className="text-white/70 text-sm mb-4">
          This request will be moved to the archive. You can unarchive it later if needed.
        </p>

        <div className="mb-6">
          <label className="block text-sm font-medium text-white/90 mb-2">
            Reason (optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason for archiving..."
            rows={2}
            className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 resize-none"
          />
        </div>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white font-medium hover:bg-white/20 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl border border-white/20 hover:shadow-[0_0_20px_rgba(255,204,0,0.5)] transition-all disabled:opacity-50"
          >
            {loading ? 'Archiving...' : 'Archive'}
          </button>
        </div>
      </div>
    </div>
  )
}
