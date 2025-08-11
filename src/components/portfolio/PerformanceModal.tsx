import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Calendar } from "lucide-react";

interface Investment {
  id: string;
  ticker: string;
  investment_type: string;
  total_invested: number;
  current_market_value: number;
  total_return: number;
  return_percentage: number;
}

interface PortfolioSummary {
  totalPortfolioValue: number;
  totalInvested: number;
  totalReturn: number;
  returnPercentage: number;
  holdingsCount: number;
  lastUpdated: string | null;
}

interface PerformanceData {
  totalInvested: number;
  totalValue: number;
  totalReturn: number;
  count: number;
}

interface PerformanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  investments: Investment[];
  portfolioSummary: PortfolioSummary;
}

export function PerformanceModal({
  isOpen,
  onClose,
  investments,
  portfolioSummary,
}: PerformanceModalProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(value);
  };

  // Calculate performance by investment type - Fixed TypeScript issues
  const performanceByType = investments.reduce(
    (acc: Record<string, PerformanceData>, investment) => {
      const type = investment.investment_type || "Unknown";
      if (!acc[type]) {
        acc[type] = {
          totalInvested: 0,
          totalValue: 0,
          totalReturn: 0,
          count: 0,
        };
      }

      acc[type].totalInvested += Math.abs(investment.total_invested || 0);
      acc[type].totalValue += investment.current_market_value || 0;
      acc[type].totalReturn += investment.total_return || 0;
      acc[type].count += 1;

      return acc;
    },
    {},
  );

  const typePerformanceData = Object.entries(performanceByType).map(
    ([type, data]) => ({
      type,
      totalInvested: data.totalInvested,
      totalValue: data.totalValue,
      totalReturn: data.totalReturn,
      count: data.count,
      returnPercentage:
        data.totalInvested > 0
          ? (data.totalReturn / data.totalInvested) * 100
          : 0,
    }),
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Portfolio Performance</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Investment Type Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance by Investment Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                {typePerformanceData.length > 0 ? (
                  <div className="space-y-4">
                    {typePerformanceData
                      .sort((a, b) => b.returnPercentage - a.returnPercentage)
                      .map((data) => (
                        <div key={data.type} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium">{data.type}</h4>
                            <div
                              className={`text-lg font-bold ${
                                data.returnPercentage >= 0
                                  ? "text-success"
                                  : "text-destructive"
                              }`}
                            >
                              {data.returnPercentage >= 0 ? "+" : ""}
                              {data.returnPercentage.toFixed(1)}%
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <div className="text-muted-foreground">
                                Invested
                              </div>
                              <div className="font-medium">
                                {formatCurrency(data.totalInvested)}
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Value</div>
                              <div className="font-medium">
                                {formatCurrency(data.totalValue)}
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">
                                Return
                              </div>
                              <div
                                className={`font-medium ${
                                  data.totalReturn >= 0
                                    ? "text-success"
                                    : "text-destructive"
                                }`}
                              >
                                {formatCurrency(data.totalReturn)}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground mt-2">
                            {data.count} position{data.count !== 1 ? "s" : ""}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-center text-muted-foreground">
                    <div>
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No performance data available</p>
                      <p className="text-sm">
                        Add investments and market values to see performance
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Overall Portfolio Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Portfolio Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <div className="text-3xl font-bold">
                        {formatCurrency(portfolioSummary.totalPortfolioValue)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Current Value
                      </div>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <div className="text-3xl font-bold">
                        {formatCurrency(portfolioSummary.totalInvested)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Invested
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <div
                        className={`text-2xl font-bold ${
                          portfolioSummary.totalReturn >= 0
                            ? "text-success"
                            : "text-destructive"
                        }`}
                      >
                        {formatCurrency(portfolioSummary.totalReturn)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Return
                      </div>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <div
                        className={`text-2xl font-bold ${
                          portfolioSummary.returnPercentage >= 0
                            ? "text-success"
                            : "text-destructive"
                        }`}
                      >
                        {portfolioSummary.returnPercentage >= 0 ? "+" : ""}
                        {portfolioSummary.returnPercentage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Return %
                      </div>
                    </div>
                  </div>

                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <div className="text-3xl font-bold">
                      {portfolioSummary.holdingsCount}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Investment Positions
                    </div>
                  </div>

                  {/* Best and Worst Performers */}
                  {investments.length > 0 && (
                    <div className="space-y-4">
                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-2 text-success">
                          🏆 Best Performer
                        </h4>
                        {investments
                          .sort(
                            (a, b) =>
                              (b.return_percentage || 0) -
                              (a.return_percentage || 0),
                          )
                          .slice(0, 1)
                          .map((investment) => (
                            <div
                              key={investment.id}
                              className="flex justify-between p-2 bg-success/10 rounded"
                            >
                              <div>
                                <div className="font-medium">
                                  {investment.ticker}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {investment.investment_type}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-success">
                                  +
                                  {(investment.return_percentage || 0).toFixed(
                                    1,
                                  )}
                                  %
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {formatCurrency(investment.total_return || 0)}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>

                      {investments.some(
                        (inv) => (inv.return_percentage || 0) < 0,
                      ) && (
                        <div>
                          <h4 className="font-medium mb-2 text-destructive">
                            📉 Needs Attention
                          </h4>
                          {investments
                            .filter((inv) => (inv.return_percentage || 0) < 0)
                            .sort(
                              (a, b) =>
                                (a.return_percentage || 0) -
                                (b.return_percentage || 0),
                            )
                            .slice(0, 1)
                            .map((investment) => (
                              <div
                                key={investment.id}
                                className="flex justify-between p-2 bg-destructive/10 rounded"
                              >
                                <div>
                                  <div className="font-medium">
                                    {investment.ticker}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {investment.investment_type}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-destructive">
                                    {(
                                      investment.return_percentage || 0
                                    ).toFixed(1)}
                                    %
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {formatCurrency(
                                      investment.total_return || 0,
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
