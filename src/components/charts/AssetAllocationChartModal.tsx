import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AssetAllocationChart } from "@/components/charts/AssetAllocationChart";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

interface AssetAllocationData {
  investment_type: string;
  amount: number;
  percentage: number;
  color: string; // Added color from database
}

interface AccountAllocationData {
  account_name: string;
  amount: number;
  percentage: number;
  color: string; // Added color from database
}

interface AssetAllocationChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetAllocation: AssetAllocationData[];
  accountAllocation: AccountAllocationData[];
  totalPortfolioValue: number;
  topAccount: { account_name: string; amount: number } | null;
}

export function AssetAllocationChartModal({
  isOpen,
  onClose,
  assetAllocation,
  accountAllocation,
  totalPortfolioValue,
  topAccount,
}: AssetAllocationChartModalProps) {
  const [selectedStrategy, setSelectedStrategy] = useState("yale-endowment");
  const [isStrategyExpanded, setIsStrategyExpanded] = useState(true);

  // Helper function to get database color for investment type
  const getInvestmentTypeColor = (investmentType: string): string => {
    const foundAllocation = assetAllocation.find(
      (a) => a.investment_type === investmentType,
    );
    return foundAllocation?.color || "hsl(var(--muted))";
  };

  // Investment Strategies Data with database colors
  const strategies = {
    "yale-endowment": {
      name: "Yale Endowment Strategy",
      description: "Diversified approach inspired by Yale's endowment model",
      allocations: [
        {
          investment_type: "Domestic Equity (US)",
          percentage: 30,
          description: "Total Stock Market",
          color: getInvestmentTypeColor("Domestic Equity (US)"),
        },
        {
          investment_type: "Treasuries (Bonds / Tips)",
          percentage: 30,
          description: "Treasury Bonds and TIPS",
          color: getInvestmentTypeColor("Treasuries (Bonds / Tips)"),
        },
        {
          investment_type: "Real Estate Equity",
          percentage: 20,
          description: "Real Estate Investment Trusts (REITs)",
          color: getInvestmentTypeColor("Real Estate Equity"),
        },
        {
          investment_type: "International Markets",
          percentage: 15,
          description: "International Stock Market",
          color: getInvestmentTypeColor("International Markets"),
        },
        {
          investment_type: "Emerging Markets",
          percentage: 5,
          description: "Emerging Markets",
          color: getInvestmentTypeColor("Emerging Markets"),
        },
      ],
    },
  };

  const currentStrategy =
    strategies[selectedStrategy as keyof typeof strategies];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Transform data for charts using database colors
  const assetTypeChartData = assetAllocation.map((allocation) => ({
    name: allocation.investment_type,
    amount: allocation.amount,
    color: allocation.color, // Use database color
  }));

  const accountChartData = accountAllocation.map((allocation) => ({
    name: allocation.account_name,
    amount: allocation.amount,
    color: allocation.color, // Use database color
  }));

  // Get largest asset type allocation
  const largestAssetType =
    assetAllocation.length > 0
      ? assetAllocation.reduce((max, current) =>
          current.percentage > max.percentage ? current : max,
        )
      : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Portfolio Asset Allocation</DialogTitle>
        </DialogHeader>

        <div className="space-y-8">
          {/* Strategy Selector */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">
                Investment Strategy:
              </label>
              <Select
                value={selectedStrategy}
                onValueChange={setSelectedStrategy}
              >
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yale-endowment">
                    Yale Endowment Strategy
                  </SelectItem>
                  {/* Placeholder for future strategies */}
                  <SelectItem value="custom" disabled>
                    <span className="text-muted-foreground">
                      Custom Strategy (Coming Soon)
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Strategy Description - Collapsible */}
            <div className="bg-muted/20 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Target</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsStrategyExpanded(!isStrategyExpanded)}
                  className="h-8 px-2"
                >
                  {isStrategyExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {isStrategyExpanded && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-3">
                  {currentStrategy.allocations.map((allocation, index) => (
                    <div
                      key={allocation.investment_type}
                      className="flex flex-col items-center p-3 bg-background/50 rounded-md"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: allocation.color,
                          }}
                        />
                        <div className="text-lg font-bold">
                          {allocation.percentage}%
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium">
                          {allocation.investment_type}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {assetAllocation.length > 0 || accountAllocation.length > 0 ? (
            <>
              {/* Current Portfolio Summary Stats */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Current Portfolio</Badge>
                  <h3 className="text-lg font-semibold">
                    Your Portfolio Overview
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-6 bg-muted/30 rounded-lg">
                    <div className="text-3xl font-bold">
                      {formatCurrency(totalPortfolioValue)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Portfolio Value
                    </div>
                  </div>

                  <div className="text-center p-6 bg-muted/30 rounded-lg">
                    <div className="text-3xl font-bold">
                      {topAccount?.account_name || "N/A"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Largest Account
                    </div>
                    {topAccount && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatCurrency(topAccount.amount)}
                      </div>
                    )}
                  </div>

                  <div className="text-center p-6 bg-muted/30 rounded-lg">
                    <div className="text-3xl font-bold">
                      {largestAssetType?.investment_type || "N/A"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Largest Asset Type
                    </div>
                    {largestAssetType && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {largestAssetType.percentage.toFixed(1)}% of portfolio
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Asset Type Allocation */}
              {assetTypeChartData.length > 0 && (
                <div className="space-y-6">
                  <AssetAllocationChart
                    title="Current Allocation by Asset Type"
                    data={assetTypeChartData}
                  />

                  {/* Asset Type Breakdown */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      Asset Type Breakdown
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {assetAllocation
                        .sort((a, b) => b.amount - a.amount)
                        .map((allocation) => (
                          <div
                            key={allocation.investment_type}
                            className="flex items-center justify-between p-4 bg-muted/20 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{
                                  backgroundColor: allocation.color, // Use database color
                                }}
                              />
                              <div>
                                <div className="font-medium">
                                  {allocation.investment_type}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {allocation.percentage.toFixed(1)}% of
                                  portfolio
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">
                                {formatCurrency(allocation.amount)}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Divider */}
              {assetTypeChartData.length > 0 && accountChartData.length > 0 && (
                <Separator className="my-8" />
              )}

              {/* Account Allocation */}
              {accountChartData.length > 0 && (
                <div className="space-y-6">
                  <AssetAllocationChart
                    title="Current Allocation by Account"
                    data={accountChartData}
                  />

                  {/* Account Breakdown */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Account Breakdown</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {accountAllocation
                        .sort((a, b) => b.amount - a.amount)
                        .map((allocation) => (
                          <div
                            key={allocation.account_name}
                            className="flex items-center justify-between p-4 bg-muted/20 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{
                                  backgroundColor: allocation.color, // Use database color
                                }}
                              />
                              <div>
                                <div className="font-medium">
                                  {allocation.account_name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {allocation.percentage.toFixed(1)}% of
                                  portfolio
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">
                                {formatCurrency(allocation.amount)}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-center text-muted-foreground">
              <div>
                <div className="text-4xl mb-4">📊</div>
                <p className="text-lg font-medium">
                  No current allocation data available
                </p>
                <p className="text-sm">
                  Start by adding investment transactions to see your portfolio
                  allocation compared to your target strategy
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
