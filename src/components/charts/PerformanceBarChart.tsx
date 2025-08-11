import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PerformanceData {
  name: string;
  return: number;
  percentage: number;
}

interface PerformanceBarChartProps {
  title: string;
  data: PerformanceData[];
  icon?: React.ReactNode;
}

export function PerformanceBarChart({
  title,
  data,
  icon,
}: PerformanceBarChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Sort data by return value (highest to lowest)
  const sortedData = [...data].sort((a, b) => b.return - a.return);

  // If no data, show empty state
  if (sortedData.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="text-4xl mb-4">📊</div>
              <p>No performance data available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Find the max absolute value for scaling
  const maxAbsValue = Math.max(...sortedData.map((d) => Math.abs(d.return)));

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedData.map((item, index) => {
            const isPositive = item.return >= 0;
            const barWidthPercent =
              maxAbsValue > 0 ? (Math.abs(item.return) / maxAbsValue) * 100 : 0;

            return (
              <div key={index} className="space-y-1">
                {/* Name and Value Row */}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
                    {item.name}
                  </span>
                  <div className="text-right">
                    <div
                      className={`text-sm font-bold ${isPositive ? "text-green-500" : "text-red-500"}`}
                    >
                      {formatCurrency(item.return)}
                    </div>
                    <div
                      className={`text-xs ${isPositive ? "text-green-400" : "text-red-400"}`}
                    >
                      {isPositive ? "+" : ""}
                      {item.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Bar Row */}
                <div className="w-full bg-muted/20 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isPositive ? "bg-green-500" : "bg-red-500"
                    }`}
                    style={{ width: `${Math.max(barWidthPercent, 2)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-muted-foreground">Positive Return</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-muted-foreground">Negative Return</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
