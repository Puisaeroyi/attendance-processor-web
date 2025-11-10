'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ShiftStats } from '@/types/attendance';

interface ShiftDistributionChartProps {
  data: ShiftStats[];
}

// Colors for shift types (Design guideline palette)
const SHIFT_COLORS: Record<string, string> = {
  A: '#FACC15', // Yellow (Morning)
  B: '#3B82F6', // Blue (Afternoon)
  C: '#8B5CF6', // Purple (Night)
};

export default function ShiftDistributionChart({ data }: ShiftDistributionChartProps) {
  // Transform data for Recharts
  const chartData = data.map((shift) => ({
    name: `Shift ${shift.shift} - ${shift.shiftName}`,
    value: shift.count,
    percentage: shift.percentage,
    shift: shift.shift,
  }));

  return (
    <div className="bg-nb-white border-nb-4 border-nb-black shadow-nb p-nb-6">
      <h3 className="mb-nb-4 font-display text-xl font-black uppercase tracking-tight text-nb-black">
        Shift Distribution
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry: unknown) => {
              const data = entry as { percentage?: number };
              return data.percentage ? `${data.percentage}%` : '';
            }}
            outerRadius={90}
            dataKey="value"
            stroke="#000000"
            strokeWidth={3}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={SHIFT_COLORS[entry.shift] || '#8E8E93'}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '4px solid #000000',
              borderRadius: '0',
              boxShadow: '4px 4px 0px #000000',
              fontWeight: 'bold',
            }}
            itemStyle={{ color: '#000000', fontWeight: 'bold' }}
            formatter={(value: number, name: string, item: unknown) => {
              const payload = item as { payload?: { percentage?: number } };
              const percentage = payload?.payload?.percentage || 0;
              return [`${value} (${percentage}%)`, name];
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{
              paddingTop: '20px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-nb-4 grid grid-cols-3 gap-nb-4">
        {data.map((shift) => (
          <div key={shift.shift} className="text-center">
            <div
              className="mx-auto mb-nb-2 h-6 w-6 border-nb-2 border-nb-black"
              style={{ backgroundColor: SHIFT_COLORS[shift.shift] }}
            ></div>
            <p className="text-xs font-bold uppercase text-nb-black">Shift {shift.shift} - {shift.shiftName}</p>
            <p className="text-sm font-black text-nb-black">{shift.count}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
