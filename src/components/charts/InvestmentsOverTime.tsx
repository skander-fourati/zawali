import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

interface InvestmentsOverTimeProps {
  data: Array<{
    month: string;
    amount: number; // This should be the total investment amount for the month
  }>;
}

export function InvestmentsOverTime({ data }: InvestmentsOverTimeProps) {
  const chartConfig = {
    amount: {
      label: 'Monthly Investments',
      color: 'hsl(var(--chart-1))', // Using a distinct color for investments
    },
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(value);
  };

  // EXPLANATION: For investments, we want to show the absolute value
  // because negative amounts (money leaving account) represent investments made
  const processedData = data.map(monthData => ({
    ...monthData,
    amount: Math.abs(monthData.amount) // Show positive values for money invested
  }));

  return (
    <Card className="bg-gradient-card shadow-soft border-0">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Investments Over Last 12 Months</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={formatCurrency}
              />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                formatter={(value: number) => [formatCurrency(value), 'Investments']}
              />
              <Bar 
                dataKey="amount" 
                fill="hsl(220, 90%, 56%)" // Blue color for investments
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}