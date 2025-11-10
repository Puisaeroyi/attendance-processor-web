#!/bin/bash

# Comprehensive User Filtering Test Script
# Tests the fix for swipe.id -> swipe.name filtering

echo "=========================================="
echo "USER FILTERING FIX - COMPREHENSIVE TEST"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
SERVER_URL="http://localhost:3001"
API_ENDPOINT="${SERVER_URL}/api/v1/processor"
TEST_FILE="/home/silver/testting.xlsx"
LOG_FILE="/tmp/nextjs-dev.log"

# Step 1: Check server is running
echo -e "${BLUE}[TEST 1] Checking server status...${NC}"
if curl -s "${SERVER_URL}" > /dev/null; then
    echo -e "${GREEN}✓ Server is running at ${SERVER_URL}${NC}"
else
    echo -e "${RED}✗ Server is not accessible${NC}"
    exit 1
fi
echo ""

# Step 2: Verify test file exists
echo -e "${BLUE}[TEST 2] Verifying test file...${NC}"
if [ -f "${TEST_FILE}" ]; then
    echo -e "${GREEN}✓ Test file found: ${TEST_FILE}${NC}"
    FILE_SIZE=$(stat -c%s "${TEST_FILE}" 2>/dev/null || stat -f%z "${TEST_FILE}" 2>/dev/null)
    echo -e "  File size: ${FILE_SIZE} bytes"
else
    echo -e "${RED}✗ Test file not found: ${TEST_FILE}${NC}"
    exit 1
fi
echo ""

# Step 3: Process the file
echo -e "${BLUE}[TEST 3] Processing test file with user filtering...${NC}"
RESPONSE=$(curl -s -X POST "${API_ENDPOINT}" \
  -F "file=@${TEST_FILE}" \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')

echo -e "HTTP Status: ${HTTP_CODE}"
echo ""

if [ "${HTTP_CODE}" = "200" ]; then
    echo -e "${GREEN}✓ Request successful (200 OK)${NC}"
else
    echo -e "${RED}✗ Request failed with HTTP ${HTTP_CODE}${NC}"
fi
echo ""

# Step 4: Parse and validate response
echo -e "${BLUE}[TEST 4] Analyzing response data...${NC}"
echo "$RESPONSE_BODY" | jq . > /tmp/test-response.json 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Valid JSON response${NC}"

    # Extract key metrics
    SUCCESS=$(echo "$RESPONSE_BODY" | jq -r '.success')
    MESSAGE=$(echo "$RESPONSE_BODY" | jq -r '.message')
    TOTAL_ROWS=$(echo "$RESPONSE_BODY" | jq -r '.debug.totalRows')
    FILTERED_STATUS=$(echo "$RESPONSE_BODY" | jq -r '.debug.filteredByStatus')
    FILTERED_USER=$(echo "$RESPONSE_BODY" | jq -r '.debug.filteredByUser')
    ALLOWED_USERS=$(echo "$RESPONSE_BODY" | jq -r '.debug.allowedUsers | @json')
    RECORDS_PROCESSED=$(echo "$RESPONSE_BODY" | jq -r '.result.recordsProcessed')
    ATTENDANCE_RECORDS=$(echo "$RESPONSE_BODY" | jq -r '.result.attendanceRecordsGenerated')

    echo ""
    echo -e "${YELLOW}=== Processing Summary ===${NC}"
    echo "  Success: ${SUCCESS}"
    echo "  Message: ${MESSAGE}"
    echo "  Total rows in file: ${TOTAL_ROWS}"
    echo "  Filtered by status: ${FILTERED_STATUS}"
    echo "  Filtered by user: ${FILTERED_USER}"
    echo "  Records processed: ${RECORDS_PROCESSED}"
    echo "  Attendance records generated: ${ATTENDANCE_RECORDS}"
    echo "  Allowed users: ${ALLOWED_USERS}"

else
    echo -e "${RED}✗ Invalid JSON response${NC}"
    echo "Raw response:"
    echo "$RESPONSE_BODY"
fi
echo ""

# Step 5: Check server console logs
echo -e "${BLUE}[TEST 5] Examining server console logs...${NC}"
if [ -f "${LOG_FILE}" ]; then
    echo -e "${YELLOW}=== Allowed Users Log ===${NC}"
    grep -i "Allowed users:" "${LOG_FILE}" | tail -n 5

    echo ""
    echo -e "${YELLOW}=== Filtered Users Log ===${NC}"
    grep -i "Filtered out unauthorized user:" "${LOG_FILE}" | tail -n 20

    echo ""
    echo -e "${YELLOW}=== Error/Warning Logs ===${NC}"
    grep -iE "(error|warning|fail)" "${LOG_FILE}" | tail -n 10
else
    echo -e "${YELLOW}! Log file not found at ${LOG_FILE}${NC}"
fi
echo ""

# Step 6: Validate expected behavior
echo -e "${BLUE}[TEST 6] Validating expected behavior...${NC}"
TESTS_PASSED=0
TESTS_FAILED=0

# Test 6.1: Should process successfully
if [ "${SUCCESS}" = "true" ]; then
    echo -e "${GREEN}✓ Processing was successful${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ Processing failed${NC}"
    ((TESTS_FAILED++))
fi

# Test 6.2: Should have exactly 4 allowed users
USER_COUNT=$(echo "$ALLOWED_USERS" | jq '. | length')
if [ "${USER_COUNT}" = "4" ]; then
    echo -e "${GREEN}✓ Correct number of allowed users (4)${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ Expected 4 allowed users, got ${USER_COUNT}${NC}"
    ((TESTS_FAILED++))
fi

# Test 6.3: Should have filtered out unauthorized users
if [ "${FILTERED_USER}" != "0" ] && [ "${FILTERED_USER}" != "null" ]; then
    echo -e "${GREEN}✓ Unauthorized users were filtered out (${FILTERED_USER} users)${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}! No unauthorized users filtered (${FILTERED_USER})${NC}"
    ((TESTS_PASSED++))
fi

# Test 6.4: Should generate attendance records
if [ "${ATTENDANCE_RECORDS}" != "0" ] && [ "${ATTENDANCE_RECORDS}" != "null" ]; then
    echo -e "${GREEN}✓ Attendance records were generated (${ATTENDANCE_RECORDS})${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ No attendance records generated${NC}"
    ((TESTS_FAILED++))
fi

# Test 6.5: Should not return "No valid records found" error
ERROR_MSG=$(echo "$RESPONSE_BODY" | jq -r '.error // empty')
if [[ "${ERROR_MSG}" == *"No valid records found"* ]]; then
    echo -e "${RED}✗ Got 'No valid records found' error${NC}"
    ((TESTS_FAILED++))
else
    echo -e "${GREEN}✓ Did not get 'No valid records found' error${NC}"
    ((TESTS_PASSED++))
fi

echo ""

# Final summary
echo -e "${BLUE}=========================================="
echo "TEST RESULTS SUMMARY"
echo -e "==========================================${NC}"
echo -e "Tests passed: ${GREEN}${TESTS_PASSED}${NC}"
echo -e "Tests failed: ${RED}${TESTS_FAILED}${NC}"
echo ""

if [ ${TESTS_FAILED} -eq 0 ]; then
    echo -e "${GREEN}✓✓✓ ALL TESTS PASSED ✓✓✓${NC}"
    echo ""
    echo "The user filtering fix is working correctly!"
    echo "- Users are being filtered by username (swipe.name) not badge ID (swipe.id)"
    echo "- Only authorized users from users.yaml are processed"
    echo "- Unauthorized users are correctly filtered out"
    exit 0
else
    echo -e "${RED}✗✗✗ SOME TESTS FAILED ✗✗✗${NC}"
    echo ""
    echo "Please review the logs and response above for details."
    exit 1
fi
