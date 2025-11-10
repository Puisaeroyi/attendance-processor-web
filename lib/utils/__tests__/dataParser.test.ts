/**
 * Tests for data parsing utilities
 */

import {
  parseDateTime,
  formatDate,
  formatTime,
  sanitizeCellValue,
  validateRequiredColumns,
  parseSwipeRecord,
  isTimeInRange,
} from '../dataParser';

describe('dataParser', () => {
  describe('parseDateTime', () => {
    it('parses DD/MM/YYYY HH:MM:SS format', () => {
      const result = parseDateTime('15/03/2024', '14:30:45');
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(2); // March (0-indexed)
      expect(result.getDate()).toBe(15);
      expect(result.getHours()).toBe(14);
      expect(result.getMinutes()).toBe(30);
      expect(result.getSeconds()).toBe(45);
    });

    it('parses DD/MM/YYYY HH:MM format (no seconds)', () => {
      const result = parseDateTime('15/03/2024', '14:30');
      expect(result.getHours()).toBe(14);
      expect(result.getMinutes()).toBe(30);
      expect(result.getSeconds()).toBe(0);
    });

    it('handles single-digit day and month', () => {
      const result = parseDateTime('5/3/2024', '9:05:03');
      expect(result.getDate()).toBe(5);
      expect(result.getMonth()).toBe(2);
      expect(result.getHours()).toBe(9);
      expect(result.getMinutes()).toBe(5);
    });

    it('throws error for invalid date format', () => {
      expect(() => parseDateTime('invalid', 'time')).toThrow();
    });
  });

  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2024-03-15T14:30:45');
      expect(formatDate(date)).toBe('15/03/2024');
    });

    it('respects custom format', () => {
      const date = new Date('2024-03-15T14:30:45');
      expect(formatDate(date, 'yyyy-MM-dd')).toBe('2024-03-15');
    });
  });

  describe('formatTime', () => {
    it('formats time with seconds', () => {
      const date = new Date('2024-03-15T14:30:45');
      expect(formatTime(date)).toBe('14:30:45');
    });

    it('formats time without seconds', () => {
      const date = new Date('2024-03-15T14:30:45');
      expect(formatTime(date, 'HH:mm')).toBe('14:30');
    });
  });

  describe('sanitizeCellValue', () => {
    it('trims whitespace', () => {
      expect(sanitizeCellValue('  hello  ')).toBe('hello');
    });

    it('handles null/undefined', () => {
      expect(sanitizeCellValue(null)).toBe('');
      expect(sanitizeCellValue(undefined)).toBe('');
      expect(sanitizeCellValue('')).toBe('');
    });

    it('converts numbers to strings', () => {
      expect(sanitizeCellValue(123)).toBe('123');
      expect(sanitizeCellValue(45.67)).toBe('45.67');
    });
  });

  describe('validateRequiredColumns', () => {
    it('passes when all required columns exist', () => {
      const data = [{ ID: '001', Name: 'John', Date: '01/01/2024' }];
      expect(() => validateRequiredColumns(data, ['ID', 'Name', 'Date'])).not.toThrow();
    });

    it('throws when missing columns', () => {
      const data = [{ ID: '001', Name: 'John' }];
      expect(() => validateRequiredColumns(data, ['ID', 'Name', 'Date'])).toThrow(
        'Missing required columns: Date'
      );
    });

    it('throws when data is empty', () => {
      expect(() => validateRequiredColumns([], ['ID'])).toThrow('No data rows found');
    });
  });

  describe('parseSwipeRecord', () => {
    it('parses valid row correctly', () => {
      const row = {
        ID: '001',
        Name: 'John Doe',
        Date: '15/03/2024',
        Time: '14:30:45',
        Status: 'C/In',
      };

      const result = parseSwipeRecord(row, 0);

      expect(result.id).toBe('001');
      expect(result.name).toBe('John Doe');
      expect(result.time).toBe('14:30:45');
      expect(result.status).toBe('C/In');
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('handles lowercase column names', () => {
      const row = {
        id: '001',
        name: 'John Doe',
        date: '15/03/2024',
        time: '14:30:45',
        status: 'C/In',
      };

      const result = parseSwipeRecord(row, 0);
      expect(result.id).toBe('001');
      expect(result.name).toBe('John Doe');
    });

    it('throws error for missing required fields', () => {
      const row = {
        ID: '001',
        Name: 'John Doe',
        // Missing Date, Time, Status
      };

      expect(() => parseSwipeRecord(row, 0)).toThrow('missing required fields');
    });

    it('sanitizes cell values', () => {
      const row = {
        ID: '  001  ',
        Name: '  John Doe  ',
        Date: '15/03/2024',
        Time: '14:30:45',
        Status: 'C/In',
      };

      const result = parseSwipeRecord(row, 0);
      expect(result.id).toBe('001');
      expect(result.name).toBe('John Doe');
    });
  });

  describe('isTimeInRange', () => {
    it('checks if time is in range', () => {
      expect(isTimeInRange('09:30', { start: '09:00', end: '17:00' })).toBe(true);
      expect(isTimeInRange('08:00', { start: '09:00', end: '17:00' })).toBe(false);
      expect(isTimeInRange('18:00', { start: '09:00', end: '17:00' })).toBe(false);
    });

    it('handles boundary values', () => {
      expect(isTimeInRange('09:00', { start: '09:00', end: '17:00' })).toBe(true);
      expect(isTimeInRange('17:00', { start: '09:00', end: '17:00' })).toBe(true);
    });

    it('handles midnight crossing when enabled', () => {
      // 22:00 - 06:00 range (crosses midnight)
      expect(isTimeInRange('23:00', { start: '22:00', end: '06:00' }, true)).toBe(true);
      expect(isTimeInRange('02:00', { start: '22:00', end: '06:00' }, true)).toBe(true);
      expect(isTimeInRange('12:00', { start: '22:00', end: '06:00' }, true)).toBe(false);
    });

    it('handles time with seconds by using HH:MM part', () => {
      expect(isTimeInRange('09:30:45', { start: '09:00', end: '17:00' })).toBe(true);
    });
  });
});
