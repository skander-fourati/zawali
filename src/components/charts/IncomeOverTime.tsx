import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LabelList } from 'recharts';

interface IncomeOverTimeProps {
  data: Array<{
    month: string;
    amount: number;
  }>;
  categoryColors?: Record<string, string>; // NEW: Add category colors
}

export function IncomeOverTime({ data, categoryColors = {} }: IncomeOverTimeProps) {
  // Use Income category color if available, otherwise default
  const incomeColor = categoryColors['Income'] || '#2D5016';

  const chartConfig = {
    amount: {
      label: 'Monthly Income',
      color: incomeColor,
    },
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(value));
  };

  return (
    <Card className="bg-gradient-card shadow-soft border-0">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Income Over Last 12 Months</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center">
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 30, right: 30, left: 20, bottom: 5 }}>
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={formatCurrency}
                    />
                    <ChartTooltip 
                      content={({ active, payload, label }: any) => {
                        if (active && payload && payload.length) {
                          const value = payload[0].value;
                          return (
                            <div className="bg-white p-2 border rounded shadow">
                              <p className="font-medium">{formatCurrency(value)}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      dataKey="amount" 
                      fill={incomeColor}
                      radius={[4, 4, 0, 0]}
                    >
                      {/* Add total labels on top of bars - only show if amount > 0 */}
                      <LabelList
                        dataKey="amount"
                        position="top"
                        formatter={(value: number) => value > 0 ? formatCurrency(value) : ''}
                        fontSize={12}
                        fill="#666"
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}