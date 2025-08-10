import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LabelList,
} from "recharts";

interface ExpensesOverTimeProps {
  data: Array<{
    month: string;
    amount: number;
    categories: Record<string, number>;
  }>;
  categoryColors?: Record<string, string>; // NEW: Add category colors from database
}

export function ExpensesOverTime({
  data,
  categoryColors = {},
}: ExpensesOverTimeProps) {
  // Sort data by date (most recent on the right)
  const sortedData = [...data].sort((a, b) => {
    const parseMonth = (monthStr: string) => {
      try {
        return new Date(monthStr + " 1");
      } catch {
        return new Date();
      }
    };
    return parseMonth(a.month).getTime() - parseMonth(b.month).getTime();
  });

  // Extract all unique categories and calculate their totals for sorting
  const categoryTotals = new Map<string, number>();

  sortedData.forEach((monthData) => {
    if (monthData.categories) {
      Object.entries(monthData.categories).forEach(([category, amount]) => {
        const currentTotal = categoryTotals.get(category) || 0;
        categoryTotals.set(category, currentTotal + Math.abs(amount));
      });
    }
  });

  // Sort categories by total amount (highest first)
  const categoryArray = Array.from(categoryTotals.entries())
    .sort(([, a], [, b]) => b - a)
    .map(([category]) => category);

  // EXPLANATION: Fallback color palette for categories without user-defined colors
  const fallbackColors = [
    "hsl(220, 85%, 65%)", // Rich blue
    "hsl(15, 80%, 65%)", // Coral/salmon
    "hsl(200, 75%, 65%)", // Teal blue
    "hsl(25, 75%, 65%)", // Orange
    "hsl(190, 70%, 55%)", // Cyan
    "hsl(10, 70%, 60%)", // Red
    "hsl(35, 80%, 60%)", // Amber
    "hsl(160, 60%, 55%)", // Mint
    "hsl(280, 60%, 65%)", // Magenta
    "hsl(45, 85%, 60%)", // Golden
    "hsl(120, 50%, 55%)", // Forest green
    "hsl(300, 70%, 60%)", // Pink
  ];

  // EXPLANATION: Create chart configuration that uses database colors with fallbacks
  const chartConfig = categoryArray.reduce((config, category, index) => {
    // Use database color if available, otherwise use fallback palette
    const finalColor =
      categoryColors[category] || fallbackColors[index % fallbackColors.length];

    config[category] = {
      label: category,
      color: finalColor,
    };
    return config;
  }, {} as any);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(value));
  };

  // Process data for the stacked chart AND calculate totals for labels
  const processedData = sortedData.map((monthData) => {
    const monthEntry: any = {
      month: monthData.month,
    };

    // Add each category and calculate total
    let monthTotal = 0;
    categoryArray.forEach((category) => {
      const categoryAmount = monthData.categories?.[category] || 0;
      const positiveAmount = Math.abs(categoryAmount);
      monthEntry[category] = positiveAmount;
      monthTotal += positiveAmount;
    });

    // Add total for LabelList to use
    monthEntry.totalAmount = monthTotal;

    return monthEntry;
  });

  // EXPLANATION: Custom tooltip using dark theme but keeping the nice styling
  const customTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    // Filter out zero values and the totalAmount field, then sort ASCENDING
    const sortedPayload = payload
      .filter((p: any) => p.value > 0 && p.dataKey !== "totalAmount")
      .sort((a: any, b: any) => a.value - b.value);

    if (sortedPayload.length === 0) return null;

    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-sm max-w-xs">
        <p className="font-semibold text-foreground mb-2">{label}</p>
        {sortedPayload.map((p: any, index: number) => {
          // Get the resolved color for this category
          const categoryColor =
            chartConfig[p.dataKey]?.color || fallbackColors[0];

          return (
            <div key={index} className="flex items-center justify-between mb-1">
              <div className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                  style={{ backgroundColor: categoryColor }}
                />
                <span className="text-muted-foreground">{p.dataKey}:</span>
              </div>
              <span className="font-medium text-foreground ml-2">
                {formatCurrency(p.value)}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // If no data, show empty state
  if (processedData.length === 0 || categoryArray.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Expenses Over Last 12 Months by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            <p>No expense data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Expenses Over Last 12 Months by Category
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center">
          <ChartContainer config={chartConfig} className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={processedData}
                margin={{ top: 50, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={formatCurrency}
                />

                <ChartTooltip content={customTooltip} />

                {/* EXPLANATION: Create stacked bars using resolved colors from chartConfig */}
                {categoryArray.map((category, index) => {
                  const isTopBar = index === categoryArray.length - 1;
                  const categoryColor =
                    chartConfig[category]?.color || fallbackColors[0];

                  return (
                    <Bar
                      key={category}
                      dataKey={category}
                      stackId="expenses"
                      fill={categoryColor} /* Use resolved color */
                      radius={isTopBar ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                    >
                      {/* Add monthly totals ONLY to the topmost bar */}
                      {isTopBar && (
                        <LabelList
                          dataKey="totalAmount"
                          position="top"
                          formatter={(value: number) =>
                            value > 0
                              ? `£${Math.round(value).toLocaleString("en-GB")}`
                              : ""
                          }
                          fontSize={12}
                          fill="hsl(var(--muted-foreground))"
                        />
                      )}
                    </Bar>
                  );
                })}
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
