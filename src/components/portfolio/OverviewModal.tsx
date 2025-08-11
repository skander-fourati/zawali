import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PieChart, TrendingUp, Activity, BarChart3 } from "lucide-react";

interface OverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolioSummary: {
    totalPortfolioValue: number;
    totalInvested: number;
    totalReturn: number;
    returnPercentage: number;
    holdingsCount: number;
    lastUpdated: string | null;
  };
  assetAllocation: any[];
  investments: any[];
  onOpenAssetAllocationChart: () => void;
  onOpenPerformanceChart: () => void;
  onOpenInvestmentChart: () => void;
}

export function OverviewModal({
  isOpen,
  onClose,
  portfolioSummary,
  assetAllocation,
  investments,
  onOpenAssetAllocationChart,
  onOpenPerformanceChart,
  onOpenInvestmentChart,
}: OverviewModalProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Portfolio Overview</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Asset Allocation */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Asset Allocation
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onOpenAssetAllocationChart}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Chart
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {assetAllocation.length > 0 ? (
                  <div className="space-y-4">
                    {assetAllocation.slice(0, 5).map((allocation) => (
                      <div
                        key={allocation.investment_type}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-primary"></div>
                          <span className="text-sm">
                            {allocation.investment_type}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {formatCurrency(allocation.amount)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {allocation.percentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))}
                    {assetAllocation.length > 5 && (
                      <div className="text-center text-sm text-muted-foreground">
                        +{assetAllocation.length - 5} more types
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-center text-muted-foreground">
                    <div>
                      <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No investment data available</p>
                      <p className="text-sm">
                        Start by adding investment transactions
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Portfolio Performance */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Portfolio Performance
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onOpenPerformanceChart}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Chart
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Performance metrics */}
                  <div className="grid grid-cols-2 gap-4">
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
                        Total Return
                      </div>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold">
                        {formatCurrency(portfolioSummary.totalInvested)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Invested
                      </div>
                    </div>
                  </div>

                  {/* Performance breakdown by investment type */}
                  {investments.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium">Top Performers</h4>
                      {investments
                        .sort(
                          (a, b) =>
                            (b.return_percentage || 0) -
                            (a.return_percentage || 0),
                        )
                        .slice(0, 3)
                        .map((investment) => (
                          <div
                            key={investment.id}
                            className="flex items-center justify-between p-2 bg-muted/20 rounded"
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
                              <div
                                className={`font-medium ${(investment.return_percentage || 0) >= 0 ? "text-success" : "text-destructive"}`}
                              >
                                {(investment.return_percentage || 0) >= 0
                                  ? "+"
                                  : ""}
                                {(investment.return_percentage || 0).toFixed(1)}
                                %
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatCurrency(investment.total_return || 0)}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Investment Contributions Over Time */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Investment Contributions Over Time
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenInvestmentChart}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Chart
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center text-center text-muted-foreground">
                <div>
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Click "View Chart" to see your investment timeline</p>
                  <p className="text-sm">
                    Monthly contribution patterns and trends
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
