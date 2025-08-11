import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface Transaction {
  id: string;
  investment_id: string | null;
  account: {
    id: string;
    name: string;
    account_type: string;
  };
  category: {
    name: string;
  } | null;
}

interface Investment {
  id: string;
  ticker: string;
  investment_type: string;
  current_market_value: number;
  market_value_updated_at: string | null;
  total_invested: number;
  transaction_count: number;
  total_return: number;
  return_percentage: number;
}

interface AccountInvestment {
  investmentId: string;
  ticker: string;
  investment_type: string;
  account: {
    id: string;
    name: string;
    account_type: string;
  };
  // These will be calculated per account
  current_market_value: number;
  market_value_updated_at: string | null;
  total_invested: number;
  transaction_count: number;
  total_return: number;
  return_percentage: number;
}

interface TickerGroup {
  ticker: string;
  investment_type: string; // From the first account found
  // Combined totals across all accounts
  total_market_value: number;
  total_invested: number;
  total_return: number;
  return_percentage: number;
  last_updated: string | null;
  accounts: AccountInvestment[];
  isExpanded?: boolean;
}

interface HoldingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  investments: Investment[];
  transactions: Transaction[];
  onAddTransaction: () => void;
  onAddHolding: () => void;
  onEditHolding: (investment: Investment, accountId?: string) => void;
  onDeleteHolding: (investment: Investment, accountId?: string) => void;
}

export function HoldingsModal({
  isOpen,
  onClose,
  investments,
  transactions,
  onAddTransaction,
  onAddHolding,
  onEditHolding,
  onDeleteHolding,
}: HoldingsModalProps) {
  const [expandedTickers, setExpandedTickers] = React.useState<Set<string>>(
    new Set(),
  );

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

  // Build account mapping from transactions
  const buildAccountMapping = () => {
    const investmentToAccountMap = new Map<
      string,
      {
        id: string;
        name: string;
        account_type: string;
      }
    >();

    transactions
      .filter((t) => t.investment_id && t.category?.name === "Investment")
      .forEach((t) => {
        if (t.investment_id && t.account) {
          // For now, just use the first account found for each investment
          // In a more complex system, you might need to handle multiple accounts per investment
          if (!investmentToAccountMap.has(t.investment_id)) {
            investmentToAccountMap.set(t.investment_id, {
              id: t.account.id,
              name: t.account.name,
              account_type: t.account.account_type,
            });
          }
        }
      });

    return investmentToAccountMap;
  };

  // Group investments by ticker with account breakdown
  const groupInvestmentsByTicker = (): TickerGroup[] => {
    const accountMapping = buildAccountMapping();
    const tickerGroups = new Map<string, TickerGroup>();

    investments.forEach((investment) => {
      const accountInfo = accountMapping.get(investment.id);
      if (!accountInfo) return; // Skip investments without account info

      if (!tickerGroups.has(investment.ticker)) {
        tickerGroups.set(investment.ticker, {
          ticker: investment.ticker,
          investment_type: investment.investment_type,
          total_market_value: 0,
          total_invested: 0,
          total_return: 0,
          return_percentage: 0,
          last_updated: null,
          accounts: [],
          isExpanded: false,
        });
      }

      const group = tickerGroups.get(investment.ticker)!;

      // Add account-specific data
      const accountInvestment: AccountInvestment = {
        investmentId: investment.id,
        ticker: investment.ticker,
        investment_type: investment.investment_type,
        account: accountInfo,
        current_market_value: investment.current_market_value,
        market_value_updated_at: investment.market_value_updated_at,
        total_invested: investment.total_invested,
        transaction_count: investment.transaction_count,
        total_return: investment.total_return,
        return_percentage: investment.return_percentage,
      };

      group.accounts.push(accountInvestment);

      // Update group totals
      group.total_market_value += investment.current_market_value;
      group.total_invested += investment.total_invested;
      group.total_return += investment.total_return;

      // Update last updated date (use most recent)
      if (investment.market_value_updated_at) {
        if (
          !group.last_updated ||
          new Date(investment.market_value_updated_at) >
            new Date(group.last_updated)
        ) {
          group.last_updated = investment.market_value_updated_at;
        }
      }
    });

    // Calculate group return percentage
    tickerGroups.forEach((group) => {
      group.return_percentage =
        group.total_invested > 0
          ? (group.total_return / group.total_invested) * 100
          : 0;
    });

    return Array.from(tickerGroups.values());
  };

  const toggleTickerExpansion = (ticker: string) => {
    setExpandedTickers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(ticker)) {
        newSet.delete(ticker);
      } else {
        newSet.add(ticker);
      }
      return newSet;
    });
  };

  const tickerGroups = groupInvestmentsByTicker();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle>Current Holdings</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Showing {investments.length} investment
                {investments.length !== 1 ? "s" : ""}
                {tickerGroups.length !== investments.length &&
                  ` across ${tickerGroups.length} unique ticker${tickerGroups.length !== 1 ? "s" : ""}`}
                with current values and performance
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={onAddHolding}
                size="sm"
                className="flex items-center gap-2 mr-8" // Move away from X button
              >
                <Plus className="h-4 w-4" />
                Add Holding
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Holdings Table */}
          {tickerGroups.length === 0 ? (
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
                      <th className="text-left p-3 font-medium">Account</th>
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
                    {tickerGroups.map((group) => (
                      <React.Fragment key={group.ticker}>
                        {/* Main ticker row */}
                        <tr className="border-b border-border hover:bg-muted/30 transition-colors bg-muted/10">
                          <td className="p-3 text-sm">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  toggleTickerExpansion(group.ticker)
                                }
                                className="text-muted-foreground hover:text-foreground"
                                disabled={group.accounts.length <= 1}
                              >
                                {group.accounts.length > 1 ? (
                                  expandedTickers.has(group.ticker) ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )
                                ) : (
                                  <div className="w-4 h-4" />
                                )}
                              </button>
                              <div className="font-semibold text-foreground font-mono">
                                {group.ticker}
                              </div>
                              {group.accounts.length > 1 && (
                                <Badge variant="secondary" className="text-xs">
                                  {group.accounts.length} accounts
                                </Badge>
                              )}
                            </div>
                          </td>

                          <td className="p-3 text-sm">
                            <Badge
                              variant="secondary"
                              className="text-xs font-medium border bg-secondary/20 text-secondary border-secondary/30"
                            >
                              {group.investment_type}
                            </Badge>
                          </td>

                          <td className="p-3 text-sm text-muted-foreground">
                            {group.accounts.length === 1
                              ? group.accounts[0].account.name
                              : "Multiple"}
                          </td>

                          <td className="p-3 text-sm text-right font-mono">
                            {group.total_market_value > 0 ? (
                              <span className="font-semibold text-foreground">
                                {formatCurrency(group.total_market_value)}
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
                                Math.abs(group.total_invested || 0),
                              )}
                            </span>
                          </td>

                          <td className="p-3 text-sm text-right font-mono">
                            <span
                              className={`font-semibold ${
                                (group.total_return || 0) >= 0
                                  ? "text-success"
                                  : "text-destructive"
                              }`}
                            >
                              {formatCurrency(group.total_return || 0)}
                            </span>
                          </td>

                          <td className="p-3 text-sm text-right font-mono">
                            <span
                              className={`font-semibold ${
                                (group.return_percentage || 0) >= 0
                                  ? "text-success"
                                  : "text-destructive"
                              }`}
                            >
                              {(group.return_percentage || 0) >= 0 ? "+" : ""}
                              {(group.return_percentage || 0).toFixed(2)}%
                            </span>
                          </td>

                          <td className="p-3 text-sm text-muted-foreground">
                            {formatDate(group.last_updated)}
                          </td>

                          <td className="p-3 text-center">
                            {group.accounts.length === 1 ? (
                              <div className="flex gap-1 justify-center">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    const investment = investments.find(
                                      (i) =>
                                        i.id === group.accounts[0].investmentId,
                                    );
                                    if (investment)
                                      onEditHolding(
                                        investment,
                                        group.accounts[0].account.id,
                                      );
                                  }}
                                  className="h-7 w-7 p-0 hover:bg-muted"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    const investment = investments.find(
                                      (i) =>
                                        i.id === group.accounts[0].investmentId,
                                    );
                                    if (investment)
                                      onDeleteHolding(
                                        investment,
                                        group.accounts[0].account.id,
                                      );
                                  }}
                                  className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Expand to edit
                              </span>
                            )}
                          </td>
                        </tr>

                        {/* Account sub-rows */}
                        {group.accounts.length > 1 &&
                          expandedTickers.has(group.ticker) &&
                          group.accounts.map((accountInvestment) => (
                            <tr
                              key={`${group.ticker}-${accountInvestment.account.id}`}
                              className="border-b border-border hover:bg-muted/20 transition-colors"
                            >
                              <td className="p-3 text-sm pl-10">
                                <div className="text-muted-foreground text-sm">
                                  └── {accountInvestment.account.name}
                                </div>
                              </td>

                              <td className="p-3 text-sm">
                                <Badge variant="outline" className="text-xs">
                                  {accountInvestment.account.account_type}
                                </Badge>
                              </td>

                              <td className="p-3 text-sm text-muted-foreground">
                                {accountInvestment.account.name}
                              </td>

                              <td className="p-3 text-sm text-right font-mono">
                                {accountInvestment.current_market_value > 0 ? (
                                  <span className="font-medium text-foreground">
                                    {formatCurrency(
                                      accountInvestment.current_market_value,
                                    )}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground text-xs">
                                    Not set
                                  </span>
                                )}
                              </td>

                              <td className="p-3 text-sm text-right font-mono">
                                <span className="font-medium">
                                  {formatCurrency(
                                    Math.abs(
                                      accountInvestment.total_invested || 0,
                                    ),
                                  )}
                                </span>
                              </td>

                              <td className="p-3 text-sm text-right font-mono">
                                <span
                                  className={`font-medium ${
                                    (accountInvestment.total_return || 0) >= 0
                                      ? "text-success"
                                      : "text-destructive"
                                  }`}
                                >
                                  {formatCurrency(
                                    accountInvestment.total_return || 0,
                                  )}
                                </span>
                              </td>

                              <td className="p-3 text-sm text-right font-mono">
                                <span
                                  className={`font-medium ${
                                    (accountInvestment.return_percentage ||
                                      0) >= 0
                                      ? "text-success"
                                      : "text-destructive"
                                  }`}
                                >
                                  {(accountInvestment.return_percentage || 0) >=
                                  0
                                    ? "+"
                                    : ""}
                                  {(
                                    accountInvestment.return_percentage || 0
                                  ).toFixed(2)}
                                  %
                                </span>
                              </td>

                              <td className="p-3 text-sm text-muted-foreground">
                                {formatDate(
                                  accountInvestment.market_value_updated_at,
                                )}
                              </td>

                              <td className="p-3 text-center">
                                <div className="flex gap-1 justify-center">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      const investment = investments.find(
                                        (i) =>
                                          i.id ===
                                          accountInvestment.investmentId,
                                      );
                                      if (investment)
                                        onEditHolding(
                                          investment,
                                          accountInvestment.account.id,
                                        );
                                    }}
                                    className="h-7 w-7 p-0 hover:bg-muted"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      const investment = investments.find(
                                        (i) =>
                                          i.id ===
                                          accountInvestment.investmentId,
                                      );
                                      if (investment)
                                        onDeleteHolding(
                                          investment,
                                          accountInvestment.account.id,
                                        );
                                    }}
                                    className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </React.Fragment>
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
