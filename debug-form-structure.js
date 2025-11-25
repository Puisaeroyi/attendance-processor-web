#!/usr/bin/env node
/**
 * Debug script to inspect Google Form structure and response format
 */

const { formsPoller } = require('./lib/services/googleFormsPoller.ts')

async function debugFormStructure() {
  try {
    console.log('🔍 Fetching form metadata...\n')

    // Get form structure
    const metadata = await formsPoller.getFormMetadata()

    console.log('📋 Form Title:', metadata.info.title)
    console.log('\n📝 Questions:')

    if (metadata.items) {
      metadata.items.forEach((item, index) => {
        if (item.questionItem) {
          const question = item.questionItem.question
          console.log(`\n${index + 1}. Question ID: ${item.questionItem.question.questionId}`)
          console.log(`   Title: ${item.title}`)
          console.log(`   Type: ${Object.keys(question).find(k => k.endsWith('Question'))}`)
        }
      })
    }

    console.log('\n\n📥 Fetching responses...\n')

    // Get responses
    const responses = await formsPoller.fetchFormResponses()

    console.log(`Found ${responses.length} response(s)\n`)

    if (responses.length > 0) {
      const firstResponse = responses[0]
      console.log('📄 First Response:')
      console.log('   Response ID:', firstResponse.responseId)
      console.log('\n   Answers:')

      Object.entries(firstResponse.answers || {}).forEach(([questionId, answer]) => {
        console.log(`\n   Question ID: ${questionId}`)
        console.log('   Answer structure:', JSON.stringify(answer, null, 2))
      })
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

debugFormStructure()
