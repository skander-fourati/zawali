import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, Plus, Edit, Trash2 } from "lucide-react";

interface HoldingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  investments: any[];
  onAddTransaction: () => void;
  onAddHolding: () => void;
  onEditHolding: (investment: any) => void;
  onDeleteHolding: (investment: any) => void;
}

export function HoldingsModal({
  isOpen,
  onClose,
  investments,
  onAddTransaction,
  onAddHolding,
  onEditHolding,
  onDeleteHolding,
}: HoldingsModalProps) {
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
      year: "2-digit",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle>Current Holdings</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Showing {investments.length} investment
                {investments.length !== 1 ? "s" : ""} with current values and
                performance
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={onAddHolding}
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Holding
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Holdings Table */}
          {investments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">💼</div>
              <p className="text-lg font-medium">No holdings to display</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add investment holdings or transactions to see your portfolio
              </p>
              <div className="flex gap-3 justify-center mt-6">
                <Button onClick={onAddHolding} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Holding
                </Button>
              </div>
            </div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border sticky top-0 z-10">
                    <tr>
                      <th className="text-left p-3 font-medium">Ticker</th>
                      <th className="text-left p-3 font-medium">Type</th>
                      <th className="text-right p-3 font-medium">
                        Market Value
                      </th>
                      <th className="text-right p-3 font-medium">Invested</th>
                      <th className="text-right p-3 font-medium">Return</th>
                      <th className="text-right p-3 font-medium">Return %</th>
                      <th className="text-left p-3 font-medium">
                        Last Updated
                      </th>
                      <th className="text-center p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {investments.map((investment) => (
                      <tr
                        key={investment.id}
                        className="border-b border-border hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-3 text-sm">
                          <div className="font-semibold text-foreground font-mono">
                            {investment.ticker}
                          </div>
                        </td>

                        <td className="p-3 text-sm">
                          <Badge
                            variant="secondary"
                            className="text-xs font-medium border bg-secondary/20 text-secondary border-secondary/30"
                          >
                            {investment.investment_type}
                          </Badge>
                        </td>

                        <td className="p-3 text-sm text-right font-mono">
                          {investment.current_market_value > 0 ? (
                            <span className="font-semibold text-foreground">
                              {formatCurrency(investment.current_market_value)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              Not set
                            </span>
                          )}
                        </td>

                        <td className="p-3 text-sm text-right font-mono">
                          <span className="font-semibold">
                            {formatCurrency(
                              Math.abs(investment.total_invested || 0),
                            )}
                          </span>
                        </td>

                        <td className="p-3 text-sm text-right font-mono">
                          <span
                            className={`font-semibold ${
                              (investment.total_return || 0) >= 0
                                ? "text-success"
                                : "text-destructive"
                            }`}
                          >
                            {formatCurrency(investment.total_return || 0)}
                          </span>
                        </td>

                        <td className="p-3 text-sm text-right font-mono">
                          <span
                            className={`font-semibold ${
                              (investment.return_percentage || 0) >= 0
                                ? "text-success"
                                : "text-destructive"
                            }`}
                          >
                            {(investment.return_percentage || 0) >= 0
                              ? "+"
                              : ""}
                            {(investment.return_percentage || 0).toFixed(2)}%
                          </span>
                        </td>

                        <td className="p-3 text-sm text-muted-foreground">
                          {formatDate(
                            investment.market_value_updated_at || null,
                          )}
                        </td>

                        {/* Actions Column */}
                        <td className="p-3 text-center">
                          <div className="flex gap-1 justify-center action-buttons">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onEditHolding(investment)}
                              className="h-7 w-7 p-0 hover:bg-muted"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onDeleteHolding(investment)}
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
