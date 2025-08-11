import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PerformanceBarChart } from "@/components/charts/PerformanceBarChart";
import { TrendingUp, TrendingDown, BarChart3, Building2 } from "lucide-react";

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

interface Transaction {
  id: string;
  investment_id: string | null;
  category: {
    name: string;
  } | null;
  account: {
    id: string;
    name: string;
    account_type: string;
  };
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
  transactions: Transaction[]; // Added to calculate account performance
}

export function PortfolioPerformanceChartModal({
  isOpen,
  onClose,
  investments,
  portfolioSummary,
  transactions,
}: PortfolioPerformanceChartModalProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(value);
  };

  // Calculate performance by investment type
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

  // Calculate performance by account (similar to getAccountAllocation)
  const investmentToAccountMap = new Map();
  transactions
    .filter((t) => t.investment_id && t.category?.name === "Investment")
    .forEach((t) => {
      if (
        t.investment_id &&
        t.account &&
        !investmentToAccountMap.has(t.investment_id)
      ) {
        investmentToAccountMap.set(t.investment_id, {
          id: t.account.id,
          name: t.account.name,
          account_type: t.account.account_type,
        });
      }
    });

  const performanceByAccount = investments.reduce(
    (acc: Record<string, PerformanceData>, investment) => {
      const accountInfo = investmentToAccountMap.get(investment.id);
      const accountName = accountInfo ? accountInfo.name : "Unknown Account";

      if (!acc[accountName]) {
        acc[accountName] = {
          totalInvested: 0,
          totalValue: 0,
          totalReturn: 0,
          count: 0,
        };
      }

      acc[accountName].totalInvested += Math.abs(
        investment.total_invested || 0,
      );
      acc[accountName].totalValue += investment.current_market_value || 0;
      acc[accountName].totalReturn += investment.total_return || 0;
      acc[accountName].count += 1;

      return acc;
    },
    {},
  );

  // Prepare performance chart data for asset types
  const assetTypePerformanceData = Object.entries(performanceByType)
    .map(([type, data]) => ({
      name: type,
      return: data.totalReturn,
      percentage:
        data.totalInvested > 0
          ? (data.totalReturn / data.totalInvested) * 100
          : 0,
    }))
    .filter((item) => item.return !== 0); // Only show non-zero returns

  // Prepare performance chart data for accounts
  const accountPerformanceData = Object.entries(performanceByAccount)
    .map(([account, data]) => ({
      name: account,
      return: data.totalReturn,
      percentage:
        data.totalInvested > 0
          ? (data.totalReturn / data.totalInvested) * 100
          : 0,
    }))
    .filter((item) => item.return !== 0); // Only show non-zero returns

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            📈 Portfolio Performance Analysis
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8">
          {/* 1. TOP PERFORMERS & NEEDS ATTENTION - MOVED TO TOP */}
          {investments.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top 3 Performers */}
              <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
                <CardHeader>
                  <CardTitle className="text-success flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    🏆 Top 3 Performers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {investments
                      .filter((inv) => (inv.return_percentage || 0) > 0)
                      .sort(
                        (a, b) =>
                          (b.return_percentage || 0) -
                          (a.return_percentage || 0),
                      )
                      .slice(0, 3)
                      .map((investment, index) => (
                        <div
                          key={investment.id}
                          className="flex justify-between items-center p-4 bg-success/10 rounded-lg border border-success/20"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">
                              {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                            </div>
                            <div>
                              <div className="font-bold text-lg">
                                {investment.ticker}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {investment.investment_type}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-xl text-success">
                              +{(investment.return_percentage || 0).toFixed(1)}%
                            </div>
                            <div className="text-sm text-success font-medium">
                              {formatCurrency(investment.total_return || 0)}
                            </div>
                          </div>
                        </div>
                      ))}
                    {investments.filter(
                      (inv) => (inv.return_percentage || 0) > 0,
                    ).length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <div className="text-6xl mb-4">📈</div>
                        <p className="text-lg">No profitable investments yet</p>
                        <p className="text-sm">Keep investing consistently!</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Top 3 Need Attention */}
              <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
                <CardHeader>
                  <CardTitle className="text-destructive flex items-center gap-2">
                    <TrendingDown className="h-5 w-5" />
                    📉 Need Attention (Bottom 3)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {investments
                      .filter((inv) => (inv.return_percentage || 0) < 0)
                      .sort(
                        (a, b) =>
                          (a.return_percentage || 0) -
                          (b.return_percentage || 0),
                      )
                      .slice(0, 3)
                      .map((investment, index) => (
                        <div
                          key={investment.id}
                          className="flex justify-between items-center p-4 bg-destructive/10 rounded-lg border border-destructive/20"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">
                              {index === 0 ? "⚠️" : index === 1 ? "📉" : "🔻"}
                            </div>
                            <div>
                              <div className="font-bold text-lg">
                                {investment.ticker}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {investment.investment_type}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-xl text-destructive">
                              {(investment.return_percentage || 0).toFixed(1)}%
                            </div>
                            <div className="text-sm text-destructive font-medium">
                              {formatCurrency(investment.total_return || 0)}
                            </div>
                          </div>
                        </div>
                      ))}
                    {investments.filter(
                      (inv) => (inv.return_percentage || 0) < 0,
                    ).length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <div className="text-6xl mb-4">🎉</div>
                        <p className="text-lg">All investments profitable!</p>
                        <p className="text-sm">
                          Excellent portfolio management!
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 2. PERFORMANCE CHARTS - ASSET TYPE & ACCOUNT */}
          <div className="space-y-6">
            {/* Performance by Asset Type Chart */}
            {assetTypePerformanceData.length > 0 && (
              <PerformanceBarChart
                title="Performance by Asset Type"
                data={assetTypePerformanceData}
                icon={<BarChart3 className="h-5 w-5" />}
              />
            )}

            {/* Performance by Account Chart */}
            {accountPerformanceData.length > 0 && (
              <PerformanceBarChart
                title="Performance by Account"
                data={accountPerformanceData}
                icon={<Building2 className="h-5 w-5" />}
              />
            )}
          </div>

          {/* 3. FULL BREAKDOWN TABLE - MOVED TO BOTTOM */}
          {investments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>📊 Detailed Investment Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold">Ticker</th>
                        <th className="text-left p-3 font-semibold">Type</th>
                        <th className="text-left p-3 font-semibold">Account</th>
                        <th className="text-right p-3 font-semibold">
                          Invested
                        </th>
                        <th className="text-right p-3 font-semibold">
                          Current Value
                        </th>
                        <th className="text-right p-3 font-semibold">Return</th>
                        <th className="text-right p-3 font-semibold">
                          Return %
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {investments
                        .sort(
                          (a, b) =>
                            (b.return_percentage || 0) -
                            (a.return_percentage || 0),
                        )
                        .map((investment) => {
                          const accountInfo = investmentToAccountMap.get(
                            investment.id,
                          );
                          const accountName = accountInfo
                            ? accountInfo.name
                            : "Unknown";

                          return (
                            <tr
                              key={investment.id}
                              className="border-b hover:bg-muted/30"
                            >
                              <td className="p-3 font-medium">
                                {investment.ticker}
                              </td>
                              <td className="p-3 text-sm text-muted-foreground">
                                {investment.investment_type}
                              </td>
                              <td className="p-3 text-sm text-muted-foreground">
                                {accountName}
                              </td>
                              <td className="p-3 text-right font-medium">
                                {formatCurrency(
                                  Math.abs(investment.total_invested || 0),
                                )}
                              </td>
                              <td className="p-3 text-right font-medium">
                                {formatCurrency(
                                  investment.current_market_value || 0,
                                )}
                              </td>
                              <td
                                className={`p-3 text-right font-bold ${
                                  (investment.total_return || 0) >= 0
                                    ? "text-success"
                                    : "text-destructive"
                                }`}
                              >
                                {formatCurrency(investment.total_return || 0)}
                              </td>
                              <td
                                className={`p-3 text-right font-bold text-lg ${
                                  (investment.return_percentage || 0) >= 0
                                    ? "text-success"
                                    : "text-destructive"
                                }`}
                              >
                                {(investment.return_percentage || 0) >= 0
                                  ? "+"
                                  : ""}
                                {(investment.return_percentage || 0).toFixed(1)}
                                %
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
