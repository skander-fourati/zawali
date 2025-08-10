import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExpensesByCategory } from "@/components/charts/ExpensesByCategory";

interface AssetAllocationChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetAllocation: Array<{
    investment_type: string;
    amount: number;
    percentage: number;
  }>;
}

export function AssetAllocationChartModal({
  isOpen,
  onClose,
  assetAllocation,
}: AssetAllocationChartModalProps) {
  // Transform asset allocation data to match ExpensesByCategory format
  const chartData = assetAllocation.map((allocation, index) => ({
    category: allocation.investment_type,
    amount: allocation.amount,
    color: `hsl(${(index * 360) / assetAllocation.length}, 70%, 50%)`, // Generate colors based on index
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(value);
  };

  const totalValue = assetAllocation.reduce(
    (sum, allocation) => sum + allocation.amount,
    0,
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Asset Allocation by Investment Type</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {chartData.length > 0 ? (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-6 bg-muted/30 rounded-lg">
                  <div className="text-3xl font-bold">
                    {formatCurrency(totalValue)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Portfolio Value
                  </div>
                </div>
                <div className="text-center p-6 bg-muted/30 rounded-lg">
                  <div className="text-3xl font-bold">
                    {assetAllocation.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Investment Types
                  </div>
                </div>
                <div className="text-center p-6 bg-muted/30 rounded-lg">
                  <div className="text-3xl font-bold">
                    {assetAllocation.find(
                      (a) =>
                        a.percentage ===
                        Math.max(...assetAllocation.map((al) => al.percentage)),
                    )?.investment_type || "N/A"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Largest Allocation
                  </div>
                </div>
              </div>

              {/* Pie Chart */}
              <ExpensesByCategory data={chartData} />

              {/* Detailed Breakdown */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Allocation Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assetAllocation
                    .sort((a, b) => b.amount - a.amount)
                    .map((allocation, index) => (
                      <div
                        key={allocation.investment_type}
                        className="flex items-center justify-between p-4 bg-muted/20 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{
                              backgroundColor:
                                chartData[
                                  assetAllocation.findIndex(
                                    (a) =>
                                      a.investment_type ===
                                      allocation.investment_type,
                                  )
                                ]?.color,
                            }}
                          />
                          <div>
                            <div className="font-medium">
                              {allocation.investment_type}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {allocation.percentage.toFixed(1)}% of portfolio
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
            </>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-center text-muted-foreground">
              <div>
                <div className="text-4xl mb-4">📊</div>
                <p className="text-lg font-medium">
                  No asset allocation data available
                </p>
                <p className="text-sm">
                  Start by adding investment transactions to see your portfolio
                  allocation
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
