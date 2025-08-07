import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LabelList } from 'recharts';

interface SavingsOverTimeProps {
  data: Array<{
    month: string;
    amount: number; // This should be calculated as: Income - Expenses (excluding investments)
  }>;
}

export function SavingsOverTime({ data }: SavingsOverTimeProps) {
  const chartConfig = {
    amount: {
      label: 'Monthly Savings',
      color: '#8B6914', // Dark yellow/gold
    },
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(Math.abs(value)); // Show absolute value in formatting
  };

  // Custom tooltip that doesn't show "Savings" text
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      return (
        <div className="bg-white p-2 border rounded shadow">
          <p className="font-medium">{formatCurrency(value)}</p>
          {value < 0 && <p className="text-sm text-red-600">(Overspending)</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-gradient-card shadow-soft border-0">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Savings Over Last 12 Months</CardTitle>
        <p className="text-sm text-muted-foreground">Income minus Expenses (excluding investments)</p>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
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
                content={<CustomTooltip />}
              />
              <Bar 
                dataKey="amount" 
                fill="#8B6914" // Dark yellow/gold
                radius={[4, 4, 0, 0]}
              >
                {/* Add total labels on top of bars */}
                <LabelList
                  dataKey="amount"
                  position="top"
                  formatter={(value: number) => formatCurrency(value)}
                  fontSize={12}
                  fill="#666"
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}