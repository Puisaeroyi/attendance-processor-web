/**
 * Google Forms API Type Definitions
 * Based on Google Forms API v1 response structure
 */

/**
 * Answer value for text-based questions (Short Answer, Paragraph, Date)
 */
export interface TextAnswer {
  value: string
}

/**
 * Text answers wrapper
 */
export interface TextAnswers {
  answers: TextAnswer[]
}

/**
 * File upload answer
 */
export interface FileUploadAnswer {
  fileId: string
  fileName: string
  mimeType: string
}

/**
 * File upload answers wrapper
 */
export interface FileUploadAnswers {
  answers: FileUploadAnswer[]
}

/**
 * Single answer for a question
 * Can be text-based or file upload
 */
export interface FormAnswer {
  questionId: string
  textAnswers?: TextAnswers
  fileUploadAnswers?: FileUploadAnswers
}

/**
 * Complete form response from Google Forms API
 */
export interface GoogleFormResponse {
  responseId: string
  createTime: string
  lastSubmittedTime: string
  respondentEmail?: string
  answers?: Record<string, FormAnswer>
}

/**
 * Response from forms.responses.list API call
 */
export interface FormResponsesListResponse {
  responses?: GoogleFormResponse[]
  nextPageToken?: string
}

/**
 * Form metadata structure
 */
export interface FormMetadata {
  formId: string
  info: {
    title: string
    documentTitle: string
    description?: string
  }
  items?: FormItem[]
  settings?: {
    quizSettings?: {
      isQuiz: boolean
    }
  }
}

/**
 * Form item (question)
 */
export interface FormItem {
  itemId: string
  title: string
  description?: string
  questionItem?: {
    question: {
      questionId: string
      required: boolean
      choiceQuestion?: {
        type: string
        options: Array<{ value: string }>
      }
      textQuestion?: {
        paragraph: boolean
      }
      dateQuestion?: {
        includeTime: boolean
        includeYear: boolean
      }
      fileUploadQuestion?: {
        folderId: string
        types: string[]
        maxFiles: number
        maxFileSize: string
      }
    }
  }
}

/**
 * Error response from Google Forms API
 */
export interface GoogleFormsError {
  code: number
  message: string
  status: string
  details?: Array<{
    '@type': string
    reason?: string
    domain?: string
    metadata?: Record<string, string>
  }>
}
