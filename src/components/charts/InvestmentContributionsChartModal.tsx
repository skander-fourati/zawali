import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InvestmentsOverTime } from "@/components/charts/InvestmentsOverTime";

interface InvestmentTransaction {
  id: string;
  date: string;
  amount_gbp: number;
  description: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

interface InvestmentContributionsChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  investmentTransactions: InvestmentTransaction[];
  categories: Category[];
}

export function InvestmentContributionsChartModal({
  isOpen,
  onClose,
  investmentTransactions,
  categories,
}: InvestmentContributionsChartModalProps) {
  // Generate investment data over last 12 months
  const now = new Date();
  const monthsData = [];

  for (let i = 11; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = monthDate.toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    });

    // Calculate total investments for this month
    const monthInvestments = investmentTransactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return (
        transactionDate.getFullYear() === monthDate.getFullYear() &&
        transactionDate.getMonth() === monthDate.getMonth()
      );
    });

    const monthTotal = monthInvestments.reduce(
      (sum, t) => sum + Math.abs(t.amount_gbp || 0),
      0,
    );

    monthsData.push({
      month: monthStr,
      amount: monthTotal,
    });
  }

  const categoryColors = categories.reduce(
    (acc: Record<string, string>, cat) => {
      acc[cat.name] = cat.color;
      return acc;
    },
    {},
  );

  const totalInvested = investmentTransactions.reduce(
    (sum, t) => sum + Math.abs(t.amount_gbp || 0),
    0,
  );
  const avgMonthly = monthsData.length > 0 ? totalInvested / 12 : 0;
  const maxMonth = monthsData.reduce(
    (max, month) => (month.amount > max ? month.amount : max),
    0,
  );
  const minMonth = monthsData.reduce(
    (min, month) =>
      month.amount < min && month.amount > 0 ? month.amount : min,
    maxMonth,
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Investment Contributions Over Time</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-6 bg-muted/30 rounded-lg">
              <div className="text-3xl font-bold">
                {formatCurrency(totalInvested)}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Invested (12 months)
              </div>
            </div>
            <div className="text-center p-6 bg-muted/30 rounded-lg">
              <div className="text-3xl font-bold">
                {formatCurrency(avgMonthly)}
              </div>
              <div className="text-sm text-muted-foreground">
                Average Monthly
              </div>
            </div>
            <div className="text-center p-6 bg-muted/30 rounded-lg">
              <div className="text-3xl font-bold">
                {investmentTransactions.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Transactions
              </div>
            </div>
            <div className="text-center p-6 bg-muted/30 rounded-lg">
              <div className="text-3xl font-bold">
                {formatCurrency(maxMonth)}
              </div>
              <div className="text-sm text-muted-foreground">Highest Month</div>
            </div>
          </div>

          {/* Investment Chart */}
          <InvestmentsOverTime
            data={monthsData}
            categoryColors={categoryColors}
          />

          {/* Monthly Breakdown */}
          {monthsData.some((m) => m.amount > 0) && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Monthly Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {monthsData.map((month) => (
                  <div
                    key={month.month}
                    className="text-center p-3 bg-muted/20 rounded hover:bg-muted/30 transition-colors"
                  >
                    <div className="font-medium text-sm">{month.month}</div>
                    <div className="text-lg font-bold">
                      {formatCurrency(month.amount)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {totalInvested > 0
                        ? ((month.amount / totalInvested) * 100).toFixed(0)
                        : 0}
                      %
                    </div>
                    {/* Visual indicator */}
                    <div className="mt-2 h-1 bg-muted rounded overflow-hidden">
                      <div
                        className="h-full bg-primary rounded"
                        style={{
                          width:
                            maxMonth > 0
                              ? `${(month.amount / maxMonth) * 100}%`
                              : "0%",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Investment Insights */}
          {investmentTransactions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Investment Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Consistency Analysis */}
                <div className="p-4 bg-muted/20 rounded-lg">
                  <h4 className="font-medium mb-3">Consistency Analysis</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Months with investments:
                      </span>
                      <span className="font-medium">
                        {monthsData.filter((m) => m.amount > 0).length}/12
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Largest single month:
                      </span>
                      <span className="font-medium">
                        {formatCurrency(maxMonth)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Smallest investing month:
                      </span>
                      <span className="font-medium">
                        {minMonth < maxMonth ? formatCurrency(minMonth) : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="p-4 bg-muted/20 rounded-lg">
                  <h4 className="font-medium mb-3">Recent Activity</h4>
                  <div className="space-y-2 text-sm">
                    {investmentTransactions
                      .sort(
                        (a, b) =>
                          new Date(b.date).getTime() -
                          new Date(a.date).getTime(),
                      )
                      .slice(0, 3)
                      .map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex justify-between"
                        >
                          <span
                            className="text-muted-foreground truncate max-w-[150px]"
                            title={transaction.description}
                          >
                            {transaction.description}
                          </span>
                          <span className="font-medium">
                            {formatCurrency(Math.abs(transaction.amount_gbp))}
                          </span>
                        </div>
                      ))}
                    {investmentTransactions.length > 3 && (
                      <div className="text-center text-muted-foreground text-xs pt-2">
                        +{investmentTransactions.length - 3} more transactions
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {investmentTransactions.length === 0 && (
            <div className="h-[300px] flex items-center justify-center text-center text-muted-foreground">
              <div>
                <div className="text-4xl mb-4">📈</div>
                <p className="text-lg font-medium">
                  No investment transactions found
                </p>
                <p className="text-sm">
                  Start adding investment transactions to track your
                  contributions over time
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
