'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { UserStats } from '@/types/attendance';

interface DeviationAnalysisChartProps {
  data: UserStats[];
}

export default function DeviationAnalysisChart({ data }: DeviationAnalysisChartProps) {
  const chartData = data.map((user) => ({
    name: user.userName,
    onTime: user.onTimePercentage,
    late: user.latePercentage,
    soon: user.soonPercentage,
    total: user.onTimePercentage + user.latePercentage + user.soonPercentage,
  }));

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="mb-6 text-xl font-bold text-gray-900">
        Deviation Analysis by User
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 20, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
            stroke="#6b7280"
            tick={{ fill: '#374151', fontWeight: 500, fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            stroke="#6b7280"
            tick={{ fill: '#374151', fontWeight: 500, fontSize: 12 }}
            label={{
              value: 'Percentage (%)',
              angle: -90,
              position: 'insideLeft',
              style: { fill: '#6b7280', fontWeight: 500, fontSize: 12 },
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            labelStyle={{ color: '#111827', fontWeight: 600 }}
            itemStyle={{ color: '#374151' }}
          />
          <Bar dataKey="onTime" stackId="deviation" radius={[0, 0, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-ontime-${index}`} fill="#10B981" />
            ))}
          </Bar>
          <Bar dataKey="late" stackId="deviation" radius={[0, 0, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-late-${index}`} fill="#EF4444" />
            ))}
          </Bar>
          <Bar dataKey="soon" stackId="deviation" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-soon-${index}`} fill="#F97316" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-6 flex justify-center gap-8">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-green-500"></div>
          <span className="text-sm font-medium text-gray-600">On Time</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-red-500"></div>
          <span className="text-sm font-medium text-gray-600">Late</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-orange-500"></div>
          <span className="text-sm font-medium text-gray-600">Soon</span>
        </div>
      </div>
    </div>
  );
}
