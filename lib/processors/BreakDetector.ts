/**
 * Break Detection Algorithm
 * Ported from Python processor.py _detect_breaks method
 *
 * Two-tier detection algorithm per rule.yaml v10.0:
 * PRIORITY 1 - Gap Detection: Find actual breaks via time gaps >= minimum threshold
 * PRIORITY 2 - Midpoint Logic: Fallback when no qualifying gap exists
 */

import type { BurstRecord, ShiftConfig, BreakTimes } from '@/types/attendance';

export class BreakDetector {
  /**
   * Detect break times from bursts within a shift instance
   *
   * Algorithm:
   * 1. Filter bursts in break search window
   * 2. Try gap detection first (priority 1)
   * 3. Fall back to midpoint logic if no qualifying gap
   * 4. Handle edge cases (all before/after midpoint, single swipe)
   *
   * @param bursts - Bursts belonging to a shift instance
   * @param shiftConfig - Shift configuration with break parameters
   * @returns Break times (out, in) and break-in time object for status
   */
  detectBreak(bursts: BurstRecord[], shiftConfig: ShiftConfig): BreakTimes {
    // Filter bursts in break search window
    const breakBursts = this.filterBreakBursts(bursts, shiftConfig);

    if (breakBursts.length === 0) {
      return { breakOut: '', breakIn: '', breakInTime: null };
    }

    // Sort chronologically
    breakBursts.sort((a, b) => a.burstStart.getTime() - b.burstStart.getTime());

    // PRIORITY 1: Try gap-based detection first
    if (breakBursts.length >= 2) {
      const gapResult = this.detectBreakByGap(breakBursts, shiftConfig);
      if (gapResult) {
        return gapResult;
      }
    }

    // PRIORITY 2: Fallback to midpoint logic
    return this.detectBreakByMidpoint(breakBursts, shiftConfig);
  }

  /**
   * Filter bursts that fall within break search window
   */
  private filterBreakBursts(bursts: BurstRecord[], shiftConfig: ShiftConfig): BurstRecord[] {
    return bursts.filter((burst) => {
      const startTime = this.extractTime(burst.burstStart);
      const endTime = this.extractTime(burst.burstEnd);

      return (
        this.isTimeInRange(startTime, shiftConfig.breakSearchStart, shiftConfig.breakSearchEnd) ||
        this.isTimeInRange(endTime, shiftConfig.breakSearchStart, shiftConfig.breakSearchEnd)
      );
    });
  }

  /**
   * PRIORITY 1: Detect break using gap-based algorithm
   *
   * Enhanced logic: Independent gap selection per rule.yaml
   * - Break Time Out: gap with Break Time Out closest to checkpoint
   * - Break Time In: gap with Break Time In closest to cutoff
   */
  private detectBreakByGap(bursts: BurstRecord[], shiftConfig: ShiftConfig): BreakTimes | null {
    const minGapMinutes = shiftConfig.minimumBreakGapMinutes;

    // Calculate gaps between consecutive bursts
    const gaps: Array<{ index: number; gapMinutes: number }> = [];

    for (let i = 0; i < bursts.length - 1; i++) {
      const currentEnd = bursts[i]!.burstEnd;
      const nextStart = bursts[i + 1]!.burstStart;
      const gapMs = nextStart.getTime() - currentEnd.getTime();
      const gapMinutes = gapMs / (60 * 1000);

      if (gapMinutes >= minGapMinutes) {
        gaps.push({ index: i, gapMinutes });
      }
    }

    if (gaps.length === 0) {
      return null;
    }

    // Find Break Time Out: gap with Break Time Out closest to checkpoint
    const checkpoint = this.parseTime(shiftConfig.breakOutCheckpoint);
    let bestOutGap: { index: number; distance: number } | null = null;

    for (const gap of gaps) {
      const breakOutTime = this.extractTime(bursts[gap.index]!.burstEnd);
      const distance = Math.abs(this.timeToSeconds(breakOutTime) - this.timeToSeconds(checkpoint));

      if (!bestOutGap || distance < bestOutGap.distance) {
        bestOutGap = { index: gap.index, distance };
      }
    }

    // Find Break Time In: gap with Break Time In closest to cutoff (grace period end)
    const cutoff = this.parseTime(shiftConfig.breakInOnTimeCutoff);
    let bestInGap: { index: number; distance: number } | null = null;

    for (const gap of gaps) {
      const breakInTime = this.extractTime(bursts[gap.index + 1]!.burstStart);
      const distance = Math.abs(this.timeToSeconds(breakInTime) - this.timeToSeconds(cutoff));

      if (!bestInGap || distance < bestInGap.distance) {
        bestInGap = { index: gap.index, distance };
      }
    }

    if (bestOutGap && bestInGap) {
      const breakOutTs = bursts[bestOutGap.index]!.burstEnd;
      const breakInTs = bursts[bestInGap.index + 1]!.burstStart;

      return {
        breakOut: this.formatTime(breakOutTs),
        breakIn: this.formatTime(breakInTs),
        breakInTime: breakInTs.toTimeString().substring(0, 8),
      };
    }

    return null;
  }

  /**
   * PRIORITY 2: Detect break using midpoint logic (fallback)
   */
  private detectBreakByMidpoint(bursts: BurstRecord[], shiftConfig: ShiftConfig): BreakTimes {
    const midpoint = this.parseTime(shiftConfig.midpoint);
    const minGapMinutes = shiftConfig.minimumBreakGapMinutes;

    // Split bursts by midpoint
    const beforeMidpoint = bursts.filter((b) => {
      const endTime = this.extractTime(b.burstEnd);
      return this.timeToSeconds(endTime) <= this.timeToSeconds(midpoint);
    });

    const afterMidpoint = bursts.filter((b) => {
      const startTime = this.extractTime(b.burstStart);
      return this.timeToSeconds(startTime) > this.timeToSeconds(midpoint);
    });

    // Case 1: Swipes span midpoint - use midpoint logic
    if (beforeMidpoint.length > 0 && afterMidpoint.length > 0) {
      const breakOutTs = beforeMidpoint[beforeMidpoint.length - 1]!.burstEnd;
      const breakInTs = afterMidpoint[0]!.burstStart;

      return {
        breakOut: this.formatTime(breakOutTs),
        breakIn: this.formatTime(breakInTs),
        breakInTime: breakInTs.toTimeString().substring(0, 8),
      };
    }

    // Case 2: All swipes before midpoint
    if (beforeMidpoint.length > 0 && afterMidpoint.length === 0) {
      // Try gap detection within before-midpoint swipes
      if (beforeMidpoint.length >= 2) {
        const gapResult = this.findGapInBursts(beforeMidpoint, minGapMinutes);
        if (gapResult) {
          return gapResult;
        }
      }

      // No gap: Break Out = latest, Break In = blank
      const breakOutTs = beforeMidpoint[beforeMidpoint.length - 1]!.burstEnd;
      return {
        breakOut: this.formatTime(breakOutTs),
        breakIn: '',
        breakInTime: null,
      };
    }

    // Case 3: All swipes after midpoint
    if (beforeMidpoint.length === 0 && afterMidpoint.length > 0) {
      // Try gap detection within after-midpoint swipes
      if (afterMidpoint.length >= 2) {
        const gapResult = this.findGapInBursts(afterMidpoint, minGapMinutes);
        if (gapResult) {
          return gapResult;
        }
      }

      // No gap: Break Out = blank, Break In = earliest
      const breakInTs = afterMidpoint[0]!.burstStart;
      return {
        breakOut: '',
        breakIn: this.formatTime(breakInTs),
        breakInTime: breakInTs.toTimeString().substring(0, 8),
      };
    }

    // Case 4: No swipes (shouldn't reach here)
    return { breakOut: '', breakIn: '', breakInTime: null };
  }

  /**
   * Find first qualifying gap in a subset of bursts
   */
  private findGapInBursts(bursts: BurstRecord[], minGapMinutes: number): BreakTimes | null {
    for (let i = 0; i < bursts.length - 1; i++) {
      const currentEnd = bursts[i]!.burstEnd;
      const nextStart = bursts[i + 1]!.burstStart;
      const gapMs = nextStart.getTime() - currentEnd.getTime();
      const gapMinutes = gapMs / (60 * 1000);

      if (gapMinutes >= minGapMinutes) {
        return {
          breakOut: this.formatTime(currentEnd),
          breakIn: this.formatTime(nextStart),
          breakInTime: nextStart.toTimeString().substring(0, 8),
        };
      }
    }

    return null;
  }

  /**
   * Check if time is in range (handles midnight crossing)
   */
  private isTimeInRange(time: string, start: string, end: string): boolean {
    const timeNormalized = time.substring(0, 5);
    const startNormalized = start.substring(0, 5);
    const endNormalized = end.substring(0, 5);

    if (startNormalized <= endNormalized) {
      // Normal range
      return timeNormalized >= startNormalized && timeNormalized <= endNormalized;
    } else {
      // Midnight-spanning range
      return timeNormalized >= startNormalized || timeNormalized <= endNormalized;
    }
  }

  /**
   * Extract time string from Date (HH:MM:SS)
   */
  private extractTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  /**
   * Format Date as HH:MM:SS string
   */
  private formatTime(date: Date): string {
    return this.extractTime(date);
  }

  /**
   * Parse time string to HH:MM:SS format
   */
  private parseTime(time: string): string {
    // Already in HH:MM:SS or HH:MM format
    return time.length === 5 ? `${time}:00` : time;
  }

  /**
   * Convert time string to seconds since midnight
   */
  private timeToSeconds(time: string): number {
    const parts = time.split(':');
    const hours = parseInt(parts[0]!, 10);
    const minutes = parseInt(parts[1]!, 10);
    const seconds = parts[2] ? parseInt(parts[2], 10) : 0;
    return hours * 3600 + minutes * 60 + seconds;
  }
}
