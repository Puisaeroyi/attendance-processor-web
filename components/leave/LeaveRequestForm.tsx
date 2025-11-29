'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface LeaveRequestFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: LeaveRequestFormData) => Promise<void>
  defaultFullName?: string
}

export interface LeaveRequestFormData {
  fullName: string
  managerName: string
  leaveType: string
  startDate: string
  endDate: string
  shiftType: string
  reason: string
}

const LEAVE_TYPES = [
  'Annual Leave',
  'Sick Leave (Illness or Injury)',
  'Unpaid Leave',
  'Other'
]

const SHIFT_TYPES = [
  'Full Day',
  'First-Half',
  'Second-Half'
]

const MANAGERS = [
  'Mr. Jaebum Park',
  'Mr. Jinsoo Park',
  'Mr. Ian Lee'
]

export function LeaveRequestForm({ isOpen, onClose, onSubmit, defaultFullName = '' }: LeaveRequestFormProps) {
  const [formData, setFormData] = useState<LeaveRequestFormData>({
    fullName: defaultFullName,
    managerName: '',
    leaveType: '',
    startDate: '',
    endDate: '',
    shiftType: 'Full Day',
    reason: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof LeaveRequestFormData, string>>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof LeaveRequestFormData, string>> = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }
    if (!formData.managerName.trim()) {
      newErrors.managerName = 'Manager/Supervisor name is required'
    }
    if (!formData.leaveType) {
      newErrors.leaveType = 'Leave type is required'
    }
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required'
    }
    if (!formData.endDate) {
      newErrors.endDate = 'End date is required'
    }
    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date'
    }
    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      await onSubmit(formData)
      setFormData({
        fullName: defaultFullName,
        managerName: '',
        leaveType: '',
        startDate: '',
        endDate: '',
        shiftType: 'Full Day',
        reason: ''
      })
      onClose()
    } catch {
      // Error handling is done in parent component
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof LeaveRequestFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl shadow-[0_8px_32px_rgba(31,38,135,0.3)] w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto animate-glass-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <h2 className="text-xl font-bold text-white">New Leave Request</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Full Name <span className="text-red-300">*</span>
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              className={`w-full px-4 py-3 bg-white/10 backdrop-blur-sm border rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all ${
                errors.fullName ? 'border-red-400/60' : 'border-white/20'
              }`}
              placeholder="Enter your full name"
            />
            {errors.fullName && <p className="text-red-300 text-sm mt-1">{errors.fullName}</p>}
          </div>

          {/* Manager/Supervisor Name */}
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Manager/Supervisor Name <span className="text-red-300">*</span>
            </label>
            <select
              value={formData.managerName}
              onChange={(e) => handleChange('managerName', e.target.value)}
              className={`w-full px-4 py-3 bg-white/10 backdrop-blur-sm border rounded-xl text-white focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all ${
                errors.managerName ? 'border-red-400/60' : 'border-white/20'
              }`}
            >
              <option value="" className="bg-gray-800">Select your manager</option>
              {MANAGERS.map(manager => (
                <option key={manager} value={manager} className="bg-gray-800">{manager}</option>
              ))}
            </select>
            {errors.managerName && <p className="text-red-300 text-sm mt-1">{errors.managerName}</p>}
          </div>

          {/* Leave Type */}
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Leave Type <span className="text-red-300">*</span>
            </label>
            <select
              value={formData.leaveType}
              onChange={(e) => handleChange('leaveType', e.target.value)}
              className={`w-full px-4 py-3 bg-white/10 backdrop-blur-sm border rounded-xl text-white focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all ${
                errors.leaveType ? 'border-red-400/60' : 'border-white/20'
              }`}
            >
              <option value="" className="bg-gray-800">Select leave type</option>
              {LEAVE_TYPES.map(type => (
                <option key={type} value={type} className="bg-gray-800">{type}</option>
              ))}
            </select>
            {errors.leaveType && <p className="text-red-300 text-sm mt-1">{errors.leaveType}</p>}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Start Date <span className="text-red-300">*</span>
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className={`w-full px-4 py-3 bg-white/10 backdrop-blur-sm border rounded-xl text-white focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all ${
                  errors.startDate ? 'border-red-400/60' : 'border-white/20'
                }`}
              />
              {errors.startDate && <p className="text-red-300 text-sm mt-1">{errors.startDate}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                End Date <span className="text-red-300">*</span>
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                className={`w-full px-4 py-3 bg-white/10 backdrop-blur-sm border rounded-xl text-white focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all ${
                  errors.endDate ? 'border-red-400/60' : 'border-white/20'
                }`}
              />
              {errors.endDate && <p className="text-red-300 text-sm mt-1">{errors.endDate}</p>}
            </div>
          </div>

          {/* Shift Type */}
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Shift Type
            </label>
            <select
              value={formData.shiftType}
              onChange={(e) => handleChange('shiftType', e.target.value)}
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all"
            >
              {SHIFT_TYPES.map(type => (
                <option key={type} value={type} className="bg-gray-800">{type}</option>
              ))}
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Reason <span className="text-red-300">*</span>
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => handleChange('reason', e.target.value)}
              rows={3}
              className={`w-full px-4 py-3 bg-white/10 backdrop-blur-sm border rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all resize-none ${
                errors.reason ? 'border-red-400/60' : 'border-white/20'
              }`}
              placeholder="Enter reason for leave"
            />
            {errors.reason && <p className="text-red-300 text-sm mt-1">{errors.reason}</p>}
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white font-medium hover:bg-white/20 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl border border-white/20 hover:shadow-[0_0_20px_rgba(102,126,234,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
