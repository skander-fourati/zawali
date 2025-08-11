import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface AssetAllocationChartProps {
  title: string;
  data: Array<{
    name: string;
    amount: number;
    color: string; // Now expects color from database
  }>;
}

export function AssetAllocationChart({
  title,
  data,
}: AssetAllocationChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Process the data for the pie chart
  const processedData = data
    .filter((item) => item.amount > 0) // Only show items with value
    .sort((a, b) => b.amount - a.amount) // Sort descending
    .map((item) => ({
      ...item,
      name: item.name,
      value: item.amount,
      color: item.color, // Use color from database
    }));

  // Calculate total for percentages
  const total = processedData.reduce((sum, item) => sum + item.amount, 0);

  // Chart config for colors - now uses database colors
  const chartConfig = processedData.reduce((config, item) => {
    config[item.name] = {
      label: item.name,
      color: item.color,
    };
    return config;
  }, {} as any);

  // Custom tooltip
  const customTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    const percentage = total > 0 ? (data.value / total) * 100 : 0;

    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-sm max-w-xs">
        <p className="font-semibold text-foreground mb-2">{data.name}</p>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center">
            <div
              className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
              style={{ backgroundColor: data.color }}
            />
            <span className="text-muted-foreground">Value:</span>
          </div>
          <span className="font-medium text-foreground ml-2">
            {formatCurrency(data.value)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Allocation:</span>
          <span className="font-medium text-foreground ml-2">
            {percentage.toFixed(1)}%
          </span>
        </div>
      </div>
    );
  };

  // If no data, show empty state
  if (processedData.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="text-4xl mb-4">📊</div>
              <p>No allocation data available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center">
          <ChartContainer config={chartConfig} className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={processedData}
                  cx="50%"
                  cy="50%"
                  outerRadius={140}
                  dataKey="value"
                  label={({ name, percent }) => {
                    return percent >= 0.05
                      ? `${name} (${(percent * 100).toFixed(0)}%)`
                      : null;
                  }}
                  labelLine={true}
                >
                  {processedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={customTooltip} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
