import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from "lucide-react";

interface MetricsCardsProps {
  totalSavings: number;
  totalInvestments: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  lastMonthIncome: number;
  lastMonthExpenses: number;
  averageIncome12Months: number; // NEW: Add 12-month average
}

export function MetricsCards({
  totalSavings,
  totalInvestments,
  monthlyIncome,
  monthlyExpenses,
  lastMonthIncome,
  lastMonthExpenses,
  averageIncome12Months,
}: MetricsCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(amount));
  };

  // Calculate percentage change for expenses
  const expenseChange =
    lastMonthExpenses > 0
      ? ((monthlyExpenses - lastMonthExpenses) / lastMonthExpenses) * 100
      : 0;

  const formatPercentage = (percent: number) => {
    const sign = percent >= 0 ? "+" : "";
    return `${sign}${percent.toFixed(1)}%`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Savings */}
      <Card className="bg-gradient-card shadow-soft border-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Savings
          </CardTitle>
          <PiggyBank className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${totalSavings >= 0 ? "text-success" : "text-destructive"}`}
          >
            {formatCurrency(totalSavings)}
          </div>
          <p className="text-xs text-muted-foreground">Cumulative all-time</p>
        </CardContent>
      </Card>

      {/* Total Investments */}
      <Card className="bg-gradient-card shadow-soft border-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Investments
          </CardTitle>
          <Wallet className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${totalInvestments >= 0 ? "text-primary" : "text-destructive"}`}
          >
            {formatCurrency(totalInvestments)}
          </div>
          <p className="text-xs text-muted-foreground">Net invested all-time</p>
        </CardContent>
      </Card>

      {/* Last Month's Income */}
      <Card className="bg-gradient-card shadow-soft border-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Last Month Income
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">
            {formatCurrency(lastMonthIncome)}
          </div>
          <p className="text-xs text-muted-foreground">
            12mo avg: {formatCurrency(averageIncome12Months)}
          </p>
        </CardContent>
      </Card>

      {/* This Month's Expenses */}
      <Card className="bg-gradient-card shadow-soft border-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            This Month Expenses
          </CardTitle>
          <TrendingDown className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            {formatCurrency(monthlyExpenses)}
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Last month: {formatCurrency(lastMonthExpenses)}
            </span>
            <span
              className={`font-medium ${expenseChange <= 0 ? "text-success" : "text-destructive"}`}
            >
              {formatPercentage(expenseChange)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
