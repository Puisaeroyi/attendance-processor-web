import { google } from 'googleapis'
import type { forms_v1 } from 'googleapis'
import type { GoogleFormResponse, FormMetadata } from '../types/googleForms'

// Configuration
const FORM_ID = '1qn-mIxu4sCUFN3gqdW5vdnNLfuCvI13DBXCBaDf257o'
const SERVICE_ACCOUNT_PATH = process.env.GOOGLE_SERVICE_ACCOUNT_PATH || '/home/silver/zeta1.json'

/**
 * Google Forms Poller Service
 * Authenticates with service account and fetches form responses
 */
export class GoogleFormsPoller {
  private auth: InstanceType<typeof google.auth.GoogleAuth>
  private forms: forms_v1.Forms

  constructor() {
    // Initialize Google Auth with service account
    this.auth = new google.auth.GoogleAuth({
      keyFile: SERVICE_ACCOUNT_PATH,
      scopes: [
        'https://www.googleapis.com/auth/forms.responses.readonly',
        'https://www.googleapis.com/auth/forms.body.readonly'
      ],
    })

    this.forms = google.forms({ version: 'v1', auth: this.auth })
  }

  /**
   * Fetch all form responses
   */
  async fetchFormResponses(): Promise<GoogleFormResponse[]> {
    try {
      const response = await this.forms.forms.responses.list({
        formId: FORM_ID,
      })

      return (response.data.responses as GoogleFormResponse[]) || []
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Error fetching form responses:', errorMessage)
      throw new Error(`Failed to fetch form responses: ${errorMessage}`)
    }
  }

  /**
   * Get form metadata (questions, structure)
   */
  async getFormMetadata(): Promise<FormMetadata> {
    try {
      const response = await this.forms.forms.get({
        formId: FORM_ID,
      })

      return response.data as FormMetadata
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Error fetching form metadata:', errorMessage)
      throw new Error(`Failed to fetch form metadata: ${errorMessage}`)
    }
  }

  /**
   * Verify API connection
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.getFormMetadata()
      return true
    } catch (error) {
      console.error('Google Forms API connection failed:', error)
      return false
    }
  }
}

// Export singleton instance
export const formsPoller = new GoogleFormsPoller()
