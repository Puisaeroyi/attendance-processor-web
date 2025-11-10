'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendData } from '@/types/attendance';

interface AttendanceTrendsChartProps {
  data: TrendData[];
}

// Colors for user lines (Design guideline palette)
const USER_COLORS: Record<string, string> = {
  'Bui Duc Toan': '#3B82F6',        // Blue
  'Pham Tan Phat': '#EF4444',       // Red
  'Mac Le Duc Minh': '#10B981',     // Green
  'Nguyen Hoang Trieu': '#F59E0B',  // Amber/Orange
};

export default function AttendanceTrendsChart({ data }: AttendanceTrendsChartProps) {
  // Only show if we have multi-day data
  if (!data || data.length < 2) {
    return (
      <div className="bg-nb-white border-nb-4 border-nb-black shadow-nb p-nb-6">
        <h3 className="mb-nb-4 font-display text-xl font-black uppercase tracking-tight text-nb-black">
          Attendance Trends
        </h3>
        <div className="flex items-center justify-center h-64 text-nb-gray-500 font-bold">
          <p>Multi-day data required for trend analysis</p>
        </div>
      </div>
    );
  }

  // Extract user names from first data point (excluding 'date')
  const userNames = Object.keys(data[0] || {}).filter((key) => key !== 'date');

  return (
    <div className="bg-nb-white border-nb-4 border-nb-black shadow-nb p-nb-6">
      <h3 className="mb-nb-4 font-display text-xl font-black uppercase tracking-tight text-nb-black">
        Attendance Trends Over Time
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 20, right: 20, left: 20, bottom: 60 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#d1d1d1"
            strokeWidth={1}
          />
          <XAxis
            dataKey="date"
            stroke="#000000"
            strokeWidth={3}
            tick={{ fill: '#000000', fontWeight: 'bold', fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            stroke="#000000"
            strokeWidth={3}
            tick={{ fill: '#000000', fontWeight: 'bold', fontSize: 12 }}
            label={{
              value: 'ATTENDANCE COUNT',
              angle: -90,
              position: 'insideLeft',
              style: { fill: '#000000', fontWeight: 'bold', fontSize: 12 },
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '4px solid #000000',
              borderRadius: '0',
              boxShadow: '4px 4px 0px #000000',
              fontWeight: 'bold',
            }}
            labelStyle={{ color: '#000000', fontWeight: 'bold', textTransform: 'uppercase' }}
            itemStyle={{ color: '#000000' }}
          />
          <Legend
            wrapperStyle={{
              paddingTop: '10px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
            }}
          />
          {userNames.map((userName) => (
            <Line
              key={userName}
              type="monotone"
              dataKey={userName}
              stroke={USER_COLORS[userName] || '#8E8E93'}
              strokeWidth={3}
              dot={{ fill: '#ffffff', stroke: USER_COLORS[userName] || '#8E8E93', strokeWidth: 3, r: 5 }}
              activeDot={{ r: 7, strokeWidth: 3 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
