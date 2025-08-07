import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LabelList } from 'recharts';

interface ExpensesOverTimeProps {
  data: Array<{
    month: string;
    amount: number;
    categories: Record<string, number>;
  }>;
}

export function ExpensesOverTime({ data }: ExpensesOverTimeProps) {
  // Sort data by date (most recent on the right)
  const sortedData = [...data].sort((a, b) => {
    const parseMonth = (monthStr: string) => {
      try {
        return new Date(monthStr + ' 1');
      } catch {
        return new Date();
      }
    };
    return parseMonth(a.month).getTime() - parseMonth(b.month).getTime();
  });

  // Extract all unique categories and calculate their totals for sorting
  const categoryTotals = new Map<string, number>();
  
  sortedData.forEach(monthData => {
    if (monthData.categories) {
      Object.entries(monthData.categories).forEach(([category, amount]) => {
        const currentTotal = categoryTotals.get(category) || 0;
        categoryTotals.set(category, currentTotal + Math.abs(amount));
      });
    }
  });
  
  // Sort categories by total amount (highest first) - this puts biggest segments at bottom of stack
  const categoryArray = Array.from(categoryTotals.entries())
    .sort(([, a], [, b]) => b - a) // Sort by total amount, descending
    .map(([category]) => category);
  
  // EXPANDED COLOR PALETTE: Ensure no duplicates with enough unique colors
  const dashboardColors = [
    'hsl(220, 85%, 65%)', // Rich blue
    'hsl(15, 80%, 65%)',  // Coral/salmon  
    'hsl(200, 75%, 65%)', // Teal blue
    'hsl(25, 75%, 65%)',  // Orange
    'hsl(190, 70%, 55%)', // Cyan
    'hsl(10, 70%, 60%)',  // Red
    'hsl(35, 80%, 60%)',  // Amber
    'hsl(160, 60%, 55%)', // Mint
    'hsl(280, 60%, 65%)', // Magenta (different from investment purple)
    'hsl(45, 85%, 60%)',  // Golden (different from savings yellow)
    'hsl(120, 50%, 55%)', // Forest green (different from income green)
    'hsl(300, 70%, 60%)', // Pink
  ];

  // Create chart configuration for each category
  const chartConfig = categoryArray.reduce((config, category, index) => {
    config[category] = {
      label: category,
      color: dashboardColors[index % dashboardColors.length],
    };
    return config;
  }, {} as any);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(value);
  };

  // Process data for the stacked chart AND calculate totals for labels
  const processedData = sortedData.map(monthData => {
    const monthEntry: any = {
      month: monthData.month,
    };
    
    // Add each category and calculate total
    let monthTotal = 0;
    categoryArray.forEach(category => {
      const categoryAmount = monthData.categories?.[category] || 0;
      const positiveAmount = Math.abs(categoryAmount);
      monthEntry[category] = positiveAmount;
      monthTotal += positiveAmount;
    });
    
    // Add total for LabelList to use
    monthEntry.totalAmount = monthTotal;
    
    return monthEntry;
  });

  // TOOLTIP: Categories in ASCENDING order (lowest to highest, so highest is at bottom)
  const customTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    // Filter out zero values and the totalAmount field, then sort ASCENDING (lowest first)
    const sortedPayload = payload
      .filter((p: any) => p.value > 0 && p.dataKey !== 'totalAmount')
      .sort((a: any, b: any) => a.value - b.value); // ASCENDING: smallest first, largest last (at bottom)
    
    if (sortedPayload.length === 0) return null;
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm max-w-xs">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        {sortedPayload.map((p: any, index: number) => (
          <div key={index} className="flex items-center justify-between mb-1">
            <div className="flex items-center">
              {/* Color indicator circle */}
              <div 
                className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                style={{ backgroundColor: p.fill }}
              />
              <span className="text-gray-700">{p.dataKey}:</span>
            </div>
            <span className="font-medium text-gray-900 ml-2">
              {formatCurrency(p.value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="bg-gradient-card shadow-soft border-0">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Expenses Over Last 12 Months by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={processedData} 
              margin={{ top: 50, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={formatCurrency}
              />
              
              {/* Custom tooltip - categories in ascending order */}
              <ChartTooltip content={customTooltip} />
              
              {/* Create stacked bars for each category */}
              {categoryArray.map((category, index) => {
                const isTopBar = index === categoryArray.length - 1;
                return (
                  <Bar 
                    key={category}
                    dataKey={category} 
                    stackId="expenses"
                    fill={dashboardColors[index % dashboardColors.length]}
                    radius={isTopBar ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  >
                    {/* Add monthly totals ONLY to the topmost bar */}
                    {isTopBar && (
                      <LabelList
                        dataKey="totalAmount"
                        position="top"
                        formatter={(value: number) => value > 0 ? `£${value.toLocaleString('en-GB', { maximumFractionDigits: 0 })}` : ''}
                        fontSize={12}
                        fill="#666"
                      />
                    )}
                  </Bar>
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}