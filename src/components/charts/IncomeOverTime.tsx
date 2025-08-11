import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LabelList,
} from "recharts";

interface IncomeOverTimeProps {
  data: Array<{
    month: string;
    amount: number;
  }>;
  categoryColors?: Record<string, string>; // NEW: Add category colors
}

export function IncomeOverTime({
  data,
  categoryColors = {},
}: IncomeOverTimeProps) {
  // Use Income category color if available, otherwise use zawali success color
  const incomeColor = categoryColors["Income"] || "hsl(142 71% 45%)";

  const chartConfig = {
    amount: {
      label: "Monthly Income",
      color: incomeColor,
    },
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(value));
  };

  // Custom tooltip using the same nice styling as ExpensesOverTime but adapted for single values
  const customTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const value = payload[0].value;
    if (value <= 0) return null;

    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-sm max-w-xs">
        <p className="font-semibold text-foreground mb-2">{label}</p>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center">
            <div
              className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
              style={{ backgroundColor: incomeColor }}
            />
            <span className="text-muted-foreground">Income:</span>
          </div>
          <span className="font-medium text-foreground ml-2">
            {formatCurrency(value)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Income Over Last 12 Months
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center">
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 30, right: 30, left: 20, bottom: 5 }}
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
                <Bar dataKey="amount" fill={incomeColor} radius={[4, 4, 0, 0]}>
                  {/* Add total labels on top of bars - only show if amount > 0 */}
                  <LabelList
                    dataKey="amount"
                    position="top"
                    formatter={(value: number) =>
                      value > 0 ? formatCurrency(value) : ""
                    }
                    fontSize={12}
                    fill="hsl(var(--muted-foreground))"
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
