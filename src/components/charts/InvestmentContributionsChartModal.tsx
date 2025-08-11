import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InvestmentsOverTime } from "@/components/charts/InvestmentsOverTime";
import { chartCalculations } from "@/lib/chartCalculations";

interface InvestmentTransaction {
  id: string;
  date: string;
  amount_gbp: number;
  description: string;
  category: {
    id: string;
    name: string;
    color: string;
  } | null;
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
  // Use new function to get exactly 12 calendar months of investment data
  const last12MonthsData = chartCalculations.getLast12MonthsInvestmentData(
    investmentTransactions,
  );

  // Calculate 12-month total from all 12 months (including 0s)
  const total12MonthInvestments = last12MonthsData.reduce(
    (sum, month) => sum + month.amount,
    0,
  );

  const categoryColors = categories.reduce(
    (acc: Record<string, string>, cat) => {
      acc[cat.name] = cat.color;
      return acc;
    },
    {},
  );

  const avgMonthly = total12MonthInvestments / 12; // Always divide by 12 since we have exactly 12 months
  const maxMonth = last12MonthsData.reduce(
    (max, month) => (month.amount > max ? month.amount : max),
    0,
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
          {/* Summary Stats - Now only 3 cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-6 bg-muted/30 rounded-lg">
              <div className="text-3xl font-bold">
                {formatCurrency(total12MonthInvestments)}
              </div>
              <div className="text-sm text-muted-foreground">
                Net Invested (12 months)
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
                {formatCurrency(maxMonth)}
              </div>
              <div className="text-sm text-muted-foreground">Highest Month</div>
            </div>
          </div>

          {/* Investment Chart */}
          <InvestmentsOverTime
            data={last12MonthsData}
            categoryColors={categoryColors}
          />

          {/* Monthly Breakdown - Only show months with investments in cards */}
          {last12MonthsData.some((m) => m.amount > 0) && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Monthly Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {last12MonthsData
                  .filter((month) => month.amount > 0) // Only show months with investments
                  .map((month) => (
                    <div
                      key={month.month}
                      className="text-center p-3 bg-muted/20 rounded hover:bg-muted/30 transition-colors"
                    >
                      <div className="font-medium text-sm">{month.month}</div>
                      <div className="text-lg font-bold">
                        {formatCurrency(month.amount)}
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
                        {last12MonthsData.filter((m) => m.amount > 0).length}/12
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
                        12-month average:
                      </span>
                      <span className="font-medium">
                        {formatCurrency(avgMonthly)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="p-4 bg-muted/20 rounded-lg">
                  <h4 className="font-medium mb-3">Recent Activity</h4>
                  <div className="space-y-2 text-sm">
                    {investmentTransactions
                      .filter((t) => t.category?.name === "Investment")
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
                            {formatCurrency(transaction.amount_gbp)}
                          </span>
                        </div>
                      ))}
                    {investmentTransactions.filter(
                      (t) => t.category?.name === "Investment",
                    ).length > 3 && (
                      <div className="text-center text-muted-foreground text-xs pt-2">
                        +
                        {investmentTransactions.filter(
                          (t) => t.category?.name === "Investment",
                        ).length - 3}{" "}
                        more transactions
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {investmentTransactions.filter(
            (t) => t.category?.name === "Investment",
          ).length === 0 && (
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
