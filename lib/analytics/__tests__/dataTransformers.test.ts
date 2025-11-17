import {
  calculateUserStats,
  calculateShiftDistribution,
  calculateTrends,
  generateSummaryStats,
  transformToAnalytics,
} from '../dataTransformers';
import { AttendanceRecord } from '@/types/attendance';

describe('Data Transformers', () => {
  const mockRecords: AttendanceRecord[] = [
    {
      date: new Date('2024-01-01'),
      id: '001',
      name: 'Silver_Bui',
      shift: 'A',
      checkIn: '08:00:00',
      breakOut: '12:00:00',
      breakIn: '13:00:00',
      checkOut: '17:00:00',
      status: 'On Time',
      totalHours: 8,
      overtime: 0,
    },
    {
      date: new Date('2024-01-01'),
      id: '002',
      name: 'Capone',
      shift: 'B',
      checkIn: '13:00:00',
      breakOut: '17:00:00',
      breakIn: '18:00:00',
      checkOut: '22:00:00',
      status: 'Late Check-in',
      totalHours: 8,
      overtime: 0,
    },
    {
      date: new Date('2024-01-02'),
      id: '003',
      name: 'Silver_Bui',
      shift: 'A',
      checkIn: '08:05:00',
      breakOut: '12:00:00',
      breakIn: '13:05:00',
      checkOut: '17:00:00',
      status: 'Late Check-in, Late Break In',
      totalHours: 8,
      overtime: 0,
    },
    {
      date: new Date('2024-01-02'),
      id: '004',
      name: 'Minh',
      shift: 'C',
      checkIn: '22:00:00',
      breakOut: '02:00:00',
      breakIn: '03:00:00',
      checkOut: '07:00:00',
      status: 'On Time',
      totalHours: 8,
      overtime: 0,
    },
    {
      date: new Date('2024-01-03'),
      id: '005',
      name: 'Trieu',
      shift: 'A',
      checkIn: '08:00:00',
      breakOut: '12:00:00',
      breakIn: '13:00:00',
      checkOut: '17:00:00',
      status: 'On Time',
      totalHours: 8,
      overtime: 0,
    },
  ];

  describe('calculateUserStats', () => {
    it('should calculate correct user statistics', () => {
      const stats = calculateUserStats(mockRecords);

      // Silver_Bui has 2 records, 1 late
      const silverStats = stats.find((s) => s.userName === 'Silver_Bui');
      expect(silverStats).toEqual({
        userName: 'Silver_Bui',
        totalRecords: 2,
        lateCount: 1,
        onTimeCount: 1,
        latePercentage: 50,
        onTimePercentage: 50,
      });

      // Capone has 1 record, 1 late
      const caponeStats = stats.find((s) => s.userName === 'Capone');
      expect(caponeStats).toEqual({
        userName: 'Capone',
        totalRecords: 1,
        lateCount: 1,
        onTimeCount: 0,
        latePercentage: 100,
        onTimePercentage: 0,
      });
    });

    it('should sort by total records descending', () => {
      const stats = calculateUserStats(mockRecords);
      expect(stats[0].userName).toBe('Silver_Bui'); // 2 records
    });

    it('should handle empty records', () => {
      const stats = calculateUserStats([]);
      expect(stats).toEqual([]);
    });
  });

  describe('calculateShiftDistribution', () => {
    it('should calculate correct shift distribution', () => {
      const distribution = calculateShiftDistribution(mockRecords);

      expect(distribution).toHaveLength(3);

      const shiftA = distribution.find((s) => s.shift === 'A');
      expect(shiftA).toEqual({
        shift: 'A',
        shiftName: 'Morning',
        count: 3,
        percentage: 60,
      });

      const shiftB = distribution.find((s) => s.shift === 'B');
      expect(shiftB).toEqual({
        shift: 'B',
        shiftName: 'Afternoon',
        count: 1,
        percentage: 20,
      });

      const shiftC = distribution.find((s) => s.shift === 'C');
      expect(shiftC).toEqual({
        shift: 'C',
        shiftName: 'Night',
        count: 1,
        percentage: 20,
      });
    });

    it('should sort by shift code', () => {
      const distribution = calculateShiftDistribution(mockRecords);
      expect(distribution.map((s) => s.shift)).toEqual(['A', 'B', 'C']);
    });

    it('should handle empty records', () => {
      const distribution = calculateShiftDistribution([]);
      expect(distribution).toEqual([]);
    });
  });

  describe('calculateTrends', () => {
    it('should group records by date', () => {
      const trends = calculateTrends(mockRecords);

      expect(trends).toHaveLength(3); // 3 unique dates
      expect(trends[0].date).toBe('2024-01-01');
      expect(trends[1].date).toBe('2024-01-02');
      expect(trends[2].date).toBe('2024-01-03');
    });

    it('should count attendance per user per date', () => {
      const trends = calculateTrends(mockRecords);

      // 2024-01-01: Silver_Bui (1), Capone (1)
      expect(trends[0].Silver_Bui).toBe(1);
      expect(trends[0].Capone).toBe(1);

      // 2024-01-02: Silver_Bui (1), Minh (1)
      expect(trends[1].Silver_Bui).toBe(1);
      expect(trends[1].Minh).toBe(1);

      // 2024-01-03: Trieu (1)
      expect(trends[2].Trieu).toBe(1);
    });

    it('should sort by date ascending', () => {
      const trends = calculateTrends(mockRecords);
      // Dates are strings in ISO format, so lexicographic comparison works
      expect(trends[0].date < trends[1].date).toBe(true);
      expect(trends[1].date < trends[2].date).toBe(true);
    });

    it('should handle empty records', () => {
      const trends = calculateTrends([]);
      expect(trends).toEqual([]);
    });
  });

  describe('generateSummaryStats', () => {
    it('should calculate correct summary statistics', () => {
      const summary = generateSummaryStats(mockRecords);

      expect(summary).toEqual({
        totalRecords: 5,
        totalLate: 2, // Silver_Bui late on day 2, Capone late on day 1
        totalOnTime: 3,
        latePercentage: 40,
        onTimePercentage: 60,
        averageAttendance: 1.3, // 5 records / 4 unique users = 1.25 rounded to 1.3
        uniqueUsers: 4,
      });
    });

    it('should handle empty records', () => {
      const summary = generateSummaryStats([]);
      expect(summary).toEqual({
        totalRecords: 0,
        totalLate: 0,
        totalOnTime: 0,
        latePercentage: 0,
        onTimePercentage: 0,
        averageAttendance: 0,
        uniqueUsers: 0,
      });
    });

    it('should count unique users correctly', () => {
      const summary = generateSummaryStats(mockRecords);
      expect(summary.uniqueUsers).toBe(4); // Silver_Bui, Capone, Minh, Trieu
    });
  });

  describe('transformToAnalytics', () => {
    it('should transform records into complete analytics data', () => {
      const analytics = transformToAnalytics(mockRecords);

      expect(analytics).toHaveProperty('userStats');
      expect(analytics).toHaveProperty('shiftDistribution');
      expect(analytics).toHaveProperty('trends');
      expect(analytics).toHaveProperty('summary');

      expect(analytics.userStats).toHaveLength(4);
      expect(analytics.shiftDistribution).toHaveLength(3);
      expect(analytics.trends).toHaveLength(3);
      expect(analytics.summary.totalRecords).toBe(5);
    });

    it('should handle empty records', () => {
      const analytics = transformToAnalytics([]);

      expect(analytics.userStats).toEqual([]);
      expect(analytics.shiftDistribution).toEqual([]);
      expect(analytics.trends).toEqual([]);
      expect(analytics.summary.totalRecords).toBe(0);
    });
  });
});
