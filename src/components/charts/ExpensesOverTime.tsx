import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend } from 'recharts';

interface ExpensesOverTimeProps {
  data: Array<{
    month: string;
    amount: number;
    categories: Record<string, number>; // This contains category breakdowns
  }>;
}

export function ExpensesOverTime({ data }: ExpensesOverTimeProps) {
  // Extract all unique categories from the data
  const allCategories = new Set<string>();
  data.forEach(monthData => {
    Object.keys(monthData.categories).forEach(category => {
      allCategories.add(category);
    });
  });
  
  const categoryArray = Array.from(allCategories);
  
  // Colors for different categories - you can customize these
  const categoryColors = [
    'hsl(220, 70%, 50%)', // Blue
    'hsl(10, 70%, 50%)',  // Red
    'hsl(120, 70%, 50%)', // Green
    'hsl(40, 70%, 50%)',  // Orange
    'hsl(280, 70%, 50%)', // Purple
    'hsl(180, 70%, 50%)', // Teal
    'hsl(350, 70%, 50%)', // Pink
    'hsl(60, 70%, 50%)',  // Yellow
  ];

  // Create chart configuration for each category
  const chartConfig = categoryArray.reduce((config, category, index) => {
    config[category] = {
      label: category,
      color: categoryColors[index % categoryColors.length],
    };
    return config;
  }, {} as any);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(value);
  };

  // FIXED: Process data to show positive amounts and format for stacked chart
  const processedData = data.map(monthData => {
    const monthEntry: any = {
      month: monthData.month,
    };
    
    // Add each category as a separate property for stacking
    categoryArray.forEach(category => {
      const categoryAmount = monthData.categories[category] || 0;
      // Make negative amounts positive for display
      monthEntry[category] = Math.abs(categoryAmount);
    });
    
    return monthEntry;
  });

  return (
    <Card className="bg-gradient-card shadow-soft border-0">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Expenses Over Last 12 Months by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px]">
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
                formatter={(value: number) => [formatCurrency(value), '']}
              />
              <Legend />
              
              {/* Create a Bar component for each category to make them stack */}
              {categoryArray.map((category, index) => (
                <Bar 
                  key={category}
                  dataKey={category} 
                  stackId="expenses" // This makes bars stack on top of each other
                  fill={categoryColors[index % categoryColors.length]}
                  radius={index === categoryArray.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}