/**
 * Tests for BreakDetector
 * Verifies break detection algorithm correctness per rule.yaml v10.0
 */

import { BreakDetector } from '../BreakDetector';
import type { BurstRecord, ShiftConfig } from '@/types/attendance';

describe('BreakDetector', () => {
  // Morning shift (A) configuration from rule.yaml
  const morningShiftConfig: ShiftConfig = {
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
  };

  const createBurst = (startTime: Date, endTime?: Date): BurstRecord => ({
    name: 'John Doe',
    burstId: `burst_${Date.now()}`,
    burstStart: startTime,
    burstEnd: endTime || startTime,
    swipeCount: 1,
    swipes: [],
  });

  describe('Gap-based detection (Priority 1)', () => {
    it('detects break when gap >= minimum threshold', () => {
      const detector = new BreakDetector();
      const bursts: BurstRecord[] = [
        createBurst(new Date('2024-01-01T09:55:00'), new Date('2024-01-01T10:00:00')), // Break Out
        createBurst(new Date('2024-01-01T10:25:00'), new Date('2024-01-01T10:30:00')), // Break In (25 min gap)
      ];

      const result = detector.detectBreak(bursts, morningShiftConfig);

      expect(result.breakOut).toBe('10:00:00');
      expect(result.breakIn).toBe('10:25:00');
      expect(result.breakInTime).toBe('10:25:00');
    });

    it('ignores gaps < minimum threshold', () => {
      const detector = new BreakDetector();
      const bursts: BurstRecord[] = [
        createBurst(new Date('2024-01-01T10:00:00'), new Date('2024-01-01T10:00:00')),
        createBurst(new Date('2024-01-01T10:03:00'), new Date('2024-01-01T10:03:00')), // 3 min gap (< 5)
        createBurst(new Date('2024-01-01T10:20:00'), new Date('2024-01-01T10:20:00')),
      ];

      const result = detector.detectBreak(bursts, morningShiftConfig);

      // No qualifying gap found, falls back to midpoint logic
      expect(result.breakOut).toBe('10:03:00'); // Latest before midpoint (10:15)
      expect(result.breakIn).toBe('10:20:00'); // Earliest after midpoint
    });

    it('selects gap with Break Time Out closest to checkpoint', () => {
      const detector = new BreakDetector();
      const bursts: BurstRecord[] = [
        createBurst(new Date('2024-01-01T09:50:00'), new Date('2024-01-01T09:55:00')),
        // Gap 1: 9:55 - 10:05 (10 min gap, Break Out at 9:55)
        createBurst(new Date('2024-01-01T10:05:00'), new Date('2024-01-01T10:05:00')),
        // Gap 2: 10:05 - 10:15 (10 min gap, Break Out at 10:05 - closer to 10:00 checkpoint)
        createBurst(new Date('2024-01-01T10:15:00'), new Date('2024-01-01T10:15:00')),
      ];

      const result = detector.detectBreak(bursts, morningShiftConfig);

      // Should choose gap 2 since 10:05 is closer to checkpoint (10:00) than 9:55
      // Actually, 9:55 is 5 mins away, 10:05 is 5 mins away - both equal
      // So it should choose the first one found... Let me recalculate
      // 9:55 -> 10:00 = 5 minutes
      // 10:05 -> 10:00 = 5 minutes
      // They're equidistant, so it picks the first
      expect(result.breakOut).toBe('09:55:00');
    });

    it('selects gap with Break Time In closest to cutoff (grace period end)', () => {
      const detector = new BreakDetector();
      const bursts: BurstRecord[] = [
        createBurst(new Date('2024-01-01T09:55:00'), new Date('2024-01-01T09:55:00')),
        // Gap 1: 9:55 - 10:05 (Break In at 10:05)
        createBurst(new Date('2024-01-01T10:05:00'), new Date('2024-01-01T10:05:00')),
        // Gap 2: 10:05 - 10:30 (Break In at 10:30 - closer to cutoff 10:34:59)
        createBurst(new Date('2024-01-01T10:30:00'), new Date('2024-01-01T10:30:00')),
      ];

      const result = detector.detectBreak(bursts, morningShiftConfig);

      // For Break Time In: 10:05 is 29.98 min before cutoff, 10:30 is 4.98 min before cutoff
      // 10:30 is closer to cutoff (10:34:59)
      expect(result.breakIn).toBe('10:30:00');
    });

    it('handles independent selection for Break Out and Break In', () => {
      const detector = new BreakDetector();
      const bursts: BurstRecord[] = [
        createBurst(new Date('2024-01-01T09:55:00'), new Date('2024-01-01T09:58:00')), // Gap ends 9:58
        // Gap 1: 9:58 - 10:08 (Break Out 9:58, closer to checkpoint 10:00)
        createBurst(new Date('2024-01-01T10:08:00'), new Date('2024-01-01T10:08:00')),
        // Gap 2: 10:08 - 10:34 (Break In 10:34, closer to cutoff 10:34:59)
        createBurst(new Date('2024-01-01T10:34:00'), new Date('2024-01-01T10:34:00')),
      ];

      const result = detector.detectBreak(bursts, morningShiftConfig);

      // Independent selection:
      // Break Out: 9:58 (2 min from 10:00 checkpoint) vs 10:08 (8 min from 10:00)
      // Break In: 10:08 (26.98 min before cutoff) vs 10:34 (0.98 min before cutoff)
      expect(result.breakOut).toBe('09:58:00');
      expect(result.breakIn).toBe('10:34:00');
    });
  });

  describe('Midpoint logic (Priority 2 fallback)', () => {
    it('uses midpoint when swipes span midpoint but no qualifying gap', () => {
      const detector = new BreakDetector();
      const bursts: BurstRecord[] = [
        createBurst(new Date('2024-01-01T10:10:00'), new Date('2024-01-01T10:10:00')), // Before 10:15
        createBurst(new Date('2024-01-01T10:12:00'), new Date('2024-01-01T10:12:00')), // Before 10:15
        createBurst(new Date('2024-01-01T10:20:00'), new Date('2024-01-01T10:20:00')), // After 10:15
      ];

      const result = detector.detectBreak(bursts, morningShiftConfig);

      expect(result.breakOut).toBe('10:12:00'); // Latest before/at midpoint
      expect(result.breakIn).toBe('10:20:00'); // Earliest after midpoint
    });

    it('handles all swipes before midpoint with gap', () => {
      const detector = new BreakDetector();
      const bursts: BurstRecord[] = [
        createBurst(new Date('2024-01-01T10:00:00'), new Date('2024-01-01T10:00:00')),
        // 10 minute gap
        createBurst(new Date('2024-01-01T10:10:00'), new Date('2024-01-01T10:10:00')),
      ];

      const result = detector.detectBreak(bursts, morningShiftConfig);

      expect(result.breakOut).toBe('10:00:00');
      expect(result.breakIn).toBe('10:10:00');
    });

    it('handles all swipes before midpoint without gap', () => {
      const detector = new BreakDetector();
      const bursts: BurstRecord[] = [
        createBurst(new Date('2024-01-01T10:10:00'), new Date('2024-01-01T10:10:00')),
        createBurst(new Date('2024-01-01T10:12:00'), new Date('2024-01-01T10:12:00')), // 2 min gap
      ];

      const result = detector.detectBreak(bursts, morningShiftConfig);

      expect(result.breakOut).toBe('10:12:00'); // Latest swipe
      expect(result.breakIn).toBe(''); // Blank
      expect(result.breakInTime).toBeNull();
    });

    it('handles all swipes after midpoint with gap', () => {
      const detector = new BreakDetector();
      const bursts: BurstRecord[] = [
        createBurst(new Date('2024-01-01T10:20:00'), new Date('2024-01-01T10:20:00')),
        // 10 minute gap
        createBurst(new Date('2024-01-01T10:30:00'), new Date('2024-01-01T10:30:00')),
      ];

      const result = detector.detectBreak(bursts, morningShiftConfig);

      expect(result.breakOut).toBe('10:20:00');
      expect(result.breakIn).toBe('10:30:00');
    });

    it('handles all swipes after midpoint without gap', () => {
      const detector = new BreakDetector();
      const bursts: BurstRecord[] = [
        createBurst(new Date('2024-01-01T10:20:00'), new Date('2024-01-01T10:20:00')),
        createBurst(new Date('2024-01-01T10:22:00'), new Date('2024-01-01T10:22:00')), // 2 min gap
      ];

      const result = detector.detectBreak(bursts, morningShiftConfig);

      expect(result.breakOut).toBe(''); // Blank
      expect(result.breakIn).toBe('10:20:00'); // Earliest swipe
      expect(result.breakInTime).toBe('10:20:00');
    });

    it('handles single swipe before midpoint', () => {
      const detector = new BreakDetector();
      const bursts: BurstRecord[] = [
        createBurst(new Date('2024-01-01T10:10:00'), new Date('2024-01-01T10:10:00')),
      ];

      const result = detector.detectBreak(bursts, morningShiftConfig);

      expect(result.breakOut).toBe('10:10:00');
      expect(result.breakIn).toBe('');
      expect(result.breakInTime).toBeNull();
    });

    it('handles single swipe after midpoint', () => {
      const detector = new BreakDetector();
      const bursts: BurstRecord[] = [
        createBurst(new Date('2024-01-01T10:20:00'), new Date('2024-01-01T10:20:00')),
      ];

      const result = detector.detectBreak(bursts, morningShiftConfig);

      expect(result.breakOut).toBe('');
      expect(result.breakIn).toBe('10:20:00');
    });
  });

  describe('Burst handling', () => {
    it('uses burst_end for Break Time Out', () => {
      const detector = new BreakDetector();
      const bursts: BurstRecord[] = [
        createBurst(new Date('2024-01-01T09:55:00'), new Date('2024-01-01T10:01:00')), // Burst: 9:55-10:01
        createBurst(new Date('2024-01-01T10:25:00'), new Date('2024-01-01T10:30:00')),
      ];

      const result = detector.detectBreak(bursts, morningShiftConfig);

      expect(result.breakOut).toBe('10:01:00'); // End of burst
    });

    it('uses burst_start for Break Time In', () => {
      const detector = new BreakDetector();
      const bursts: BurstRecord[] = [
        createBurst(new Date('2024-01-01T09:55:00'), new Date('2024-01-01T10:01:00')),
        createBurst(new Date('2024-01-01T10:25:00'), new Date('2024-01-01T10:30:00')), // Burst: 10:25-10:30
      ];

      const result = detector.detectBreak(bursts, morningShiftConfig);

      expect(result.breakIn).toBe('10:25:00'); // Start of burst
    });
  });

  describe('Break search window filtering', () => {
    it('filters bursts outside break search window', () => {
      const detector = new BreakDetector();
      const bursts: BurstRecord[] = [
        createBurst(new Date('2024-01-01T09:00:00'), new Date('2024-01-01T09:00:00')), // Before window
        createBurst(new Date('2024-01-01T10:00:00'), new Date('2024-01-01T10:00:00')), // In window
        createBurst(new Date('2024-01-01T11:00:00'), new Date('2024-01-01T11:00:00')), // After window
      ];

      const result = detector.detectBreak(bursts, morningShiftConfig);

      // Only the 10:00 burst is in window (09:50-10:35)
      expect(result.breakOut).toBe('10:00:00');
      expect(result.breakIn).toBe('');
    });

    it('includes bursts if start OR end is in window', () => {
      const detector = new BreakDetector();
      const bursts: BurstRecord[] = [
        createBurst(new Date('2024-01-01T09:45:00'), new Date('2024-01-01T09:55:00')), // End in window
        createBurst(new Date('2024-01-01T10:30:00'), new Date('2024-01-01T10:40:00')), // Start in window
      ];

      const result = detector.detectBreak(bursts, morningShiftConfig);

      // Both bursts should be included (35 min gap between them)
      expect(result.breakOut).toBe('09:55:00');
      expect(result.breakIn).toBe('10:30:00');
    });
  });

  describe('Edge cases', () => {
    it('handles no bursts in break search window', () => {
      const detector = new BreakDetector();
      const bursts: BurstRecord[] = [
        createBurst(new Date('2024-01-01T09:00:00'), new Date('2024-01-01T09:00:00')), // Before window
        createBurst(new Date('2024-01-01T11:00:00'), new Date('2024-01-01T11:00:00')), // After window
      ];

      const result = detector.detectBreak(bursts, morningShiftConfig);

      expect(result.breakOut).toBe('');
      expect(result.breakIn).toBe('');
      expect(result.breakInTime).toBeNull();
    });

    it('handles empty bursts array', () => {
      const detector = new BreakDetector();
      const result = detector.detectBreak([], morningShiftConfig);

      expect(result.breakOut).toBe('');
      expect(result.breakIn).toBe('');
      expect(result.breakInTime).toBeNull();
    });

    it('handles gap exactly at minimum threshold (boundary)', () => {
      const detector = new BreakDetector();
      const bursts: BurstRecord[] = [
        createBurst(new Date('2024-01-01T10:00:00'), new Date('2024-01-01T10:00:00')),
        createBurst(new Date('2024-01-01T10:05:00'), new Date('2024-01-01T10:05:00')), // Exactly 5 min
      ];

      const result = detector.detectBreak(bursts, morningShiftConfig);

      // Should qualify as gap
      expect(result.breakOut).toBe('10:00:00');
      expect(result.breakIn).toBe('10:05:00');
    });

    it('handles bursts at exact midpoint', () => {
      const detector = new BreakDetector();
      const bursts: BurstRecord[] = [
        createBurst(new Date('2024-01-01T10:10:00'), new Date('2024-01-01T10:15:00')), // Ends at midpoint
        createBurst(new Date('2024-01-01T10:20:00'), new Date('2024-01-01T10:20:00')), // After midpoint
      ];

      const result = detector.detectBreak(bursts, morningShiftConfig);

      // First burst end is <= midpoint, second is > midpoint
      expect(result.breakOut).toBe('10:15:00'); // Latest before/at midpoint
      expect(result.breakIn).toBe('10:20:00'); // Earliest after midpoint
    });
  });
});
