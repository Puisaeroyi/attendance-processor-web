/**
 * Tests for ShiftDetector
 * Verifies shift detection algorithm correctness
 */

import { ShiftDetector } from '../ShiftDetector';
import type { BurstRecord, ShiftConfig, ShiftDetectionConfig } from '@/types/attendance';

describe('ShiftDetector', () => {
  // Test shift configurations based on rule.yaml v10.0
  const shiftConfigs: Record<string, ShiftConfig> = {
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

  const config: ShiftDetectionConfig = {
    shifts: shiftConfigs,
  };

  const createBurst = (
    name: string,
    startTime: Date,
    endTime?: Date,
    swipeCount = 1
  ): BurstRecord => ({
    name,
    burstId: `${name}_burst_${Date.now()}`,
    burstStart: startTime,
    burstEnd: endTime || startTime,
    swipeCount,
    swipes: [],
  });

  describe('detectShifts', () => {
    it('detects single morning shift (A) from bursts', () => {
      const detector = new ShiftDetector(config);
      const bursts: BurstRecord[] = [
        createBurst('John Doe', new Date('2024-01-01T06:00:00')), // Check-in
        createBurst('John Doe', new Date('2024-01-01T10:00:00')), // Mid-shift
        createBurst('John Doe', new Date('2024-01-01T14:00:00')), // Check-out
      ];

      const shifts = detector.detectShifts(bursts);

      expect(shifts).toHaveLength(1);
      expect(shifts[0]!.shiftCode).toBe('A');
      expect(shifts[0]!.userName).toBe('John Doe');
      expect(shifts[0]!.bursts).toHaveLength(3);
      expect(shifts[0]!.checkIn).toEqual(new Date('2024-01-01T06:00:00'));
      expect(shifts[0]!.checkOut).toEqual(new Date('2024-01-01T14:00:00'));
    });

    it('detects afternoon shift (B) from bursts', () => {
      const detector = new ShiftDetector(config);
      const bursts: BurstRecord[] = [
        createBurst('Jane Smith', new Date('2024-01-01T14:00:00')), // Check-in
        createBurst('Jane Smith', new Date('2024-01-01T18:00:00')), // Break
        createBurst('Jane Smith', new Date('2024-01-01T22:00:00')), // Check-out
      ];

      const shifts = detector.detectShifts(bursts);

      expect(shifts).toHaveLength(1);
      expect(shifts[0]!.shiftCode).toBe('B');
      expect(shifts[0]!.userName).toBe('Jane Smith');
    });

    it('detects night shift (C) crossing midnight', () => {
      const detector = new ShiftDetector(config);
      const bursts: BurstRecord[] = [
        createBurst('Night Worker', new Date('2024-01-01T22:00:00')), // Check-in
        createBurst('Night Worker', new Date('2024-01-02T02:00:00')), // Break (next day)
        createBurst('Night Worker', new Date('2024-01-02T06:00:00')), // Check-out (next day)
      ];

      const shifts = detector.detectShifts(bursts);

      expect(shifts).toHaveLength(1);
      expect(shifts[0]!.shiftCode).toBe('C');
      expect(shifts[0]!.userName).toBe('Night Worker');
      expect(shifts[0]!.shiftDate.toISOString()).toBe(new Date(2024, 0, 1, 0, 0, 0, 0).toISOString());
      expect(shifts[0]!.bursts).toHaveLength(3);
      expect(shifts[0]!.checkOut).toEqual(new Date('2024-01-02T06:00:00'));
    });

    it('handles multiple shifts for same user on different days', () => {
      const detector = new ShiftDetector(config);
      const bursts: BurstRecord[] = [
        // Day 1 - Morning shift
        createBurst('John Doe', new Date('2024-01-01T06:00:00')),
        createBurst('John Doe', new Date('2024-01-01T14:00:00')),
        // Day 2 - Morning shift
        createBurst('John Doe', new Date('2024-01-02T06:00:00')),
        createBurst('John Doe', new Date('2024-01-02T14:00:00')),
      ];

      const shifts = detector.detectShifts(bursts);

      expect(shifts).toHaveLength(2);
      expect(shifts[0]!.shiftCode).toBe('A');
      expect(shifts[0]!.shiftDate.toISOString()).toBe(new Date(2024, 0, 1, 0, 0, 0, 0).toISOString());
      expect(shifts[1]!.shiftCode).toBe('A');
      expect(shifts[1]!.shiftDate.toISOString()).toBe(new Date(2024, 0, 2, 0, 0, 0, 0).toISOString());
    });

    it('handles multiple users independently', () => {
      const detector = new ShiftDetector(config);
      const bursts: BurstRecord[] = [
        createBurst('John Doe', new Date('2024-01-01T06:00:00')),
        createBurst('Jane Smith', new Date('2024-01-01T14:00:00')),
        createBurst('John Doe', new Date('2024-01-01T14:00:00')),
        createBurst('Jane Smith', new Date('2024-01-01T22:00:00')),
      ];

      const shifts = detector.detectShifts(bursts);

      expect(shifts).toHaveLength(2);

      const johnShift = shifts.find((s) => s.userName === 'John Doe');
      const janeShift = shifts.find((s) => s.userName === 'Jane Smith');

      expect(johnShift).toBeDefined();
      expect(janeShift).toBeDefined();
      expect(johnShift!.shiftCode).toBe('A');
      expect(janeShift!.shiftCode).toBe('B');
    });

    it('filters orphan bursts (no shift assignment)', () => {
      const detector = new ShiftDetector(config);
      const bursts: BurstRecord[] = [
        createBurst('John Doe', new Date('2024-01-01T03:00:00')), // Orphan (not in any check-in range)
        createBurst('John Doe', new Date('2024-01-01T06:00:00')), // Valid check-in
        createBurst('John Doe', new Date('2024-01-01T14:00:00')),
      ];

      const shifts = detector.detectShifts(bursts);

      expect(shifts).toHaveLength(1);
      expect(shifts[0]!.bursts).toHaveLength(2); // Orphan excluded
    });

    it('handles empty bursts array', () => {
      const detector = new ShiftDetector(config);
      const shifts = detector.detectShifts([]);

      expect(shifts).toHaveLength(0);
    });

    it('stops assigning bursts when different shift type starts (outside checkout)', () => {
      const detector = new ShiftDetector(config);
      const bursts: BurstRecord[] = [
        createBurst('John Doe', new Date('2024-01-01T06:00:00')), // Morning shift
        createBurst('John Doe', new Date('2024-01-01T10:00:00')), // Part of morning
        // 14:50 is OUTSIDE morning checkout (13:30-14:35) but IN afternoon checkin (13:30-14:35)
        // Wait, actually 14:50 is outside both. Let me use 15:00 which is clearly afternoon
        createBurst('John Doe', new Date('2024-01-01T15:00:00')), // Outside morning window, orphan
        createBurst('John Doe', new Date('2024-01-01T18:00:00')), // Orphan
      ];

      const shifts = detector.detectShifts(bursts);

      // Since 15:00 is outside morning activity window (ends 14:35) AND not in afternoon check-in range,
      // it becomes an orphan. Same with 18:00.
      expect(shifts).toHaveLength(1);
      expect(shifts[0]!.shiftCode).toBe('A');
      expect(shifts[0]!.bursts).toHaveLength(2);
    });

    it('assigns bursts in checkout range even if they overlap with next shift check-in', () => {
      const detector = new ShiftDetector(config);
      const bursts: BurstRecord[] = [
        createBurst('John Doe', new Date('2024-01-01T06:00:00')), // Morning check-in
        // 13:30-14:35 is both morning checkout and afternoon check-in range
        createBurst('John Doe', new Date('2024-01-01T13:45:00')), // In checkout range of A
        createBurst('John Doe', new Date('2024-01-01T14:00:00')), // Also in checkout of A
      ];

      const shifts = detector.detectShifts(bursts);

      // All bursts assigned to morning shift since they're all in checkout range
      // Afternoon shift would only start if there was a burst OUTSIDE morning's activity window
      // but IN afternoon's check-in range
      expect(shifts).toHaveLength(1);
      expect(shifts[0]!.shiftCode).toBe('A');
      expect(shifts[0]!.bursts).toHaveLength(3);
    });

    it('handles night shift activity window correctly', () => {
      const detector = new ShiftDetector(config);
      const bursts: BurstRecord[] = [
        createBurst('Night Worker', new Date('2024-01-01T22:00:00')), // Check-in
        createBurst('Night Worker', new Date('2024-01-01T23:00:00')), // Late evening
        createBurst('Night Worker', new Date('2024-01-02T01:00:00')), // After midnight
        createBurst('Night Worker', new Date('2024-01-02T02:00:00')), // Break time
        createBurst('Night Worker', new Date('2024-01-02T05:00:00')), // Early morning
        createBurst('Night Worker', new Date('2024-01-02T06:00:00')), // Check-out
        createBurst('Night Worker', new Date('2024-01-02T06:40:00')), // After window - orphan
      ];

      const shifts = detector.detectShifts(bursts);

      expect(shifts).toHaveLength(1);
      expect(shifts[0]!.shiftCode).toBe('C');
      expect(shifts[0]!.bursts).toHaveLength(6); // Last burst excluded (after 06:35)
    });

    it('correctly assigns bursts sorted chronologically', () => {
      const detector = new ShiftDetector(config);
      const bursts: BurstRecord[] = [
        createBurst('John Doe', new Date('2024-01-01T14:00:00')), // Out of order
        createBurst('John Doe', new Date('2024-01-01T06:00:00')), // Actual first
        createBurst('John Doe', new Date('2024-01-01T10:00:00')),
      ];

      const shifts = detector.detectShifts(bursts);

      // Algorithm should sort bursts first
      // All three belong to morning shift (06:00 check-in, 10:00 mid-shift, 14:00 checkout)
      expect(shifts).toHaveLength(1);
      expect(shifts[0]!.shiftCode).toBe('A');
      expect(shifts[0]!.bursts).toHaveLength(3);
      // Verify correct chronological order
      expect(shifts[0]!.bursts[0]!.burstStart).toEqual(new Date('2024-01-01T06:00:00'));
      expect(shifts[0]!.bursts[1]!.burstStart).toEqual(new Date('2024-01-01T10:00:00'));
      expect(shifts[0]!.bursts[2]!.burstStart).toEqual(new Date('2024-01-01T14:00:00'));
    });
  });

  describe('getShiftStatistics', () => {
    it('calculates correct statistics', () => {
      const detector = new ShiftDetector(config);
      const bursts: BurstRecord[] = [
        createBurst('John Doe', new Date('2024-01-01T06:00:00')),
        createBurst('John Doe', new Date('2024-01-01T10:00:00')),
        createBurst('John Doe', new Date('2024-01-01T14:00:00')),
        createBurst('Jane Smith', new Date('2024-01-01T14:00:00')),
        createBurst('Jane Smith', new Date('2024-01-01T22:00:00')),
      ];

      const shifts = detector.detectShifts(bursts);
      const stats = detector.getShiftStatistics(shifts);

      expect(stats.totalShifts).toBe(2);
      expect(stats.userCount).toBe(2);
      expect(stats.shiftsByType['A']).toBe(1);
      expect(stats.shiftsByType['B']).toBe(1);
    });

    it('handles empty shifts array', () => {
      const detector = new ShiftDetector(config);
      const stats = detector.getShiftStatistics([]);

      expect(stats.totalShifts).toBe(0);
      expect(stats.userCount).toBe(0);
      expect(stats.averageBurstsPerShift).toBe(0);
    });
  });

  describe('Edge cases', () => {
    it('handles burst exactly at check-in start boundary', () => {
      const detector = new ShiftDetector(config);
      const bursts: BurstRecord[] = [
        createBurst('John Doe', new Date('2024-01-01T05:30:00')), // Exactly at start
        createBurst('John Doe', new Date('2024-01-01T14:00:00')),
      ];

      const shifts = detector.detectShifts(bursts);

      expect(shifts).toHaveLength(1);
      expect(shifts[0]!.shiftCode).toBe('A');
    });

    it('handles burst exactly at check-in end boundary', () => {
      const detector = new ShiftDetector(config);
      const bursts: BurstRecord[] = [
        createBurst('John Doe', new Date('2024-01-01T06:35:00')), // Exactly at end
        createBurst('John Doe', new Date('2024-01-01T14:00:00')),
      ];

      const shifts = detector.detectShifts(bursts);

      expect(shifts).toHaveLength(1);
      expect(shifts[0]!.shiftCode).toBe('A');
    });

    it('handles single burst within shift', () => {
      const detector = new ShiftDetector(config);
      const bursts: BurstRecord[] = [createBurst('John Doe', new Date('2024-01-01T06:00:00'))];

      const shifts = detector.detectShifts(bursts);

      expect(shifts).toHaveLength(1);
      expect(shifts[0]!.bursts).toHaveLength(1);
    });

    it('handles midnight-crossing time range correctly', () => {
      const detector = new ShiftDetector(config);
      // Night shift check-in range: 21:30-22:35
      const bursts: BurstRecord[] = [
        createBurst('Night Worker', new Date('2024-01-01T21:30:00')),
        createBurst('Night Worker', new Date('2024-01-02T06:00:00')),
      ];

      const shifts = detector.detectShifts(bursts);

      expect(shifts).toHaveLength(1);
      expect(shifts[0]!.shiftCode).toBe('C');
    });
  });
});
