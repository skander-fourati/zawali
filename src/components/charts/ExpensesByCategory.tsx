import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface ExpensesByCategoryProps {
  data: Array<{
    category: string;
    amount: number;
    color: string;
  }>;
}

export function ExpensesByCategory({ data }: ExpensesByCategoryProps) {
  // EXPLANATION: This is the same color palette used in the stacked chart
  // We're copying it here to ensure consistent colors across both charts
  const dashboardColors = [
    'hsl(220, 85%, 65%)', // Rich blue
    'hsl(15, 80%, 65%)',  // Coral/salmon  
    'hsl(200, 75%, 65%)', // Teal blue
    'hsl(25, 75%, 65%)',  // Orange
    'hsl(190, 70%, 55%)', // Cyan
    'hsl(10, 70%, 60%)',  // Red
    'hsl(35, 80%, 60%)',  // Amber
    'hsl(160, 60%, 55%)', // Mint
    'hsl(280, 60%, 65%)', // Magenta
    'hsl(45, 85%, 60%)',  // Golden
    'hsl(120, 50%, 55%)', // Forest green
    'hsl(300, 70%, 60%)', // Pink
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(value);
  };

  // EXPLANATION: Process the data for the pie chart
  // 1. Make negative amounts positive (expenses are usually negative)
  // 2. Filter out zero amounts (no point showing empty slices)  
  // 3. Sort by amount (biggest slices first)
  // 4. Assign colors from our palette
  const processedData = data
    .map(item => ({
      ...item,
      amount: Math.abs(item.amount) // Convert negative to positive
    }))
    .filter(item => item.amount > 0) // Only show categories with actual expenses
    .sort((a, b) => b.amount - a.amount) // Sort descending (biggest first)
    .map((item, index) => ({
      ...item,
      color: dashboardColors[index % dashboardColors.length] // Assign colors in order
    }));

  // EXPLANATION: Chart config for consistent theming
  const chartConfig = processedData.reduce((config, item, index) => {
    config[item.category] = {
      label: item.category,
      color: dashboardColors[index % dashboardColors.length],
    };
    return config;
  }, {} as any);

  // EXPLANATION: Custom tooltip that matches the stacked chart style
  // This creates the popup box when you hover over pie slices
  const customTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    const data = payload[0].payload; // Get the data for the hovered slice
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm max-w-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {/* Color indicator circle - matches the slice color */}
            <div 
              className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
              style={{ backgroundColor: data.color }}
            />
            <span className="text-gray-700">{data.category}:</span>
          </div>
          <span className="font-medium text-gray-900 ml-2">
            {formatCurrency(data.amount)}
          </span>
        </div>
      </div>
    );
  };

  // EXPLANATION: Calculate total for percentage labels
  const total = processedData.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Card className="bg-gradient-card shadow-soft border-0">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Monthly Expenses by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 60 }}>
              <Pie
                data={processedData}
                cx="30%" /* Shift more to the left (was 35%) */
                cy="50%" /* Keep vertically centered */
                outerRadius={130} /* Larger size (was 100) */
                fill="#8884d8" /* Default fill (overridden by Cell colors) */
                dataKey="amount" /* Which field contains the values */
                /* Full category names with percentages and connecting lines */
                label={({ category, percent }) => {
                  return `${category} (${(percent * 100).toFixed(0)}%)`;
                }}
                labelLine={true} /* Show connecting lines to labels */
              >
                {/* EXPLANATION: Cell components set individual colors for each slice */}
                {processedData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color} /* Use our custom color */
                  />
                ))}
              </Pie>
              {/* Use our custom tooltip */}
              <ChartTooltip content={customTooltip} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}