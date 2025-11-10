/**
 * Data parsing utilities
 * Ported from Python utils.py and performance.py
 */

import type { SwipeRecord } from '@/types/attendance';
import { parse, format } from 'date-fns';

/**
 * Parse date and time into a timestamp
 * Optimized for common formats
 */
export function parseDateTime(dateStr: string, timeStr: string): Date {
  try {
    // Try parsing with multiple separators: / - .
    let dateParts: string[] = [];

    if (dateStr.includes('/')) {
      dateParts = dateStr.split('/');
    } else if (dateStr.includes('-')) {
      dateParts = dateStr.split('-');
    } else if (dateStr.includes('.')) {
      dateParts = dateStr.split('.');
    }

    const timeParts = timeStr.split(':');

    if (dateParts.length === 3 && timeParts.length >= 2) {
      const hour = parseInt(timeParts[0]!, 10);
      const minute = parseInt(timeParts[1]!, 10);
      const second = timeParts[2] ? parseInt(timeParts[2], 10) : 0;

      let day: number, month: number, year: number;

      // Determine format based on first part value
      const firstPart = parseInt(dateParts[0]!, 10);
      const secondPart = parseInt(dateParts[1]!, 10);
      const thirdPart = parseInt(dateParts[2]!, 10);

      if (firstPart > 31) {
        // Format: YYYY.MM.DD or YYYY-MM-DD
        year = firstPart;
        month = secondPart - 1; // JS months are 0-indexed
        day = thirdPart;
      } else if (thirdPart > 31) {
        // Format: DD/MM/YYYY or DD-MM-YYYY
        day = firstPart;
        month = secondPart - 1;
        year = thirdPart;
      } else {
        // Ambiguous - default to DD/MM/YYYY
        day = firstPart;
        month = secondPart - 1;
        year = thirdPart;
      }

      const date = new Date(year, month, day, hour, minute, second);

      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    // Fallback: try date-fns parsing with common formats
    const formats = [
      'dd/MM/yyyy HH:mm:ss',
      'dd/MM/yyyy HH:mm',
      'dd-MM-yyyy HH:mm:ss',
      'dd-MM-yyyy HH:mm',
      'yyyy-MM-dd HH:mm:ss',
      'yyyy-MM-dd HH:mm',
      'yyyy.MM.dd HH:mm:ss',
      'yyyy.MM.dd HH:mm',
    ];

    const dateTimeStr = `${dateStr} ${timeStr}`;
    for (const fmt of formats) {
      try {
        const parsed = parse(dateTimeStr, fmt, new Date());
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      } catch {
        continue;
      }
    }

    throw new Error(`Unable to parse date/time: ${dateStr} ${timeStr}`);
  } catch (error) {
    throw new Error(`Date parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Format date for output
 */
export function formatDate(date: Date, formatStr = 'dd/MM/yyyy'): string {
  return format(date, formatStr);
}

/**
 * Format time for output
 */
export function formatTime(date: Date, formatStr = 'HH:mm:ss'): string {
  return format(date, formatStr);
}

/**
 * Sanitize cell value (remove extra whitespace, handle nulls)
 */
export function sanitizeCellValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  return String(value).trim();
}

/**
 * Validate required columns in data
 */
export function validateRequiredColumns(
  data: Record<string, unknown>[],
  requiredColumns: string[]
): void {
  if (data.length === 0) {
    throw new Error('No data rows found');
  }

  const firstRow = data[0]!;
  const availableColumns = Object.keys(firstRow);
  const missing = requiredColumns.filter((col) => !availableColumns.includes(col));

  if (missing.length > 0) {
    throw new Error(`Missing required columns: ${missing.join(', ')}`);
  }
}

/**
 * Parse raw Excel row into SwipeRecord
 */
export function parseSwipeRecord(row: Record<string, unknown>, index: number): SwipeRecord {
  const id = sanitizeCellValue(row.ID || row.id);
  const name = sanitizeCellValue(row.Name || row.name);
  const dateStr = sanitizeCellValue(row.Date || row.date);
  const timeStr = sanitizeCellValue(row.Time || row.time);
  const status = sanitizeCellValue(row.Status || row.status);

  if (!id || !name || !dateStr || !timeStr || !status) {
    throw new Error(`Invalid row at index ${index}: missing required fields`);
  }

  const timestamp = parseDateTime(dateStr, timeStr);

  return {
    id,
    name,
    date: timestamp,
    time: timeStr,
    timestamp,
    status,
  };
}

/**
 * Compare times (HH:MM or HH:MM:SS format)
 */
export function isTimeInRange(
  time: string,
  range: { start: string; end: string },
  allowCrossMidnight = false
): boolean {
  const timeNormalized = time.substring(0, 5); // Get HH:MM part
  const start = range.start.substring(0, 5);
  const end = range.end.substring(0, 5);

  if (!allowCrossMidnight) {
    return timeNormalized >= start && timeNormalized <= end;
  }

  // Handle midnight crossing (e.g., 22:00 - 06:00)
  if (start > end) {
    return timeNormalized >= start || timeNormalized <= end;
  }

  return timeNormalized >= start && timeNormalized <= end;
}
