/**
 * Burst Detection Algorithm
 * Ported from Python processor.py _detect_bursts method
 *
 * A "burst" is a sequence of consecutive swipes by the same person
 * where each swipe is within the threshold time of the previous swipe.
 */

import type { SwipeRecord, BurstRecord, BurstDetectionConfig } from '@/types/attendance';

export class BurstDetector {
  private config: BurstDetectionConfig;

  constructor(config: BurstDetectionConfig) {
    this.config = config;
  }

  /**
   * Detect bursts in swipe records
   * Groups consecutive swipes within threshold into single burst events
   *
   * @param swipes - Array of swipe records sorted by timestamp
   * @returns Array of burst records
   */
  detectBursts(swipes: SwipeRecord[]): BurstRecord[] {
    if (swipes.length === 0) {
      return [];
    }

    const thresholdMs = this.config.thresholdMinutes * 60 * 1000;

    // Group swipes by user name
    const userGroups = this.groupByUser(swipes);

    const allBursts: BurstRecord[] = [];

    // Process each user's swipes independently
    for (const [userName, userSwipes] of Object.entries(userGroups)) {
      // Sort by timestamp (should already be sorted, but ensure it)
      userSwipes.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      const userBursts = this.detectUserBursts(userName, userSwipes, thresholdMs);
      allBursts.push(...userBursts);
    }

    // Sort all bursts by start time
    allBursts.sort((a, b) => a.burstStart.getTime() - b.burstStart.getTime());

    return allBursts;
  }

  /**
   * Group swipes by user name
   */
  private groupByUser(swipes: SwipeRecord[]): Record<string, SwipeRecord[]> {
    return swipes.reduce(
      (groups, swipe) => {
        const name = swipe.name;
        if (!groups[name]) {
          groups[name] = [];
        }
        groups[name]!.push(swipe);
        return groups;
      },
      {} as Record<string, SwipeRecord[]>
    );
  }

  /**
   * Detect bursts for a single user's swipes
   */
  private detectUserBursts(
    userName: string,
    swipes: SwipeRecord[],
    thresholdMs: number
  ): BurstRecord[] {
    const bursts: BurstRecord[] = [];
    let burstIdCounter = 0;
    let currentBurstSwipes: SwipeRecord[] = [];

    for (let i = 0; i < swipes.length; i++) {
      const currentSwipe = swipes[i]!;

      if (i === 0) {
        // First swipe starts a new burst
        currentBurstSwipes.push(currentSwipe);
      } else {
        const previousSwipe = swipes[i - 1]!;
        const timeDiff = currentSwipe.timestamp.getTime() - previousSwipe.timestamp.getTime();

        if (timeDiff <= thresholdMs) {
          // Within threshold - add to current burst
          currentBurstSwipes.push(currentSwipe);
        } else {
          // Threshold exceeded - finalize current burst and start new one
          if (currentBurstSwipes.length > 0) {
            bursts.push(this.createBurstRecord(userName, currentBurstSwipes, burstIdCounter));
            burstIdCounter++;
          }
          currentBurstSwipes = [currentSwipe];
        }
      }
    }

    // Handle the last burst
    if (currentBurstSwipes.length > 0) {
      bursts.push(this.createBurstRecord(userName, currentBurstSwipes, burstIdCounter));
    }

    return bursts;
  }

  /**
   * Create a burst record from a group of swipes
   */
  private createBurstRecord(
    userName: string,
    swipes: SwipeRecord[],
    burstId: number
  ): BurstRecord {
    // Get all timestamps to find min/max
    const timestamps = swipes.map((s) => s.timestamp.getTime());
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);

    return {
      name: userName,
      burstId: `${userName}_burst_${burstId}`,
      burstStart: new Date(minTime),
      burstEnd: new Date(maxTime),
      swipeCount: swipes.length,
      swipes: swipes,
    };
  }

  /**
   * Get statistics about burst detection
   */
  getBurstStatistics(bursts: BurstRecord[]): {
    totalBursts: number;
    totalSwipes: number;
    averageSwipesPerBurst: number;
    userCount: number;
  } {
    const uniqueUsers = new Set(bursts.map((b) => b.name));
    const totalSwipes = bursts.reduce((sum, b) => sum + b.swipeCount, 0);

    return {
      totalBursts: bursts.length,
      totalSwipes,
      averageSwipesPerBurst: bursts.length > 0 ? totalSwipes / bursts.length : 0,
      userCount: uniqueUsers.size,
    };
  }
}
