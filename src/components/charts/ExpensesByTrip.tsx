import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LabelList, Cell } from 'recharts';

interface ExpensesByTripProps {
  data: Array<{
    trip: string;
    amount: number;
    color: string;
  }>;
}

export function ExpensesByTrip({ data }: ExpensesByTripProps) {
  const chartConfig = data.reduce((config, item) => {
    config[item.trip] = {
      label: item.trip,
      color: item.color,
    };
    return config;
  }, {} as any);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(value);
  };

  // FIXED: Convert negative amounts to positive for display with muted colors
  const processedData = data.map((item, index) => {
    // Use muted/pastel colors for trips
    const mutedColors = [
      '#8B9DC3', // Muted blue
      '#DDA0A0', // Muted red/pink
      '#A8C4A2', // Muted green
      '#E6C18A', // Muted orange
      '#C8A4C8', // Muted purple
      '#9FC5C5', // Muted teal
      '#D4B4A8', // Muted brown
      '#B8C4A4'  // Muted olive
    ];
    
    return {
      ...item,
      amount: Math.abs(item.amount), // Show expenses as positive amounts
      color: mutedColors[index % mutedColors.length]
    };
  });

  // Custom tooltip that shows just the trip and amount
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      return (
        <div className="bg-white p-2 border rounded shadow">
          <p className="font-medium">{`${label}: ${formatCurrency(value)}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-gradient-card shadow-soft border-0">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Monthly Expenses by Trip</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={processedData} margin={{ top: 30, right: 30, left: 20, bottom: 80 }}>
              <XAxis 
                dataKey="trip" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
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
                {/* Use different colors for each bar */}
                {processedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}