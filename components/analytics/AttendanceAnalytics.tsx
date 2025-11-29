'use client';

import { AttendanceRecord } from '@/types/attendance';
import { transformToAnalytics } from '@/lib/analytics/dataTransformers';
import DeviationAnalysisChart from './DeviationAnalysisChart';
import AttendanceSummaryTable from './AttendanceSummaryTable';
import { BarChart3 } from 'lucide-react';

interface AttendanceAnalyticsProps {
  data: AttendanceRecord[];
}

export default function AttendanceAnalytics({ data }: AttendanceAnalyticsProps) {
  if (!data || data.length === 0) {
    return null;
  }

  const analytics = transformToAnalytics(data);

  return (
    <div className="mt-12">
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600">
          <BarChart3 className="h-8 w-8 text-white" />
        </div>
        <h2 className="mb-3 text-3xl font-bold text-white">
          Analytics Dashboard
        </h2>
        <p className="text-white/70">
          Visual insights from your attendance data
        </p>
      </div>

      {/* Summary Table */}
      <div className="mb-8">
        <AttendanceSummaryTable userStats={analytics.userStats} summary={analytics.summary} />
      </div>

      {/* Deviation Analysis Chart */}
      <div className="mb-8">
        <DeviationAnalysisChart data={analytics.userStats} />
      </div>
    </div>
  );
}
