

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card } from '@/components/ui/card';

const data = [
  { name: 'Mon', amount: 12000 },
  { name: 'Tue', amount: 45000 },
  { name: 'Wed', amount: 8000 },
  { name: 'Thu', amount: 25000 },
  { name: 'Fri', amount: 55000 },
  { name: 'Sat', amount: 30000 },
  { name: 'Sun', amount: 15000 },
];

export function SpendingChart() {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-6">Spending Overview</h3>
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `₦${val / 1000}k`} />
            <Tooltip 
              cursor={{ fill: '#f1f5f9' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              formatter={(value: any) => [`₦${Number(value).toLocaleString()}`, 'Spent']}
            />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill="var(--color-accent)" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
