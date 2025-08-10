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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(value));
  };

  // FIXED: Convert negative amounts to positive for display with zawali theme colors
  const processedData = data.map((item, index) => {
    // Use zawali theme colors for trips
    const zawaliColors = [
      'hsl(0 84% 60%)',    // Primary - Broke Red
      'hsl(174 62% 47%)',  // Secondary - Hope Teal
      'hsl(199 89% 48%)',  // Accent - Dream Blue
      'hsl(142 71% 45%)',  // Success - Green
      'hsl(36 100% 50%)',  // Warning - Orange
      'hsl(14 100% 57%)',  // Destructive - Red Orange
      'hsl(0 84% 70%)',    // Lighter Primary
      'hsl(174 62% 57%)'   // Lighter Secondary
    ];
    
    return {
      ...item,
      amount: Math.abs(item.amount), // Show expenses as positive amounts
      color: zawaliColors[index % zawaliColors.length]
    };
  });

  // Custom tooltip using dark theme colors
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      return (
        <div className="bg-card border border-border p-2 rounded shadow-lg">
          <p className="font-medium text-foreground">{`${label}: ${formatCurrency(value)}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">All-Time Expenses by Trip</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={processedData} margin={{ top: 30, right: 30, left: 20, bottom: 80 }}>
                  <XAxis 
                    dataKey="trip" 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
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
                      fill="hsl(var(--muted-foreground))"
                    />
                    {/* Use different zawali colors for each bar */}
                    {processedData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}