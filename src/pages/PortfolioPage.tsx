import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  PieChart,
  RefreshCw,
  DollarSign,
  Activity,
  Briefcase,
  BarChart3,
  CreditCard,
  Target,
  TrendingDown,
  Lightbulb,
  Plus,
  Users,
} from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { UpdateMarketValuesModal } from "@/components/portfolio/UpdateMarketValuesModal";
import { AddEditTransactionModal } from "@/components/transactions/AddEditTransactionModal";
import { DeleteConfirmDialog } from "@/components/transactions/DeleteConfirmDialog";
import { BulkEditTransactionModal } from "@/components/transactions/BulkEditTransactionModal";
import { BulkDeleteConfirmDialog } from "@/components/transactions/BulkDeleteConfirmDialog";
import { HoldingsModal } from "@/components/portfolio/HoldingsModal";
import { TransactionsModal } from "@/components/portfolio/TransactionsModal";
import { AssetAllocationChartModal } from "@/components/charts/AssetAllocationChartModal";
import { PortfolioPerformanceChartModal } from "@/components/charts/PortfolioPerformanceChartModal";
import { InvestmentContributionsChartModal } from "@/components/charts/InvestmentContributionsChartModal";
import { AddEditHoldingModal } from "@/components/portfolio/AddEditHoldingModal";
import { DeleteHoldingConfirmDialog } from "@/components/portfolio/DeleteHoldingConfirmDialog";
import { AddExistingBalanceModal } from "@/components/portfolio/AddExistingBalanceModal";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { chartCalculations } from "@/lib/chartCalculations";

const PortfolioPage = () => {
  const { toast } = useToast();

  // Modal states
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isHoldingsModalOpen, setIsHoldingsModalOpen] = useState(false);
  const [isTransactionsModalOpen, setIsTransactionsModalOpen] = useState(false);

  // Chart modal states
  const [isAssetAllocationChartOpen, setIsAssetAllocationChartOpen] =
    useState(false);
  const [isPerformanceChartOpen, setIsPerformanceChartOpen] = useState(false);
  const [isInvestmentChartOpen, setIsInvestmentChartOpen] = useState(false);

  // Transaction management states
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [bulkSelectedIds, setBulkSelectedIds] = useState<string[]>([]);

  // Updated holding management states - now includes accountId
  const [editingHolding, setEditingHolding] = useState<any>(null);
  const [editingAccountId, setEditingAccountId] = useState<string | undefined>(
    undefined,
  );
  const [deletingHolding, setDeletingHolding] = useState<any>(null);
  const [deletingAccountId, setDeletingAccountId] = useState<
    string | undefined
  >(undefined);
  const [isAddHoldingModalOpen, setIsAddHoldingModalOpen] = useState(false);
  const [deleteHoldingLoading, setDeleteHoldingLoading] = useState(false);

  // Add Existing Balance modal state
  const [isAddExistingBalanceModalOpen, setIsAddExistingBalanceModalOpen] =
    useState(false);

  const transactionsHook = useTransactions();

  const {
    investments = [],
    transactions = [],
    categories = [],
    accounts = [],
    trips = [],
    familyMembers = [],
    loading = false,
    refetch,
    updateInvestmentMarketValue,
    getPortfolioSummary,
    getAssetAllocation,
    getInvestmentTransactions,
    getFamilyBalances,
    bulkUpdateTransactions,
    bulkDeleteTransactions,
  } = transactionsHook;

  // Try to get new functions, with fallbacks
  const getAccountAllocation = transactionsHook.getAccountAllocation;
  const getTopAccountByMarketValue =
    transactionsHook.getTopAccountByMarketValue;

  // Get investment transactions
  const investmentTransactions = getInvestmentTransactions
    ? getInvestmentTransactions()
    : [];

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

  // Temporary mock functions until you add them to useTransactions hook
  const mockGetAccountAllocation = () => [];
  const mockGetTopAccountByMarketValue = () => null;

  const assetAllocation = getAssetAllocation ? getAssetAllocation() : [];

  // Use mock functions if the real ones don't exist yet
  const accountAllocation = getAccountAllocation
    ? getAccountAllocation()
    : mockGetAccountAllocation();
  const topAccount = getTopAccountByMarketValue
    ? getTopAccountByMarketValue()
    : mockGetTopAccountByMarketValue();

  // Calculate total family balance
  const familyBalances = getFamilyBalances ? getFamilyBalances() : [];
  const totalFamilyBalance = familyBalances.reduce(
    (sum, member) => sum + member.balance,
    0,
  );

  // Use chartCalculations.getTotalInvestments for consistency
  const totalInvestmentsFromTransactions =
    chartCalculations.getTotalInvestments(transactions);

  // Calculate monthly average investment from last 12 months (with fallback)
  let monthlyAvgInvestment = 0;
  try {
    const last12MonthsInvestmentData =
      chartCalculations.getLast12MonthsInvestmentData
        ? chartCalculations.getLast12MonthsInvestmentData(transactions)
        : [];
    monthlyAvgInvestment =
      last12MonthsInvestmentData.reduce((sum, month) => sum + month.amount, 0) /
      12;
  } catch (error) {
    // Fallback calculation if function doesn't exist
    monthlyAvgInvestment = totalInvestmentsFromTransactions / 12;
  }

  // Get the latest market value update date from all investments
  const getLatestMarketValueDate = () => {
    const dates = investments
      .map((inv) => inv.market_value_updated_at)
      .filter((date) => date !== null && date !== undefined)
      .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime());
    return dates.length > 0 ? dates[0] : portfolioSummary.lastUpdated;
  };

  const latestMarketValueDate = getLatestMarketValueDate();

  // Helper functions
  const handleUpdateMarketValues = () => {
    setIsUpdateModalOpen(true);
  };

  const handleAddExistingBalance = () => {
    setIsAddExistingBalanceModalOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-GB", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(value));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Transaction management functions
  const handleAddTransaction = () => {
    setIsAddModalOpen(true);
  };

  const handleEditTransaction = (transaction: any) => {
    setEditingTransaction(transaction);
  };

  const handleDeleteTransaction = (transaction: any) => {
    setDeletingTransaction(transaction);
  };

  const handleBulkEdit = (selectedIds: string[]) => {
    setBulkSelectedIds(selectedIds);
    setIsBulkEditModalOpen(true);
  };

  const handleBulkDelete = (selectedIds: string[]) => {
    setBulkSelectedIds(selectedIds);
    setIsBulkDeleteModalOpen(true);
  };

  const handleModalSave = () => {
    refetch();
    setIsAddModalOpen(false);
    setEditingTransaction(null);
  };

  // Updated holding management functions - now handle accountId
  const handleAddHolding = () => {
    setEditingHolding(null);
    setEditingAccountId(undefined);
    setIsAddHoldingModalOpen(true);
  };

  const handleEditHolding = (holding: any, accountId?: string) => {
    setEditingHolding(holding);
    setEditingAccountId(accountId);
    setIsAddHoldingModalOpen(false); // Make sure add modal is closed
    // We'll open the edit modal in the modal render section
  };

  const handleDeleteHolding = (holding: any, accountId?: string) => {
    setDeletingHolding(holding);
    setDeletingAccountId(accountId);
  };

  const handleHoldingModalSave = () => {
    refetch();
    setIsAddHoldingModalOpen(false);
    setEditingHolding(null);
    setEditingAccountId(undefined);
  };

  const handleHoldingModalClose = () => {
    setIsAddHoldingModalOpen(false);
    setEditingHolding(null);
    setEditingAccountId(undefined);
  };

  const handleAddExistingBalanceSave = () => {
    refetch();
    setIsAddExistingBalanceModalOpen(false);
  };

  const handleDeleteHoldingConfirm = async () => {
    if (!deletingHolding) return;

    setDeleteHoldingLoading(true);

    try {
      if (deletingAccountId) {
        // Account-specific deletion: delete all transactions for this investment in this account
        const { error } = await supabase
          .from("transactions")
          .delete()
          .eq("investment_id", deletingHolding.id)
          .eq("account_id", deletingAccountId);

        if (error) throw error;

        toast({
          title: "Success",
          description: `Removed ${deletingHolding.ticker} from the selected account.`,
        });
      } else {
        // Full deletion: delete the entire investment record
        const { error } = await supabase
          .from("investments")
          .delete()
          .eq("id", deletingHolding.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: `Deleted ${deletingHolding.ticker} completely.`,
        });
      }

      refetch();
      setDeletingHolding(null);
      setDeletingAccountId(undefined);
    } catch (error) {
      console.error("Delete holding error:", error);
      toast({
        title: "Error",
        description: "Failed to delete holding.",
        variant: "destructive",
      });
    } finally {
      setDeleteHoldingLoading(false);
    }
  };

  // Handle bulk edit save
  const handleBulkEditSave = async (
    property: string,
    value: any,
    additionalData?: any,
  ) => {
    if (bulkSelectedIds.length === 0) return;

    try {
      const result = await bulkUpdateTransactions(
        bulkSelectedIds,
        property,
        value,
        additionalData,
      );

      if (result.successCount > 0) {
        toast({
          title: "Bulk Update Completed",
          description: `Successfully updated ${result.successCount} transaction${result.successCount !== 1 ? "s" : ""}.${result.failures.length > 0 ? ` ${result.failures.length} transaction${result.failures.length !== 1 ? "s" : ""} failed.` : ""}`,
        });
      }

      if (result.failures.length > 0) {
        const failedDescriptions = result.failures
          .map(
            (f) =>
              `${f.description} (${new Date(f.date).toLocaleDateString()})`,
          )
          .slice(0, 3);

        toast({
          title: "Some updates failed",
          description: `Failed to update: ${failedDescriptions.join(", ")}${result.failures.length > 3 ? ` and ${result.failures.length - 3} more...` : ""}`,
          variant: "destructive",
        });
      }

      await refetch();
      setIsBulkEditModalOpen(false);
      setBulkSelectedIds([]);
    } catch (error) {
      console.error("Bulk edit error:", error);
      toast({
        title: "Error",
        description: "Failed to perform bulk edit.",
        variant: "destructive",
      });
    }
  };

  // Handle bulk delete confirm
  const handleBulkDeleteConfirm = async () => {
    if (bulkSelectedIds.length === 0) return;

    setBulkDeleteLoading(true);

    try {
      const result = await bulkDeleteTransactions(bulkSelectedIds);

      if (result.successCount > 0) {
        toast({
          title: "Bulk Delete Completed",
          description: `Successfully deleted ${result.successCount} transaction${result.successCount !== 1 ? "s" : ""}.${result.failures.length > 0 ? ` ${result.failures.length} transaction${result.failures.length !== 1 ? "s" : ""} failed.` : ""}`,
        });
      }

      if (result.failures.length > 0) {
        const failedDescriptions = result.failures
          .map(
            (f) =>
              `${f.description} (${new Date(f.date).toLocaleDateString()})`,
          )
          .slice(0, 3);

        toast({
          title: "Some deletions failed",
          description: `Failed to delete: ${failedDescriptions.join(", ")}${result.failures.length > 3 ? ` and ${result.failures.length - 3} more...` : ""}`,
          variant: "destructive",
        });
      }

      await refetch();
      setIsBulkDeleteModalOpen(false);
      setBulkSelectedIds([]);
    } catch (error) {
      console.error("Bulk delete error:", error);
      toast({
        title: "Error",
        description: "Failed to perform bulk delete.",
        variant: "destructive",
      });
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pl-4 pr-4 py-8">
        <div className="max-w-[calc(100vw-280px)] mx-auto space-y-10">
          <div className="animate-pulse">
            <div className="h-10 bg-muted rounded w-48 mb-4"></div>
            <div className="h-6 bg-muted rounded w-96 mb-10"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-52 bg-muted rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pl-4 pr-4 py-8">
      <div className="max-w-[calc(100vw-280px)] mx-auto space-y-10">
        {/* Header */}
        <div className="flex justify-between items-start mb-10">
          <div>
            <h1 className="text-5xl font-bold text-zawali-gradient zawali-float mb-4">
              💼 Portfolio
            </h1>
            <p className="text-xl text-muted-foreground">
              Track your investment performance and asset allocation
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleAddExistingBalance}
              disabled={loading}
              className="bg-card/80 backdrop-blur-sm hover:bg-card/90 border-secondary/20 hover:border-secondary/40 transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add / Update Existing Balance
            </Button>
            <Button
              variant="outline"
              onClick={handleUpdateMarketValues}
              disabled={loading}
              className="bg-card/80 backdrop-blur-sm hover:bg-card/90 border-primary/20 hover:border-primary/40 transition-all duration-200"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Update Market Values
            </Button>
          </div>
        </div>

        {/* Portfolio Summary Cards - ZAWALI THEME: Larger, darker, more dramatic */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Total Portfolio Value */}
          <Card className="bg-gradient-to-br from-accent/20 to-accent/10 border-accent/30 shadow-2xl hover:shadow-accent/20 transition-all duration-300 hover:scale-105 zawali-slide-up min-h-[200px]">
            <CardContent className="p-10 h-full flex flex-col justify-between">
              <div className="flex items-center space-x-4 mb-6">
                <div className="p-3 bg-accent/20 rounded-full">
                  <DollarSign className="h-8 w-8 text-accent" />
                </div>
                <div className="text-base font-medium text-accent">
                  💰 Total Portfolio Value
                </div>
              </div>
              <div>
                <div className="text-4xl font-bold text-foreground mb-3">
                  {formatCurrency(portfolioSummary.totalPortfolioValue)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Last updated: {formatDate(latestMarketValueDate)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Total Invested - ZAWALI HOPE TEAL */}
          <Card className="bg-gradient-to-br from-secondary/20 to-secondary/10 border-secondary/30 shadow-2xl hover:shadow-secondary/20 transition-all duration-300 hover:scale-105 zawali-slide-up min-h-[200px]">
            <CardContent className="p-10 h-full flex flex-col justify-between">
              <div className="flex items-center space-x-4 mb-6">
                <div className="p-3 bg-secondary/20 rounded-full">
                  <Target className="h-8 w-8 text-secondary" />
                </div>
                <div className="text-base font-medium text-secondary">
                  🎯 Total Invested
                </div>
              </div>
              <div>
                <div className="text-4xl font-bold text-foreground mb-3">
                  {formatCurrency(totalInvestmentsFromTransactions)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Monthly Average: {formatCurrency(monthlyAvgInvestment)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Total Return - DYNAMIC ZAWALI COLORS */}
          <Card
            className={`${
              portfolioSummary.totalReturn >= 0
                ? "bg-gradient-to-br from-success/20 to-success/10 border-success/30 hover:shadow-success/20"
                : "bg-gradient-to-br from-primary/20 to-primary/10 border-primary/30 hover:shadow-primary/20"
            } shadow-2xl transition-all duration-300 hover:scale-105 zawali-slide-up min-h-[200px]`}
          >
            <CardContent className="p-10 h-full flex flex-col justify-between">
              <div className="flex items-center space-x-4 mb-6">
                <div
                  className={`p-3 rounded-full ${
                    portfolioSummary.totalReturn >= 0
                      ? "bg-success/20"
                      : "bg-primary/20"
                  }`}
                >
                  {portfolioSummary.totalReturn >= 0 ? (
                    <TrendingUp
                      className={`h-8 w-8 ${portfolioSummary.totalReturn >= 0 ? "text-success" : "text-primary"}`}
                    />
                  ) : (
                    <TrendingDown
                      className={`h-8 w-8 ${portfolioSummary.totalReturn >= 0 ? "text-success" : "text-primary"}`}
                    />
                  )}
                </div>
                <div
                  className={`text-base font-medium ${portfolioSummary.totalReturn >= 0 ? "text-success" : "text-primary"}`}
                >
                  {portfolioSummary.totalReturn >= 0 ? "📈" : "📉"} Total Return
                </div>
              </div>
              <div>
                <div
                  className={`text-4xl font-bold mb-3 ${portfolioSummary.totalReturn >= 0 ? "balance-positive" : "balance-negative"}`}
                >
                  {formatCurrency(portfolioSummary.totalReturn)}
                </div>
                <div className="flex items-center space-x-1">
                  <span
                    className={`text-sm ${portfolioSummary.totalReturn >= 0 ? "text-success" : "text-primary"}`}
                  >
                    ({portfolioSummary.returnPercentage >= 0 ? "+" : ""}
                    {portfolioSummary.returnPercentage.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Family Contribution - NEW CARD replacing Holdings */}
          <Card
            className={`${
              totalFamilyBalance >= 0
                ? "bg-gradient-to-br from-warning/20 to-warning/10 border-warning/30 hover:shadow-warning/20"
                : "bg-gradient-to-br from-primary/20 to-primary/10 border-primary/30 hover:shadow-primary/20"
            } shadow-2xl transition-all duration-300 hover:scale-105 zawali-slide-up min-h-[200px]`}
          >
            <CardContent className="p-10 h-full flex flex-col justify-between">
              <div className="flex items-center space-x-4 mb-6">
                <div
                  className={`p-3 rounded-full ${
                    totalFamilyBalance >= 0 ? "bg-warning/20" : "bg-primary/20"
                  }`}
                >
                  <Users
                    className={`h-8 w-8 ${totalFamilyBalance >= 0 ? "text-warning" : "text-primary"}`}
                  />
                </div>
                <div
                  className={`text-base font-medium ${totalFamilyBalance >= 0 ? "text-warning" : "text-primary"}`}
                >
                  👨‍👩‍👧‍👦 Family Contribution
                </div>
              </div>
              <div>
                <div
                  className={`text-4xl font-bold mb-3 ${totalFamilyBalance >= 0 ? "text-warning" : "balance-negative"}`}
                >
                  {formatCurrency(totalFamilyBalance)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {portfolioSummary.totalPortfolioValue > 0
                    ? `${((Math.abs(totalFamilyBalance) / portfolioSummary.totalPortfolioValue) * 100).toFixed(0)}% of current Portfolio Value`
                    : "Net family transfers"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Action Cards - Holdings and Transactions - Smaller and Centered */}
        <div className="flex justify-center mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
            <Card
              className="bg-card/80 hover:bg-card/90 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer border-secondary/20 hover:border-secondary/40 hover:scale-105 zawali-bounce min-h-[160px]"
              onClick={() => setIsHoldingsModalOpen(true)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg font-semibold text-secondary">
                  💼 Holdings
                </CardTitle>
                <Briefcase className="h-6 w-6 text-secondary" />
              </CardHeader>
              <CardContent className="pb-8">
                <div className="text-base text-muted-foreground">
                  Current investment positions and values
                </div>
              </CardContent>
            </Card>

            <Card
              className="bg-card/80 hover:bg-card/90 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer border-primary/20 hover:border-primary/40 hover:scale-105 zawali-bounce min-h-[160px]"
              onClick={() => setIsTransactionsModalOpen(true)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg font-semibold text-primary">
                  💳 Transactions
                </CardTitle>
                <CreditCard className="h-6 w-6 text-primary" />
              </CardHeader>
              <CardContent className="pb-8">
                <div className="text-base text-muted-foreground">
                  Investment transaction history
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Chart Quick Access - Full width row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card
            className="bg-gradient-to-br from-warning/10 to-warning/5 hover:from-warning/15 hover:to-warning/10 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer border-warning/20 hover:border-warning/40 hover:scale-105 zawali-float min-h-[180px]"
            onClick={() => setIsAssetAllocationChartOpen(true)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-xl font-semibold text-warning">
                📈 Asset Allocation Chart
              </CardTitle>
              <BarChart3 className="h-7 w-7 text-warning" />
            </CardHeader>
            <CardContent className="pb-8">
              <div className="text-base text-muted-foreground">
                Visual breakdown of your investment types
              </div>
            </CardContent>
          </Card>

          <Card
            className="bg-gradient-to-br from-success/10 to-success/5 hover:from-success/15 hover:to-success/10 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer border-success/20 hover:border-success/40 hover:scale-105 zawali-float min-h-[180px]"
            onClick={() => setIsPerformanceChartOpen(true)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-xl font-semibold text-success">
                🎯 Performance Chart
              </CardTitle>
              <TrendingUp className="h-7 w-7 text-success" />
            </CardHeader>
            <CardContent className="pb-8">
              <div className="text-base text-muted-foreground">
                Detailed performance analysis and metrics
              </div>
            </CardContent>
          </Card>

          <Card
            className="bg-gradient-to-br from-accent/10 to-accent/5 hover:from-accent/15 hover:to-accent/10 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer border-accent/20 hover:border-accent/40 hover:scale-105 zawali-float min-h-[180px]"
            onClick={() => setIsInvestmentChartOpen(true)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-xl font-semibold text-accent">
                📊 Investment Timeline
              </CardTitle>
              <Activity className="h-7 w-7 text-accent" />
            </CardHeader>
            <CardContent className="pb-8">
              <div className="text-base text-muted-foreground">
                Monthly contributions and investment flow
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ZAWALI WISDOM - Funny Investment Insight */}
        <Card className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-primary/20 shadow-xl mb-8 zawali-slide-up">
          <CardContent className="p-8">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-primary/20 rounded-full">
                <Lightbulb className="h-8 w-8 text-primary zawali-float" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-zawali-gradient mb-4">
                  💡 Zawali Investment Wisdom
                </h3>
                <div className="space-y-3 text-lg text-foreground/90">
                  <p>
                    <span className="font-semibold text-primary">
                      Breaking:
                    </span>{" "}
                    Bruh, Zawali and looking to invest... 🤣 This is like a
                    brokie checking their portfolio for loose change! 💰
                  </p>
                  <p>
                    {portfolioSummary.totalReturn >= 0
                      ? "Holy makloub! We actually made money! Quick, screenshot this before it disappears! 📸✨"
                      : "Congratulations, we've achieved peak zawali: losing money we didn't even have! But hey, at least we're consistent! 🏆😅"}
                  </p>
                  <p>
                    £{formatNumber(Math.abs(totalInvestmentsFromTransactions))}{" "}
                    in investments? Nar ya habibi nar! 🔥
                  </p>
                  <p className="text-sm text-muted-foreground italic">
                    The only thing growing faster than our losses is our ability
                    to pretend we know what we're doing! 📊🤡
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Updated HoldingsModal with transactions and new handlers */}
        <HoldingsModal
          isOpen={isHoldingsModalOpen}
          onClose={() => setIsHoldingsModalOpen(false)}
          investments={investments}
          transactions={transactions} // Now passing transactions for account mapping
          onAddTransaction={handleAddTransaction}
          onAddHolding={handleAddHolding}
          onEditHolding={handleEditHolding} // Now handles accountId parameter
          onDeleteHolding={handleDeleteHolding} // Now handles accountId parameter
        />

        <TransactionsModal
          isOpen={isTransactionsModalOpen}
          onClose={() => setIsTransactionsModalOpen(false)}
          investmentTransactions={investmentTransactions}
          categories={categories}
          accounts={accounts}
          trips={trips}
          familyMembers={familyMembers}
          onAddTransaction={handleAddTransaction}
          onEditTransaction={handleEditTransaction}
          onDeleteTransaction={handleDeleteTransaction}
          onBulkEdit={handleBulkEdit}
          onBulkDelete={handleBulkDelete}
        />

        {/* Chart Modals */}
        <AssetAllocationChartModal
          isOpen={isAssetAllocationChartOpen}
          onClose={() => setIsAssetAllocationChartOpen(false)}
          assetAllocation={assetAllocation}
          accountAllocation={accountAllocation}
          totalPortfolioValue={portfolioSummary.totalPortfolioValue}
          topAccount={topAccount}
        />

        <PortfolioPerformanceChartModal
          isOpen={isPerformanceChartOpen}
          onClose={() => setIsPerformanceChartOpen(false)}
          investments={investments}
          portfolioSummary={portfolioSummary}
          transactions={transactions}
        />

        <InvestmentContributionsChartModal
          isOpen={isInvestmentChartOpen}
          onClose={() => setIsInvestmentChartOpen(false)}
          investmentTransactions={investmentTransactions}
          categories={categories}
        />

        {/* Transaction Management Modals */}
        <UpdateMarketValuesModal
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
          investments={investments}
          onUpdateMarketValue={(investmentId, marketValue) => {
            // For bulk updates, we might need to handle account selection differently
            // For now, use the first account found for this investment
            const investmentAccountMapping = new Map<string, string>();
            transactions
              .filter(
                (t) => t.investment_id && t.category?.name === "Investment",
              )
              .forEach((t) => {
                if (
                  t.investment_id &&
                  t.account?.id &&
                  !investmentAccountMapping.has(t.investment_id)
                ) {
                  investmentAccountMapping.set(t.investment_id, t.account.id);
                }
              });

            const accountId = investmentAccountMapping.get(investmentId);
            if (accountId) {
              return updateInvestmentMarketValue(
                investmentId,
                marketValue,
                accountId,
              );
            } else {
              return Promise.resolve({
                success: false,
                error: new Error("No account found for this investment"),
              });
            }
          }}
        />

        <AddEditTransactionModal
          isOpen={isAddModalOpen || !!editingTransaction}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingTransaction(null);
          }}
          transaction={editingTransaction}
          onSave={handleModalSave}
          categories={categories}
          accounts={accounts}
          trips={trips}
        />

        {/* Updated AddEditHoldingModal with market value functionality */}
        <AddEditHoldingModal
          isOpen={isAddHoldingModalOpen || !!editingHolding}
          onClose={handleHoldingModalClose}
          onSave={handleHoldingModalSave}
          holding={editingHolding}
          accountId={editingAccountId} // Pass account ID for account-specific editing
          existingHoldings={investments}
          accounts={accounts} // Pass accounts for selection
          transactions={transactions} // Pass transactions for account mapping
          updateInvestmentMarketValue={(investmentId, marketValue, accountId) =>
            updateInvestmentMarketValue(investmentId, marketValue, accountId)
          } // Updated function signature
        />

        <AddExistingBalanceModal
          isOpen={isAddExistingBalanceModalOpen}
          onClose={() => setIsAddExistingBalanceModalOpen(false)}
          onSave={handleAddExistingBalanceSave}
          accounts={accounts}
          investments={investments}
        />

        <DeleteHoldingConfirmDialog
          isOpen={!!deletingHolding}
          onClose={() => {
            setDeletingHolding(null);
            setDeletingAccountId(undefined);
          }}
          onConfirm={handleDeleteHoldingConfirm}
          holding={deletingHolding}
          loading={deleteHoldingLoading}
        />

        <BulkEditTransactionModal
          isOpen={isBulkEditModalOpen}
          onClose={() => setIsBulkEditModalOpen(false)}
          onSave={handleBulkEditSave}
          selectedTransactions={investmentTransactions.filter((t) =>
            bulkSelectedIds.includes(t.id),
          )}
          categories={categories}
          accounts={accounts}
          trips={trips}
          familyMembers={familyMembers}
        />

        <BulkDeleteConfirmDialog
          isOpen={isBulkDeleteModalOpen}
          onClose={() => setIsBulkDeleteModalOpen(false)}
          onConfirm={handleBulkDeleteConfirm}
          selectedTransactions={investmentTransactions.filter((t) =>
            bulkSelectedIds.includes(t.id),
          )}
          loading={bulkDeleteLoading}
        />

        <DeleteConfirmDialog
          isOpen={!!deletingTransaction}
          onClose={() => setDeletingTransaction(null)}
          onConfirm={async () => {
            if (!deletingTransaction) return;

            try {
              const { error } = await supabase
                .from("transactions")
                .delete()
                .eq("id", deletingTransaction.id);

              if (error) throw error;

              toast({
                title: "Success",
                description: "Transaction deleted.",
              });

              refetch();
              setDeletingTransaction(null);
            } catch (error) {
              console.error("Delete error:", error);
              toast({
                title: "Error",
                description: "Failed to delete transaction.",
                variant: "destructive",
              });
            }
          }}
          transactionDescription={deletingTransaction?.description || ""}
        />
      </div>
    </div>
  );
};

export default PortfolioPage;
