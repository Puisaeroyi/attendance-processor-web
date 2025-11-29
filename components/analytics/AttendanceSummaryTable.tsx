'use client';

import { UserStats, SummaryStats } from '@/types/attendance';

interface AttendanceSummaryTableProps {
  userStats: UserStats[];
  summary: SummaryStats;
}

export default function AttendanceSummaryTable({ userStats, summary }: AttendanceSummaryTableProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="mb-6 text-xl font-bold text-gray-900">
        User Performance Summary
      </h3>

      {/* Overall Summary Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4 bg-gray-50 rounded-xl p-4">
        <div className="text-center">
          <p className="mb-1 text-xs font-medium uppercase text-gray-500">Total Records</p>
          <p className="text-2xl font-bold text-gray-900">{summary.totalRecords}</p>
        </div>
        <div className="text-center">
          <p className="mb-1 text-xs font-medium uppercase text-gray-500">On-Time %</p>
          <p className="text-2xl font-bold text-green-600">{summary.onTimePercentage}%</p>
        </div>
        <div className="text-center">
          <p className="mb-1 text-xs font-medium uppercase text-gray-500">Deviation %</p>
          <p className="text-2xl font-bold text-orange-500">{summary.deviationPercentage}%</p>
        </div>
      </div>

      {/* User Performance Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                User
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">
                Total
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">
                On Time
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">
                Late
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">
                Soon
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">
                Deviation
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {userStats.map((user, index) => (
              <tr
                key={user.userName}
                className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                <td className="px-4 py-3 font-medium text-gray-900">
                  {user.userName}
                </td>
                <td className="px-4 py-3 text-center font-medium text-gray-700">
                  {user.totalRecords}
                </td>
                <td className="px-4 py-3 text-center font-medium text-green-600">
                  {user.onTimeCount}
                </td>
                <td className="px-4 py-3 text-center font-medium text-red-500">
                  {user.lateCount}
                </td>
                <td className="px-4 py-3 text-center font-medium text-orange-500">
                  {user.soonCount}
                </td>
                <td className="px-4 py-3 text-center font-medium text-gray-700">
                  {user.lateCount + user.soonCount}
                </td>
                <td className="px-4 py-3 text-center">
                  {user.deviationPercentage === 0 ? (
                    <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                      Perfect
                    </span>
                  ) : user.deviationPercentage < 25 ? (
                    <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
                      Good
                    </span>
                  ) : (
                    <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                      Needs Improvement
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
