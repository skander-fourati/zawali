import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface ExpensesByCategoryProps {
  data: Array<{
    category: string;
    amount: number;
    color: string; // This will now come from the database
    previousAmount?: number; // For percentage change calculation
    percentageChange?: number; // Calculated percentage change
  }>;
}

export function ExpensesByCategory({ data }: ExpensesByCategoryProps) {
  // EXPLANATION: Fallback color palette for categories without user-defined colors
  // This ensures we always have colors even if some categories don't have colors set
  const fallbackColors = [
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

  const formatPercentageChange = (change: number) => {
    const absChange = Math.abs(change);
    const sign = change >= 0 ? '+' : '-';
    return `${sign}${absChange.toFixed(1)}%`;
  };

  // Get current month name for title
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthName = lastMonth.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  // EXPLANATION: Process the data for the pie chart
  // Now we use the color from the database, or fall back to our palette if no color is set
  const processedData = data
    .map((item, index) => ({
      ...item,
      amount: Math.abs(item.amount), // Convert negative to positive
      // Use database color if available, otherwise use fallback palette
      finalColor: item.color || fallbackColors[index % fallbackColors.length]
    }))
    .filter(item => item.amount > 0) // Only show categories with actual expenses
    .sort((a, b) => b.amount - a.amount); // Sort descending (biggest first)

  // EXPLANATION: Chart config now uses the actual colors from data
  const chartConfig = processedData.reduce((config, item) => {
    config[item.category] = {
      label: item.category,
      color: item.finalColor, // Use the final resolved color
    };
    return config;
  }, {} as any);

  // EXPLANATION: Custom tooltip using the same beautiful styling as other charts, with percentage change
  const customTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    const data = payload[0].payload;
    
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-sm max-w-xs">
        <p className="font-semibold text-foreground mb-2">{data.category}</p>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center">
            <div 
              className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
              style={{ backgroundColor: data.finalColor }}
            />
            <span className="text-muted-foreground">Amount:</span>
          </div>
          <span className="font-medium text-foreground ml-2">
            {formatCurrency(data.amount)}
          </span>
        </div>
        {/* Show percentage change if available */}
        {data.percentageChange !== undefined && (
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
            <span className="text-muted-foreground text-xs">vs Previous Month:</span>
            <span className={`font-medium text-xs ml-2 ${
              data.percentageChange >= 0 
                ? 'text-destructive' // Red for increases (bad for expenses)
                : 'text-success'    // Green for decreases (good for expenses)
            }`}>
              {formatPercentageChange(data.percentageChange)}
            </span>
          </div>
        )}
      </div>
    );
  };

  // If no data, show empty state
  if (processedData.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            {monthName} Expenses by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            <p>No expense data available for {monthName}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          {monthName} Expenses by Category
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 60 }}>
              <Pie
                data={processedData}
                cx="30%" 
                cy="50%" 
                outerRadius={130} 
                fill="#8884d8" 
                dataKey="amount" 
                label={({ category, percent }) => {
                  return percent >= 0.05 ? `${category} (${(percent * 100).toFixed(0)}%)` : null;
                }}
                labelLine={true}
              >
                {/* EXPLANATION: Each slice gets its resolved color (database color or fallback) */}
                {processedData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.finalColor} /* Use the resolved color */
                  />
                ))}
              </Pie>
              <ChartTooltip content={customTooltip} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}