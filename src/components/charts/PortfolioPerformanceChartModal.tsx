import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExpensesByCategory } from "@/components/charts/ExpensesByCategory";

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

interface PortfolioPerformanceChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  investments: Investment[];
  portfolioSummary: PortfolioSummary;
}

export function PortfolioPerformanceChartModal({
  isOpen,
  onClose,
  investments,
  portfolioSummary,
}: PortfolioPerformanceChartModalProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(value);
  };

  // Performance data by investment type - Fixed TypeScript issues
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

  // Chart data for performance visualization
  const performanceChartData = typePerformanceData.map((data, index) => ({
    category: data.type,
    amount: data.totalReturn,
    color:
      data.totalReturn >= 0
        ? `hsl(142, 71%, ${45 + index * 5}%)`
        : `hsl(0, 84%, ${60 + index * 5}%)`, // Green for gains, red for losses
  }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Portfolio Performance Analysis</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overall Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-6 bg-muted/30 rounded-lg">
              <div className="text-3xl font-bold">
                {formatCurrency(portfolioSummary.totalPortfolioValue)}
              </div>
              <div className="text-sm text-muted-foreground">Current Value</div>
            </div>
            <div className="text-center p-6 bg-muted/30 rounded-lg">
              <div className="text-3xl font-bold">
                {formatCurrency(portfolioSummary.totalInvested)}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Invested
              </div>
            </div>
            <div className="text-center p-6 bg-muted/30 rounded-lg">
              <div
                className={`text-3xl font-bold ${
                  portfolioSummary.totalReturn >= 0
                    ? "text-success"
                    : "text-destructive"
                }`}
              >
                {formatCurrency(portfolioSummary.totalReturn)}
              </div>
              <div className="text-sm text-muted-foreground">Total Return</div>
            </div>
            <div className="text-center p-6 bg-muted/30 rounded-lg">
              <div
                className={`text-3xl font-bold ${
                  portfolioSummary.returnPercentage >= 0
                    ? "text-success"
                    : "text-destructive"
                }`}
              >
                {portfolioSummary.returnPercentage >= 0 ? "+" : ""}
                {portfolioSummary.returnPercentage.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Return %</div>
            </div>
          </div>

          {/* Performance by Investment Type */}
          {typePerformanceData.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Performance by Investment Type
              </h3>
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
                          <div className="text-muted-foreground">Invested</div>
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
                          <div className="text-muted-foreground">Return</div>
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
            </div>
          )}

          {/* Performance Chart */}
          {performanceChartData.length > 0 &&
            performanceChartData.some((d) => d.amount !== 0) && (
              <ExpensesByCategory data={performanceChartData} />
            )}

          {/* Individual Investment Performance */}
          {investments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Best Performers */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-success">
                  🏆 Top Performers
                </h3>
                <div className="space-y-2">
                  {investments
                    .filter((inv) => (inv.return_percentage || 0) > 0)
                    .sort(
                      (a, b) =>
                        (b.return_percentage || 0) - (a.return_percentage || 0),
                    )
                    .slice(0, 5)
                    .map((investment) => (
                      <div
                        key={investment.id}
                        className="flex justify-between items-center p-3 bg-success/10 rounded-lg"
                      >
                        <div>
                          <div className="font-medium">{investment.ticker}</div>
                          <div className="text-sm text-muted-foreground">
                            {investment.investment_type}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-success">
                            +{(investment.return_percentage || 0).toFixed(1)}%
                          </div>
                          <div className="text-sm text-success">
                            {formatCurrency(investment.total_return || 0)}
                          </div>
                        </div>
                      </div>
                    ))}
                  {investments.filter((inv) => (inv.return_percentage || 0) > 0)
                    .length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="text-2xl mb-2">📈</div>
                      <p>No profitable investments yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Underperformers */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-destructive">
                  📉 Need Attention
                </h3>
                <div className="space-y-2">
                  {investments
                    .filter((inv) => (inv.return_percentage || 0) < 0)
                    .sort(
                      (a, b) =>
                        (a.return_percentage || 0) - (b.return_percentage || 0),
                    )
                    .slice(0, 5)
                    .map((investment) => (
                      <div
                        key={investment.id}
                        className="flex justify-between items-center p-3 bg-destructive/10 rounded-lg"
                      >
                        <div>
                          <div className="font-medium">{investment.ticker}</div>
                          <div className="text-sm text-muted-foreground">
                            {investment.investment_type}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-destructive">
                            {(investment.return_percentage || 0).toFixed(1)}%
                          </div>
                          <div className="text-sm text-destructive">
                            {formatCurrency(investment.total_return || 0)}
                          </div>
                        </div>
                      </div>
                    ))}
                  {investments.filter((inv) => (inv.return_percentage || 0) < 0)
                    .length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="text-2xl mb-2">🎉</div>
                      <p>All investments are performing well!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
