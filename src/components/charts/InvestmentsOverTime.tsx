import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LabelList } from 'recharts';

interface InvestmentsOverTimeProps {
  data: Array<{
    month: string;
    amount: number; // Amount should be negative for investments (money leaving account)
  }>;
  categoryColors?: Record<string, string>; // NEW: Add category colors
}

export function InvestmentsOverTime({ data, categoryColors = {} }: InvestmentsOverTimeProps) {
  // Use Investment category color if available, otherwise default
  const investmentColor = categoryColors['Investment'] || '#4A1A4A';

  const chartConfig = {
    amount: {
      label: 'Monthly Investments',
      color: investmentColor,
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

  // Custom tooltip that doesn't show unnecessary text
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      return (
        <div className="bg-white p-2 border rounded shadow">
          <p className="font-medium">{formatCurrency(value)}</p>
        </div>
      );
    }
    return null;
  };

  // EXPLANATION: For investments, we want to show the absolute value
  // because negative amounts (money leaving account) represent investments made
  const processedData = data.map(monthData => ({
    ...monthData,
    amount: monthData.amount
  }));

  return (
    <Card className="bg-gradient-card shadow-soft border-0">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Investments Over Last 12 Months</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center">
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={processedData} margin={{ top: 30, right: 30, left: 20, bottom: 5 }}>
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
                      fill={investmentColor}
                      radius={[4, 4, 0, 0]}
                    >
                      {/* Add total labels on top of bars */}
                      <LabelList
  dataKey="amount"
  content={({ x, y, width, height, value }: any) => {
    if (value === 0) return null;
    
    const isNegative = value < 0;
    const centerX = x + (width || 0) / 2;
    
    // For negative bars: y is at zero line, so y - 5 puts label above zero line
    // For positive bars: y is at top of bar, so y - 5 puts label above bar
    // The issue is negative bars extend downward, so we want label at the top edge
    const labelY = isNegative ? y + (height || 0) - 5 : y - 5;
    
    return (
      <text 
        x={centerX} 
        y={labelY}
        textAnchor="middle" 
        fontSize={12} 
        fill={isNegative ? "#dc2626" : "#666"}
        dominantBaseline="bottom"
      >
        {formatCurrency(value)}
      </text>
    );
  }}
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