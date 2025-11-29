'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, RefreshCw, Trash2, Upload } from 'lucide-react';
import { AttendanceRecord } from '@/types/attendance';
import AttendanceSummaryTable from '@/components/analytics/AttendanceSummaryTable';
import DeviationAnalysisChart from '@/components/analytics/DeviationAnalysisChart';
import AttendanceDetails from '@/components/analytics/AttendanceDetails';
import { transformToAnalytics } from '@/lib/analytics/dataTransformers';
import { loadAttendanceData, clearAttendanceData } from '@/lib/storage/attendanceData';

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<AttendanceRecord[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from localStorage on mount
  useEffect(() => {
    const storedData = loadAttendanceData();
    setData(storedData);
    setIsLoading(false);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    const storedData = loadAttendanceData();
    setData(storedData);
    setIsLoading(false);
  };

  const handleClear = () => {
    clearAttendanceData();
    setData(null);
  };

  const analytics = data ? transformToAnalytics(data) : null;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3 text-white">
            <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Loading dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-12 text-center">
        <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
          <BarChart3 className="h-10 w-10 text-white" />
        </div>
        <h1 className="mb-4 text-4xl font-bold text-white">
          Analytics Dashboard
        </h1>
        <p className="text-lg text-white/70">
          View attendance analytics, summaries, and detailed records
        </p>
      </div>

      <div className="mx-auto max-w-7xl space-y-8">
        {/* Data Source Info */}
        {data && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Data Source</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {data.length} attendance records loaded from processor
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefresh}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>
                <button
                  onClick={handleClear}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear Data
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Section */}
        {data && analytics && (
          <>
            {/* Summary Stats */}
            <div className="grid gap-6 md:grid-cols-4">
              <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
                <div className="text-3xl font-bold text-gray-900">{analytics.summary.totalRecords}</div>
                <p className="text-sm text-gray-500 mt-1">Total Records</p>
              </div>
              <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
                <div className="text-3xl font-bold text-green-600">{analytics.summary.onTimePercentage}%</div>
                <p className="text-sm text-gray-500 mt-1">On Time</p>
              </div>
              <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
                <div className="text-3xl font-bold text-orange-500">{analytics.summary.deviationPercentage}%</div>
                <p className="text-sm text-gray-500 mt-1">Deviation</p>
              </div>
              <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
                <div className="text-3xl font-bold text-blue-600">{analytics.summary.uniqueUsers}</div>
                <p className="text-sm text-gray-500 mt-1">Unique Users</p>
              </div>
            </div>

            {/* Summary Table */}
            <AttendanceSummaryTable userStats={analytics.userStats} summary={analytics.summary} />

            {/* Deviation Chart */}
            <DeviationAnalysisChart data={analytics.userStats} />

            {/* Attendance Details */}
            <AttendanceDetails data={data} />
          </>
        )}

        {/* Empty State */}
        {!data && (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-12 text-center">
            <BarChart3 className="mx-auto mb-4 h-16 w-16 text-white/40" />
            <h3 className="text-xl font-semibold text-white mb-2">No Data Available</h3>
            <p className="text-white/60 mb-6">
              Process attendance data in the Processor page to view analytics here.
            </p>
            <button
              onClick={() => router.push('/processor')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all"
            >
              <Upload className="h-5 w-5" />
              Go to Processor
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
