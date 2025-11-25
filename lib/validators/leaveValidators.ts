import { z } from 'zod'

/**
 * Validation schema for leave request filters
 */
export const LeaveRequestFiltersSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'DENIED', 'ARCHIVED', 'DELETED']).optional(),
  employeeName: z.string().optional(),
  managerName: z.string().optional(),
  leaveType: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  includeArchived: z.boolean().optional(),
  includeDeleted: z.boolean().optional()
})

export type LeaveRequestFilters = z.infer<typeof LeaveRequestFiltersSchema>

/**
 * Validation schema for approve/deny actions
 */
export const LeaveActionSchema = z.object({
  requestId: z.number().int().positive(),
  adminNotes: z.string().optional(),
  approvedBy: z.string().min(1, 'Approver name is required')
})

export type LeaveAction = z.infer<typeof LeaveActionSchema>

/**
 * Validation schema for creating leave request manually
 */
export const CreateLeaveRequestSchema = z.object({
  formResponseId: z.string().min(1),
  employeeName: z.string().min(1),
  managerName: z.string().min(1),
  leaveType: z.enum(['Vacation', 'Sick Leave', 'Unpaid', 'Other']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  shiftType: z.enum(['First-Half', 'Second-Half', 'Full Shift']),
  reason: z.string().min(1),
  durationDays: z.number().int().positive(),
  submittedAt: z.string().datetime()
})

export type CreateLeaveRequest = z.infer<typeof CreateLeaveRequestSchema>

/**
 * Validation schema for archive action
 */
export const ArchiveActionSchema = z.object({
  requestId: z.number().int().positive(),
  archivedBy: z.string().min(1, 'Archiver name is required'),
  reason: z.string().optional()
})

export type ArchiveAction = z.infer<typeof ArchiveActionSchema>

/**
 * Validation schema for delete action
 */
export const DeleteActionSchema = z.object({
  requestId: z.number().int().positive(),
  deletedBy: z.string().min(1, 'Deleter name is required'),
  reason: z.string().min(1, 'Deletion reason is required')
})

export type DeleteAction = z.infer<typeof DeleteActionSchema>

/**
 * Validation schema for unarchive action
 */
export const UnarchiveActionSchema = z.object({
  requestId: z.number().int().positive(),
  unarchivedBy: z.string().min(1, 'Unarchiver name is required'),
  reason: z.string().optional()
})

export type UnarchiveAction = z.infer<typeof UnarchiveActionSchema>

/**
 * Validation schema for restore action
 */
export const RestoreActionSchema = z.object({
  requestId: z.number().int().positive(),
  restoredBy: z.string().min(1, 'Restorer name is required'),
  reason: z.string().optional()
})

export type RestoreAction = z.infer<typeof RestoreActionSchema>
