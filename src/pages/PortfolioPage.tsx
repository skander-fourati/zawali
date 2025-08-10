import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  PieChart,
  LineChart,
  RefreshCw,
  Calendar,
  DollarSign,
  Activity,
  Briefcase,
} from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { UpdateMarketValuesModal } from "@/components/portfolio/UpdateMarketValuesModal";

const PortfolioPage = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  const {
    investments = [],
    loading = false,
    updateInvestmentMarketValue,
    getPortfolioSummary,
    getAssetAllocation,
    getInvestmentTransactions,
  } = useTransactions();

  // Provide fallback functions if they don't exist
  const portfolioSummary = getPortfolioSummary
    ? getPortfolioSummary()
    : {
        totalPortfolioValue: 0,
        totalInvested: 0,
        totalReturn: 0,
        returnPercentage: 0,
        holdingsCount: 0,
        lastUpdated: null,
      };

  const assetAllocation = getAssetAllocation ? getAssetAllocation() : [];
  const investmentTransactions = getInvestmentTransactions
    ? getInvestmentTransactions()
    : [];

  const handleUpdateMarketValues = () => {
    setIsUpdateModalOpen(true);
  };

  const handleCloseUpdateModal = () => {
    setIsUpdateModalOpen(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-2"></div>
          <div className="h-4 bg-muted rounded w-96 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Portfolio</h1>
          <p className="text-muted-foreground mt-1">
            Track your investment performance and asset allocation
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleUpdateMarketValues}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Update Market Values
          </Button>
        </div>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm font-medium text-muted-foreground">
                Total Portfolio Value
              </div>
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(portfolioSummary.totalPortfolioValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Last updated: {formatDate(portfolioSummary.lastUpdated)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm font-medium text-muted-foreground">
                Total Invested
              </div>
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(portfolioSummary.totalInvested)}
            </div>
            <p className="text-xs text-muted-foreground">
              From all transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm font-medium text-muted-foreground">
                Total Return
              </div>
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(portfolioSummary.totalReturn)}
            </div>
            <div className="flex items-center space-x-1">
              <span
                className={`text-xs ${
                  portfolioSummary.returnPercentage >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                ({portfolioSummary.returnPercentage >= 0 ? "+" : ""}
                {portfolioSummary.returnPercentage.toFixed(2)}%)
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <PieChart className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm font-medium text-muted-foreground">
                Holdings
              </div>
            </div>
            <div className="text-2xl font-bold">
              {portfolioSummary.holdingsCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Investment positions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Asset Allocation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Asset Allocation
                </CardTitle>
              </CardHeader>
              <CardContent>
                {assetAllocation.length > 0 ? (
                  <div className="space-y-4">
                    {assetAllocation.map((allocation) => (
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
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-center text-muted-foreground">
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

            {/* Portfolio Value Over Time Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Portfolio Value Over Time
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[400px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <LineChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Chart implementation coming soon</p>
                  <p className="text-sm">
                    Market value history will appear here
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Investments Over Time Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Investment Contributions Over Time</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Chart implementation coming soon</p>
                <p className="text-sm">
                  Your investment contributions will be tracked here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Holdings Tab */}
        <TabsContent value="holdings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Holdings</CardTitle>
              <p className="text-sm text-muted-foreground">
                Your investment positions with current values and performance
              </p>
            </CardHeader>
            <CardContent>
              {investments.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-7 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
                    <div>Ticker</div>
                    <div>Type</div>
                    <div>Market Value</div>
                    <div>Invested</div>
                    <div>Return</div>
                    <div>Return %</div>
                    <div>Last Updated</div>
                  </div>
                  {investments.map((investment) => (
                    <div
                      key={investment.id}
                      className="grid grid-cols-7 gap-4 text-sm py-2 hover:bg-muted/50 rounded"
                    >
                      <div className="font-medium">{investment.ticker}</div>
                      <div>
                        <Badge variant="secondary" className="text-xs">
                          {investment.investment_type}
                        </Badge>
                      </div>
                      <div className="font-medium">
                        {investment.current_market_value
                          ? formatCurrency(investment.current_market_value)
                          : "Not set"}
                      </div>
                      <div>
                        {formatCurrency(
                          Math.abs(investment.total_invested || 0),
                        )}
                      </div>
                      <div
                        className={
                          (investment.total_return || 0) >= 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }
                      >
                        {formatCurrency(investment.total_return || 0)}
                      </div>
                      <div
                        className={
                          (investment.return_percentage || 0) >= 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }
                      >
                        {(investment.return_percentage || 0) >= 0 ? "+" : ""}
                        {(investment.return_percentage || 0).toFixed(2)}%
                      </div>
                      <div className="text-muted-foreground">
                        {formatDate(investment.market_value_updated_at || null)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No holdings to display</p>
                  <p className="text-sm">
                    Add investment transactions to see your holdings
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Investment Type Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Performance by Investment Type</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Chart implementation coming soon</p>
                  <p className="text-sm">
                    Performance tracking will appear here
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Market Value Updates Scatter Plot */}
            <Card>
              <CardHeader>
                <CardTitle>Market Value Updates</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Chart implementation coming soon</p>
                  <p className="text-sm">
                    Market value trends will appear here
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Investment Transactions</CardTitle>
              <p className="text-sm text-muted-foreground">
                All transactions categorized as investments
              </p>
            </CardHeader>
            <CardContent>
              {investmentTransactions.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-6 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
                    <div>Date</div>
                    <div>Description</div>
                    <div>Ticker</div>
                    <div>Type</div>
                    <div>Amount</div>
                    <div>Account</div>
                  </div>
                  {investmentTransactions.slice(0, 20).map((transaction) => (
                    <div
                      key={transaction.id}
                      className="grid grid-cols-6 gap-4 text-sm py-2 hover:bg-muted/50 rounded"
                    >
                      <div>
                        {new Date(transaction.date).toLocaleDateString("en-GB")}
                      </div>
                      <div className="truncate" title={transaction.description}>
                        {transaction.description}
                      </div>
                      <div className="font-medium">
                        {transaction.investment?.ticker || "N/A"}
                      </div>
                      <div>
                        <Badge variant="outline" className="text-xs">
                          {transaction.investment?.investment_type || "N/A"}
                        </Badge>
                      </div>
                      <div
                        className={
                          transaction.amount_gbp >= 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }
                      >
                        {formatCurrency(transaction.amount_gbp)}
                      </div>
                      <div className="text-muted-foreground">
                        {transaction.account.name}
                      </div>
                    </div>
                  ))}
                  {investmentTransactions.length > 20 && (
                    <p className="text-sm text-muted-foreground text-center pt-4">
                      Showing 20 of {investmentTransactions.length} transactions
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No investment transactions found</p>
                  <p className="text-sm">
                    Transactions with "Investment" category will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Update Market Values Modal */}
      <UpdateMarketValuesModal
        isOpen={isUpdateModalOpen}
        onClose={handleCloseUpdateModal}
        investments={investments}
        onUpdateMarketValue={updateInvestmentMarketValue}
      />
    </div>
  );
};

export default PortfolioPage;
