/**
 * Google Forms Response Parser
 * Parses form responses and converts them to leave request format
 */

import { GoogleFormResponse } from '../types/googleForms'

// Question ID mapping for the Google Form
// These IDs must match your actual Google Form question IDs
const QUESTION_ID_MAP = {
  employeeName: '3cf96cf1',    // Your Full Name in Vietnamese
  managerName: '7e8ea684',     // Manager/Supervisor Name
  leaveType: '26f63efd',       // Type of Leave
  startDate: '2fed37e3',       // Leave Start Date
  endDate: '05aca5bc',         // Leave End Date
  shiftType: '597d2161',       // FHS/ SHS/ FS
  reason: '3d8f8e20'           // Reason for Leave
}

interface ParsedLeaveRequest {
  formResponseId: string
  employeeName: string
  managerName: string
  leaveType: string
  startDate: Date
  endDate: Date
  shiftType: string
  reason: string
  durationDays: number
  submittedAt: Date
}

/**
 * Parse a single form response
 */
export function parseFormResponse(response: GoogleFormResponse): ParsedLeaveRequest | null {
  try {
    if (!response.answers) {
      console.warn(`Response ${response.responseId} has no answers`)
      return null
    }

    // Extract answers - Google Forms API returns answers with question IDs
    // We need to map question IDs to our field names
    const answers = response.answers
    const answerValues: Record<string, string> = {}

    // Convert answers to key-value pairs
    // Handle both textAnswers (Short Answer, Date) and Multiple Choice answers
    Object.keys(answers).forEach((questionId) => {
      const answer = answers[questionId]

      // Skip if answer is undefined
      if (!answer) {
        return
      }

      // Try textAnswers first (Short Answer, Paragraph, Date fields)
      if (answer.textAnswers?.answers?.[0]?.value) {
        answerValues[questionId] = answer.textAnswers.answers[0].value
      }
      // Handle Multiple Choice answers
      else if (answer.textAnswers?.answers) {
        // Multiple choice can have selected option in textAnswers
        const selected = answer.textAnswers.answers[0]?.value
        if (selected) {
          answerValues[questionId] = selected
        }
      }
    })

    // Debug: Log extracted values to help diagnose field mapping issues
    console.log(`📋 Response ${response.responseId} extracted ${Object.keys(answerValues).length} answers`)

    // Extract values using question ID mapping
    const employeeName = answerValues[QUESTION_ID_MAP.employeeName]
    const managerName = answerValues[QUESTION_ID_MAP.managerName]
    const leaveType = answerValues[QUESTION_ID_MAP.leaveType]
    const startDateStr = answerValues[QUESTION_ID_MAP.startDate]
    const endDateStr = answerValues[QUESTION_ID_MAP.endDate]
    const shiftType = answerValues[QUESTION_ID_MAP.shiftType]
    const reason = answerValues[QUESTION_ID_MAP.reason]

    // Validate all required fields exist
    if (!employeeName || !managerName || !leaveType || !startDateStr || !endDateStr || !shiftType || !reason) {
      console.warn(`⚠️  Response ${response.responseId} has missing required fields:`)
      console.warn(`     Employee: ${employeeName || 'MISSING'}`)
      console.warn(`     Manager: ${managerName || 'MISSING'}`)
      console.warn(`     Leave Type: ${leaveType || 'MISSING'}`)
      console.warn(`     Start Date: ${startDateStr || 'MISSING'}`)
      console.warn(`     End Date: ${endDateStr || 'MISSING'}`)
      console.warn(`     Shift Type: ${shiftType || 'MISSING'}`)
      console.warn(`     Reason: ${reason || 'MISSING'}`)
      return null
    }

    // Parse dates
    const startDate = new Date(startDateStr)
    const endDate = new Date(endDateStr)

    // Calculate duration in days
    const durationDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1

    // Parse submitted date
    const submittedAt = new Date(response.lastSubmittedTime || response.createTime)

    const parsed = {
      formResponseId: response.responseId,
      employeeName: employeeName.trim(),
      managerName: managerName.trim(),
      leaveType: leaveType.trim(),
      startDate,
      endDate,
      shiftType: shiftType.trim(),
      reason: reason.trim(),
      durationDays,
      submittedAt
    }

    console.log(`✅ Parsed request: ${parsed.employeeName} - ${parsed.leaveType} (${parsed.startDate.toISOString().split('T')[0]} to ${parsed.endDate.toISOString().split('T')[0]})`)

    return parsed
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`Error parsing response ${response.responseId}:`, errorMessage)
    return null
  }
}

/**
 * Parse multiple form responses
 */
export function parseFormResponses(responses: GoogleFormResponse[]): ParsedLeaveRequest[] {
  const parsed: ParsedLeaveRequest[] = []

  for (const response of responses) {
    const parsedResponse = parseFormResponse(response)
    if (parsedResponse) {
      parsed.push(parsedResponse)
    }
  }

  return parsed
}

/**
 * Validate parsed leave request
 */
export function validateLeaveRequest(request: ParsedLeaveRequest): boolean {
  // Check required fields
  if (!request.employeeName || !request.managerName || !request.leaveType) {
    return false
  }

  if (!request.startDate || !request.endDate || !request.shiftType || !request.reason) {
    return false
  }

  // Check dates are valid
  if (isNaN(request.startDate.getTime()) || isNaN(request.endDate.getTime())) {
    return false
  }

  // Check end date is after start date
  if (request.endDate < request.startDate) {
    return false
  }

  // Check duration is positive
  if (request.durationDays <= 0) {
    return false
  }

  return true
}
