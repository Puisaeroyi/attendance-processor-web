/**
 * Attendance Processing API Route
 * POST /api/v1/processor/process
 */

import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { BurstDetector } from '@/lib/processors/BurstDetector';
import { ShiftDetector } from '@/lib/processors/ShiftDetector';
import { BreakDetector } from '@/lib/processors/BreakDetector';
import { parseSwipeRecord, validateRequiredColumns } from '@/lib/utils/dataParser';
import { loadCombinedConfig, createUserMapper, convertYamlToShiftConfigs } from '@/lib/config/yamlLoader';
import type {
  ProcessingResult,
  SwipeRecord,
  RuleConfig,
  ShiftConfig,
  AttendanceRecord,
} from '@/types/attendance';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Security: File size limit (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Default shift configurations from rule.yaml v10.0
const DEFAULT_SHIFT_CONFIGS: Record<string, ShiftConfig> = {
  A: {
    name: 'A',
    displayName: 'Morning',
    checkInStart: '05:30:00',
    checkInEnd: '06:35:00',
    shiftStart: '06:00:00',
    checkInOnTimeCutoff: '06:04:59',
    checkInLateThreshold: '06:05:00',
    checkOutStart: '13:30:00',
    checkOutEnd: '14:35:00',
    breakSearchStart: '09:50:00',
    breakSearchEnd: '10:35:00',
    breakOutCheckpoint: '10:00:00',
    midpoint: '10:15:00',
    minimumBreakGapMinutes: 5,
    breakEndTime: '10:30:00',
    breakInOnTimeCutoff: '10:34:59',
    breakInLateThreshold: '10:35:00',
  },
  B: {
    name: 'B',
    displayName: 'Afternoon',
    checkInStart: '13:30:00',
    checkInEnd: '14:35:00',
    shiftStart: '14:00:00',
    checkInOnTimeCutoff: '14:04:59',
    checkInLateThreshold: '14:05:00',
    checkOutStart: '21:30:00',
    checkOutEnd: '22:35:00',
    breakSearchStart: '17:50:00',
    breakSearchEnd: '18:35:00',
    breakOutCheckpoint: '18:00:00',
    midpoint: '18:15:00',
    minimumBreakGapMinutes: 5,
    breakEndTime: '18:30:00',
    breakInOnTimeCutoff: '18:34:59',
    breakInLateThreshold: '18:35:00',
  },
  C: {
    name: 'C',
    displayName: 'Night',
    checkInStart: '21:30:00',
    checkInEnd: '22:35:00',
    shiftStart: '22:00:00',
    checkInOnTimeCutoff: '22:04:59',
    checkInLateThreshold: '22:05:00',
    checkOutStart: '05:30:00',
    checkOutEnd: '06:35:00',
    breakSearchStart: '01:50:00',
    breakSearchEnd: '02:50:00',
    breakOutCheckpoint: '02:00:00',
    midpoint: '02:22:30',
    minimumBreakGapMinutes: 5,
    breakEndTime: '02:45:00',
    breakInOnTimeCutoff: '02:49:59',
    breakInLateThreshold: '02:50:00',
  },
};

/**
 * Determine check-in status based on time
 */
function determineCheckInStatus(checkInTime: string, shiftConfig: ShiftConfig): string {
  if (!checkInTime) return '';

  const time = checkInTime.substring(0, 8); // HH:MM:SS
  const cutoff = shiftConfig.checkInOnTimeCutoff;
  const threshold = shiftConfig.checkInLateThreshold;

  if (time <= cutoff) return 'On Time';
  if (time >= threshold) return 'Late';
  return '';
}

/**
 * Determine break-in status based on time
 */
function determineBreakInStatus(breakInTime: string | null, shiftConfig: ShiftConfig): string {
  if (!breakInTime) return '';

  const cutoff = shiftConfig.breakInOnTimeCutoff;
  const threshold = shiftConfig.breakInLateThreshold;

  if (breakInTime <= cutoff) return 'On Time';
  if (breakInTime >= threshold) return 'Late';
  return '';
}

/**
 * Process attendance data from Excel file
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Security: Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Security: Validate MIME type and file extension
    const allowedMimeTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    const allowedExtensions = ['.xls', '.xlsx'];

    // Check file extension
    const fileName = file.name.toLowerCase();
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));

    // Check MIME type (fallback to empty string if not provided)
    const mimeType = file.type || '';
    const hasValidMimeType = allowedMimeTypes.includes(mimeType);

    if (!hasValidExtension && !hasValidMimeType) {
      return NextResponse.json(
        { error: 'Invalid file type. Only Excel files (.xls, .xlsx) are allowed' },
        { status: 400 }
      );
    }

    // Read file buffer
    const buffer = await file.arrayBuffer();

    // Parse Excel file with ExcelJS (more secure)
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return NextResponse.json({ error: 'No sheets found in Excel file' }, { status: 400 });
    }

    // Convert to JSON
    const rawData: Record<string, unknown>[] = [];
    let headerRow: string[] = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        // First row is header
        headerRow = row.values as string[];
        headerRow.shift(); // Remove first empty element from row.values
      } else {
        const rowData: Record<string, unknown> = {};
        row.eachCell((cell, colNumber) => {
          const header = headerRow[colNumber - 1];
          if (header) {
            rowData[header] = cell.value;
          }
        });
        rawData.push(rowData);
      }
    });

    if (rawData.length === 0) {
      return NextResponse.json({ error: 'No data found in Excel file' }, { status: 400 });
    }

    // Validate required columns
    const requiredColumns = ['ID', 'Name', 'Date', 'Time', 'Status'];
    validateRequiredColumns(rawData, requiredColumns);

    // Load YAML configurations
    let combinedConfig;
    try {
      combinedConfig = loadCombinedConfig();
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Configuration loading failed',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }

    // Parse configuration (if provided)
    const configStr = formData.get('config') as string;
    const config: Partial<RuleConfig> = configStr ? JSON.parse(configStr) : {};

    // Set defaults from rule.yaml or fallback to 2 minutes
    const burstThresholdMinutes = config.burstThresholdMinutes ||
      (combinedConfig.rules.burst_threshold_minutes as number) || 2;
    const statusFilter = config.statusFilter ||
      (combinedConfig.rules.status_filter as string[]) || ['Success'];

    // Create user mapper function
    const mapUser = createUserMapper(combinedConfig.users);

    // Get list of allowed users from users.yaml and rule.yaml
    const allowedUsers = new Set([
      ...Object.keys(combinedConfig.users.operators || {}),
      ...(combinedConfig.rules.operators?.valid_users || [])
    ]);

    console.log('Allowed users:', Array.from(allowedUsers));

    // Parse swipe records
    const swipes: SwipeRecord[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    let filteredByStatus = 0;
    let filteredByUser = 0;

    for (let i = 0; i < rawData.length; i++) {
      try {
        const swipe = parseSwipeRecord(rawData[i]!, i);

        // Filter by status first
        if (!statusFilter.includes(swipe.status)) {
          filteredByStatus++;
          continue;
        }

        // Then filter by allowed users
        if (!allowedUsers.has(swipe.name)) {
          filteredByUser++;
          console.log(`Filtered out unauthorized user: ${swipe.name} (ID: ${swipe.id})`);
          continue;
        }

        // Only add swipe if it passes both filters
        swipes.push(swipe);
      } catch (error) {
        // Log but don't fail on individual row errors
        warnings.push(
          `Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    if (swipes.length === 0) {
      return NextResponse.json(
        {
          error: 'No valid records found after filtering',
          details: {
            totalRows: rawData.length,
            filteredByStatus,
            filteredByUser,
            invalidRows: warnings.length,
            allowedUsers: Array.from(allowedUsers),
            statusFilter,
            warnings: warnings.slice(0, 10), // Show first 10 warnings
          },
        },
        { status: 400 }
      );
    }

    // STEP 1: Process bursts
    const burstDetector = new BurstDetector({ thresholdMinutes: burstThresholdMinutes });
    const bursts = burstDetector.detectBursts(swipes);

    // Load shift configurations from YAML
    const yamlShiftConfigs = convertYamlToShiftConfigs(combinedConfig.rules);
    const shiftConfigs = { ...DEFAULT_SHIFT_CONFIGS, ...yamlShiftConfigs };

    // STEP 2: Detect shift instances
    const shiftDetector = new ShiftDetector({ shifts: shiftConfigs });
    const shiftInstances = shiftDetector.detectShifts(bursts);

    // STEP 3: Detect breaks and generate attendance records
    const breakDetector = new BreakDetector();
    const attendanceRecords: AttendanceRecord[] = [];

    for (const shift of shiftInstances) {
      const shiftConfig = shiftConfigs[shift.shiftCode] || DEFAULT_SHIFT_CONFIGS[shift.shiftCode]!;

      // Detect breaks for this shift
      const breakTimes = breakDetector.detectBreak(shift.bursts, shiftConfig);

      // Extract check-in and check-out times
      const checkInTime = shift.checkIn.toTimeString().substring(0, 8);
      const checkOutTime = shift.checkOut ? shift.checkOut.toTimeString().substring(0, 8) : '';

      // Determine statuses
      const checkInStatus = determineCheckInStatus(checkInTime, shiftConfig);
      const breakInStatus = determineBreakInStatus(breakTimes.breakInTime, shiftConfig);

      // Map user using users.yaml configuration
      const mappedUser = mapUser(shift.userName);

      // Create attendance record
      attendanceRecords.push({
        date: shift.shiftDate,
        id: mappedUser.id,
        name: mappedUser.name,
        shift: shiftConfig.displayName,
        checkIn: checkInTime,
        breakOut: breakTimes.breakOut,
        breakIn: breakTimes.breakIn,
        checkOut: checkOutTime,
        checkInStatus,
        breakInStatus,
      });
    }

    // Create processing result
    const result: ProcessingResult = {
      success: true,
      recordsProcessed: swipes.length,
      burstsDetected: bursts.length,
      shiftInstancesFound: shiftInstances.length,
      attendanceRecordsGenerated: attendanceRecords.length,
      errors: errors.length > 0 ? errors.slice(0, 10) : [],
      warnings: warnings.length > 0 ? warnings.slice(0, 10) : [],
      outputData: attendanceRecords,
    };

    return NextResponse.json({
      success: true,
      result,
      message: `Processed ${swipes.length} swipes → ${bursts.length} bursts → ${shiftInstances.length} shifts → ${attendanceRecords.length} attendance records`,
      debug: {
        totalRows: rawData.length,
        filteredByStatus,
        filteredByUser,
        allowedUsers: Array.from(allowedUsers),
      },
    });
  } catch (error) {
    console.error('Processing error:', error);
    return NextResponse.json(
      {
        error: 'Processing failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
