/**
 * Tests for BurstDetector
 * Verifies burst detection algorithm correctness
 */

import { BurstDetector } from '../BurstDetector';
import type { SwipeRecord } from '@/types/attendance';

describe('BurstDetector', () => {
  const createSwipe = (
    name: string,
    timestamp: Date,
    id = '001',
    status = 'C/In'
  ): SwipeRecord => ({
    id,
    name,
    date: timestamp,
    time: timestamp.toTimeString().substring(0, 8),
    timestamp,
    status,
  });

  describe('detectBursts', () => {
    it('detects single burst for consecutive swipes within threshold', () => {
      const detector = new BurstDetector({ thresholdMinutes: 3 });
      const swipes: SwipeRecord[] = [
        createSwipe('John Doe', new Date('2024-01-01T08:00:00')),
        createSwipe('John Doe', new Date('2024-01-01T08:01:00')),
        createSwipe('John Doe', new Date('2024-01-01T08:02:00')),
      ];

      const bursts = detector.detectBursts(swipes);

      expect(bursts).toHaveLength(1);
      expect(bursts[0]!.name).toBe('John Doe');
      expect(bursts[0]!.swipeCount).toBe(3);
      expect(bursts[0]!.burstStart).toEqual(new Date('2024-01-01T08:00:00'));
      expect(bursts[0]!.burstEnd).toEqual(new Date('2024-01-01T08:02:00'));
    });

    it('splits bursts when threshold is exceeded', () => {
      const detector = new BurstDetector({ thresholdMinutes: 3 });
      const swipes: SwipeRecord[] = [
        createSwipe('John Doe', new Date('2024-01-01T08:00:00')),
        createSwipe('John Doe', new Date('2024-01-01T08:01:00')),
        // Gap of 10 minutes - exceeds threshold
        createSwipe('John Doe', new Date('2024-01-01T08:11:00')),
        createSwipe('John Doe', new Date('2024-01-01T08:12:00')),
      ];

      const bursts = detector.detectBursts(swipes);

      expect(bursts).toHaveLength(2);
      expect(bursts[0]!.swipeCount).toBe(2);
      expect(bursts[1]!.swipeCount).toBe(2);
    });

    it('handles multiple users independently', () => {
      const detector = new BurstDetector({ thresholdMinutes: 3 });
      const swipes: SwipeRecord[] = [
        createSwipe('John Doe', new Date('2024-01-01T08:00:00')),
        createSwipe('Jane Smith', new Date('2024-01-01T08:00:30')),
        createSwipe('John Doe', new Date('2024-01-01T08:01:00')),
        createSwipe('Jane Smith', new Date('2024-01-01T08:01:30')),
      ];

      const bursts = detector.detectBursts(swipes);

      expect(bursts).toHaveLength(2);

      const johnBurst = bursts.find((b) => b.name === 'John Doe');
      const janeBurst = bursts.find((b) => b.name === 'Jane Smith');

      expect(johnBurst).toBeDefined();
      expect(janeBurst).toBeDefined();
      expect(johnBurst!.swipeCount).toBe(2);
      expect(janeBurst!.swipeCount).toBe(2);
    });

    it('handles single swipe as single burst', () => {
      const detector = new BurstDetector({ thresholdMinutes: 3 });
      const swipes: SwipeRecord[] = [createSwipe('John Doe', new Date('2024-01-01T08:00:00'))];

      const bursts = detector.detectBursts(swipes);

      expect(bursts).toHaveLength(1);
      expect(bursts[0]!.swipeCount).toBe(1);
    });

    it('handles empty input', () => {
      const detector = new BurstDetector({ thresholdMinutes: 3 });
      const bursts = detector.detectBursts([]);

      expect(bursts).toHaveLength(0);
    });

    it('respects different threshold values', () => {
      // With 1-minute threshold
      const detector1min = new BurstDetector({ thresholdMinutes: 1 });
      const swipes: SwipeRecord[] = [
        createSwipe('John Doe', new Date('2024-01-01T08:00:00')),
        createSwipe('John Doe', new Date('2024-01-01T08:00:30')),
        createSwipe('John Doe', new Date('2024-01-01T08:02:00')), // 1.5 min gap
      ];

      const bursts1min = detector1min.detectBursts(swipes);
      expect(bursts1min).toHaveLength(2);
      expect(bursts1min[0]!.swipeCount).toBe(2);
      expect(bursts1min[1]!.swipeCount).toBe(1);

      // With 5-minute threshold
      const detector5min = new BurstDetector({ thresholdMinutes: 5 });
      const bursts5min = detector5min.detectBursts(swipes);
      expect(bursts5min).toHaveLength(1);
      expect(bursts5min[0]!.swipeCount).toBe(3);
    });

    it('correctly assigns burst IDs', () => {
      const detector = new BurstDetector({ thresholdMinutes: 3 });
      const swipes: SwipeRecord[] = [
        createSwipe('John Doe', new Date('2024-01-01T08:00:00')),
        createSwipe('John Doe', new Date('2024-01-01T08:10:00')), // New burst
        createSwipe('John Doe', new Date('2024-01-01T08:20:00')), // Another burst
      ];

      const bursts = detector.detectBursts(swipes);

      expect(bursts).toHaveLength(3);
      expect(bursts[0]!.burstId).toBe('John Doe_burst_0');
      expect(bursts[1]!.burstId).toBe('John Doe_burst_1');
      expect(bursts[2]!.burstId).toBe('John Doe_burst_2');
    });

    it('includes all swipes in burst record', () => {
      const detector = new BurstDetector({ thresholdMinutes: 3 });
      const swipes: SwipeRecord[] = [
        createSwipe('John Doe', new Date('2024-01-01T08:00:00')),
        createSwipe('John Doe', new Date('2024-01-01T08:01:00')),
      ];

      const bursts = detector.detectBursts(swipes);

      expect(bursts[0]!.swipes).toHaveLength(2);
      expect(bursts[0]!.swipes).toEqual(swipes);
    });
  });

  describe('getBurstStatistics', () => {
    it('calculates correct statistics', () => {
      const detector = new BurstDetector({ thresholdMinutes: 3 });
      const swipes: SwipeRecord[] = [
        createSwipe('John Doe', new Date('2024-01-01T08:00:00')),
        createSwipe('John Doe', new Date('2024-01-01T08:01:00')),
        createSwipe('Jane Smith', new Date('2024-01-01T08:00:00')),
      ];

      const bursts = detector.detectBursts(swipes);
      const stats = detector.getBurstStatistics(bursts);

      expect(stats.totalBursts).toBe(2);
      expect(stats.totalSwipes).toBe(3);
      expect(stats.userCount).toBe(2);
      expect(stats.averageSwipesPerBurst).toBe(1.5);
    });

    it('handles empty bursts array', () => {
      const detector = new BurstDetector({ thresholdMinutes: 3 });
      const stats = detector.getBurstStatistics([]);

      expect(stats.totalBursts).toBe(0);
      expect(stats.totalSwipes).toBe(0);
      expect(stats.userCount).toBe(0);
      expect(stats.averageSwipesPerBurst).toBe(0);
    });
  });

  describe('Edge cases', () => {
    it('handles swipes at exact threshold boundary', () => {
      const detector = new BurstDetector({ thresholdMinutes: 3 });
      const swipes: SwipeRecord[] = [
        createSwipe('John Doe', new Date('2024-01-01T08:00:00')),
        createSwipe('John Doe', new Date('2024-01-01T08:03:00')), // Exactly 3 minutes
      ];

      const bursts = detector.detectBursts(swipes);

      // At threshold, should be same burst
      expect(bursts).toHaveLength(1);
      expect(bursts[0]!.swipeCount).toBe(2);
    });

    it('handles unsorted input correctly', () => {
      const detector = new BurstDetector({ thresholdMinutes: 3 });
      const swipes: SwipeRecord[] = [
        createSwipe('John Doe', new Date('2024-01-01T08:02:00')),
        createSwipe('John Doe', new Date('2024-01-01T08:00:00')),
        createSwipe('John Doe', new Date('2024-01-01T08:01:00')),
      ];

      const bursts = detector.detectBursts(swipes);

      expect(bursts).toHaveLength(1);
      expect(bursts[0]!.swipeCount).toBe(3);
      // Should still have correct start/end times
      expect(bursts[0]!.burstStart).toEqual(new Date('2024-01-01T08:00:00'));
      expect(bursts[0]!.burstEnd).toEqual(new Date('2024-01-01T08:02:00'));
    });
  });
});
