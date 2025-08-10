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

const SavingsOverTime: React.FC<SavingsOverTimeProps> = ({ data }) => {
  const chartConfig = {
    amount: {
      label: 'Monthly Savings',
      color: 'hsl(var(--secondary))', // Hope Teal from zawali theme
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

  // Custom tooltip using the same beautiful styling as ExpensesOverTime
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    const value = payload[0].value;
    if (value === 0) return null;
    
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-sm max-w-xs">
        <p className="font-semibold text-foreground mb-2">{label}</p>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center">
            <div 
              className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
              style={{ backgroundColor: 'hsl(var(--secondary))' }}
            />
            <span className="text-muted-foreground">Savings:</span>
          </div>
          <span className="font-medium text-foreground ml-2">
            {formatCurrency(value)}
          </span>
        </div>
        {value < 0 && (
          <div className="mt-2 pt-2 border-t border-border">
            <p className="text-xs text-destructive">Overspending this month</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">Savings Over Last 12 Months</CardTitle>
        <p className="text-sm text-muted-foreground">Income minus Expenses (excluding investments)</p>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center">
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 30, right: 30, left: 20, bottom: 5 }}>
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
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
                      fill="hsl(var(--secondary))" // Hope Teal
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
                              fill={isNegative ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))"}
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
};

export default SavingsOverTime;