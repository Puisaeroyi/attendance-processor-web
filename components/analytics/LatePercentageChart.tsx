'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { UserStats } from '@/types/attendance';

interface LatePercentageChartProps {
  data: UserStats[];
}

export default function LatePercentageChart({ data }: LatePercentageChartProps) {
  // Transform data for Recharts
  const chartData = data.map((user) => ({
    name: user.userName,
    late: user.latePercentage,
    onTime: user.onTimePercentage,
  }));

  return (
    <div className="bg-nb-white border-nb-4 border-nb-black shadow-nb p-nb-6">
      <h3 className="mb-nb-4 font-display text-xl font-black uppercase tracking-tight text-nb-black">
        Late Percentage by User
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 20, left: 20, bottom: 60 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#d1d1d1"
            strokeWidth={1}
          />
          <XAxis
            dataKey="name"
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
              value: 'PERCENTAGE (%)',
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
          <Bar dataKey="late" radius={0}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-late-${index}`} fill="#EF4444" stroke="#000000" strokeWidth={2} />
            ))}
          </Bar>
          <Bar dataKey="onTime" radius={0}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-ontime-${index}`} fill="#10B981" stroke="#000000" strokeWidth={2} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-nb-4 flex justify-center gap-nb-6">
        <div className="flex items-center gap-nb-2">
          <div className="h-4 w-4 bg-nb-red border-nb-2 border-nb-black"></div>
          <span className="text-sm font-bold uppercase text-nb-black">Late</span>
        </div>
        <div className="flex items-center gap-nb-2">
          <div className="h-4 w-4 bg-nb-green border-nb-2 border-nb-black"></div>
          <span className="text-sm font-bold uppercase text-nb-black">On Time</span>
        </div>
      </div>
    </div>
  );
}
