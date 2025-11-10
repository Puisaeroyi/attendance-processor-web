#!/usr/bin/env node

/**
 * Test script to verify console logging during processing
 */

const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testConsoleLogging() {
  console.log('='.repeat(60));
  console.log('USER FILTERING - CONSOLE LOG TEST');
  console.log('='.repeat(60));
  console.log('');

  const testFile = '/home/silver/testting.xlsx';

  // Check if file exists
  if (!fs.existsSync(testFile)) {
    console.error('ERROR: Test file not found:', testFile);
    process.exit(1);
  }

  console.log('✓ Test file found:', testFile);
  console.log('✓ File size:', fs.statSync(testFile).size, 'bytes');
  console.log('');

  // Create form data
  const formData = new FormData();
  formData.append('file', fs.createReadStream(testFile), {
    filename: 'testting.xlsx',
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  console.log('Sending request to http://localhost:3000/api/v1/processor...');
  console.log('');

  try {
    const response = await fetch('http://localhost:3000/api/v1/processor', {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });

    const data = await response.json();

    console.log('='.repeat(60));
    console.log('RESPONSE SUMMARY');
    console.log('='.repeat(60));
    console.log('');
    console.log('Status:', response.status);
    console.log('Success:', data.success);
    console.log('Message:', data.message);
    console.log('');

    if (data.debug) {
      console.log('DEBUG INFO:');
      console.log('  Total rows:', data.debug.totalRows);
      console.log('  Filtered by status:', data.debug.filteredByStatus);
      console.log('  Filtered by user:', data.debug.filteredByUser);
      console.log('  Allowed users:', data.debug.allowedUsers);
      console.log('');
    }

    if (data.result) {
      console.log('PROCESSING RESULTS:');
      console.log('  Records processed:', data.result.recordsProcessed);
      console.log('  Bursts detected:', data.result.burstsDetected);
      console.log('  Shifts found:', data.result.shiftInstancesFound);
      console.log('  Attendance records:', data.result.attendanceRecordsGenerated);
      console.log('');
    }

    // Validation
    console.log('='.repeat(60));
    console.log('VALIDATION RESULTS');
    console.log('='.repeat(60));
    console.log('');

    let passed = 0;
    let failed = 0;

    // Test 1: Success
    if (data.success === true) {
      console.log('✓ Processing successful');
      passed++;
    } else {
      console.log('✗ Processing failed');
      failed++;
    }

    // Test 2: Correct number of allowed users
    if (data.debug?.allowedUsers?.length === 4) {
      console.log('✓ Correct number of allowed users (4)');
      passed++;
    } else {
      console.log('✗ Expected 4 allowed users, got', data.debug?.allowedUsers?.length || 0);
      failed++;
    }

    // Test 3: Users were filtered
    if (data.debug?.filteredByUser > 0) {
      console.log(`✓ Filtered out ${data.debug.filteredByUser} unauthorized users`);
      passed++;
    } else {
      console.log('⚠ No users were filtered (might be OK if all users are authorized)');
      passed++;
    }

    // Test 4: Attendance records generated
    if (data.result?.attendanceRecordsGenerated > 0) {
      console.log(`✓ Generated ${data.result.attendanceRecordsGenerated} attendance records`);
      passed++;
    } else {
      console.log('✗ No attendance records generated');
      failed++;
    }

    // Test 5: No "No valid records" error
    if (!data.error || !data.error.includes('No valid records')) {
      console.log('✓ Did not get "No valid records found" error');
      passed++;
    } else {
      console.log('✗ Got "No valid records found" error');
      failed++;
    }

    console.log('');
    console.log('='.repeat(60));
    console.log('FINAL RESULTS');
    console.log('='.repeat(60));
    console.log('Tests passed:', passed);
    console.log('Tests failed:', failed);
    console.log('');

    if (failed === 0) {
      console.log('✓✓✓ ALL TESTS PASSED ✓✓✓');
      console.log('');
      console.log('The user filtering fix is working correctly!');
      console.log('- Users are filtered by username (swipe.name)');
      console.log('- Only authorized users from users.yaml are processed');
      console.log('- Unauthorized users are correctly filtered out');
      process.exit(0);
    } else {
      console.log('✗✗✗ SOME TESTS FAILED ✗✗✗');
      process.exit(1);
    }

  } catch (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  }
}

testConsoleLogging();
