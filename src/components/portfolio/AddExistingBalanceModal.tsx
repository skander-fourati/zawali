import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { INVESTMENT_TYPES } from "@/components/portfolio/investments";
import { Plus, Calculator, TrendingUp } from "lucide-react";

interface TickerBalance {
  id?: string;
  ticker: string;
  investment_type?: string;
  current_value: string;
  currency: string;
  purchase_date: string;
  growth_rate: string; // Add growth rate field
  is_new: boolean;
  is_editing: boolean; // Add editing state
  existing_balance?: number;
}

interface AddExistingBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  accounts: any[];
  investments: any[];
}

export function AddExistingBalanceModal({
  isOpen,
  onClose,
  onSave,
  accounts,
  investments,
}: AddExistingBalanceModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [tickerBalances, setTickerBalances] = useState<TickerBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [tickerWarnings, setTickerWarnings] = useState<Record<number, boolean>>(
    {},
  );

  // Filter to only investment accounts
  const investmentAccounts = accounts.filter(
    (account) =>
      account.account_type === "investment" ||
      account.account_type === "brokerage" ||
      account.name?.toLowerCase().includes("investment") ||
      account.name?.toLowerCase().includes("brokerage"),
  );

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedAccountId("");
      setTickerBalances([]);
      setTickerWarnings({});
    }
  }, [isOpen]);

  const handleAccountSelect = (accountId: string) => {
    setSelectedAccountId(accountId);

    // Initialize with existing tickers
    const existingTickers = investments.map((inv) => ({
      id: inv.id,
      ticker: inv.ticker,
      investment_type: inv.investment_type,
      current_value: "",
      currency: "GBP",
      purchase_date: "",
      growth_rate: "",
      is_new: false,
      is_editing: false, // Start in non-editing state
      existing_balance: inv.current_market_value || 0,
    }));

    setTickerBalances(existingTickers);
    setStep(2);
  };

  const addNewTicker = () => {
    setTickerBalances((prev) => [
      ...prev,
      {
        ticker: "",
        investment_type: "",
        current_value: "",
        currency: "GBP",
        purchase_date: "",
        growth_rate: "",
        is_new: true,
        is_editing: true, // New tickers are editable by default
      },
    ]);
  };

  const hasExistingTransactions = (tickerId: string) => {
    // For now, assume any existing ticker (with ID) has transaction history
    // In a more robust implementation, this could check the actual transactions
    // passed from the parent component or make a quick API call
    return !!tickerId;
  };

  const toggleEditingTicker = (index: number) => {
    const ticker = tickerBalances[index];

    // Show warning for existing tickers with transaction history
    if (
      !ticker.is_new &&
      !ticker.is_editing &&
      hasExistingTransactions(ticker.id || "")
    ) {
      setTickerWarnings((prev) => ({ ...prev, [index]: true }));
    } else {
      setTickerWarnings((prev) => ({ ...prev, [index]: false }));
    }

    setTickerBalances((prev) =>
      prev.map((t, i) =>
        i === index ? { ...t, is_editing: !t.is_editing } : t,
      ),
    );
  };

  const updateTickerBalance = (
    index: number,
    field: keyof TickerBalance,
    value: string,
  ) => {
    setTickerBalances((prev) =>
      prev.map((ticker, i) =>
        i === index ? { ...ticker, [field]: value } : ticker,
      ),
    );
  };

  const removeTickerBalance = (index: number) => {
    setTickerBalances((prev) => prev.filter((_, i) => i !== index));
  };

  const calculatePurchaseAmount = (
    currentValue: number,
    purchaseDate: string,
    totalGrowthPercent: number,
  ) => {
    const today = new Date();
    const purchase = new Date(purchaseDate);
    const monthsDiff =
      (today.getFullYear() - purchase.getFullYear()) * 12 +
      (today.getMonth() - purchase.getMonth());

    if (monthsDiff <= 0 || totalGrowthPercent === 0) return currentValue;

    // Calculate purchase amount from total growth over entire period
    // If current value = £125 and total growth = 25%, then purchase amount = £100
    const totalGrowthFactor = 1 + totalGrowthPercent / 100;
    const purchaseAmount = currentValue / totalGrowthFactor;

    return purchaseAmount;
  };

  const validateTickerBalances = () => {
    // Only validate tickers that are being edited
    const tickersToValidate = tickerBalances.filter(
      (ticker) => ticker.is_new || ticker.is_editing,
    );

    for (const ticker of tickersToValidate) {
      if (!ticker.ticker.trim()) {
        toast({
          title: "Validation Error",
          description: "All ticker symbols are required.",
          variant: "destructive",
        });
        return false;
      }

      if (ticker.is_new && !ticker.investment_type) {
        toast({
          title: "Validation Error",
          description: `Investment type is required for new ticker: ${ticker.ticker}`,
          variant: "destructive",
        });
        return false;
      }

      if (!ticker.current_value || isNaN(parseFloat(ticker.current_value))) {
        toast({
          title: "Validation Error",
          description: `Current market value is required for: ${ticker.ticker}`,
          variant: "destructive",
        });
        return false;
      }

      if (!ticker.purchase_date) {
        toast({
          title: "Validation Error",
          description: `First purchase date is required for: ${ticker.ticker}`,
          variant: "destructive",
        });
        return false;
      }

      if (!ticker.growth_rate || isNaN(parseFloat(ticker.growth_rate))) {
        toast({
          title: "Validation Error",
          description: `Total return percentage is required for: ${ticker.ticker}`,
          variant: "destructive",
        });
        return false;
      }

      const purchaseDate = new Date(ticker.purchase_date);
      if (purchaseDate >= new Date()) {
        toast({
          title: "Validation Error",
          description: `Purchase date must be in the past for: ${ticker.ticker}`,
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!user || !selectedAccountId) return;

    // Filter only tickers that are being edited and have data entered
    const completedTickers = tickerBalances.filter(
      (ticker) =>
        (ticker.is_new || ticker.is_editing) &&
        ticker.current_value &&
        ticker.purchase_date &&
        ticker.growth_rate,
    );

    if (completedTickers.length === 0) {
      toast({
        title: "No Data",
        description:
          "Please add at least one ticker with current value, purchase date, and total return percentage.",
        variant: "destructive",
      });
      return;
    }

    if (!validateTickerBalances()) return;

    setLoading(true);

    try {
      const selectedAccount = investmentAccounts.find(
        (acc) => acc.id === selectedAccountId,
      );

      for (const ticker of completedTickers) {
        const currentValue = parseFloat(ticker.current_value);
        const currentValueGBP =
          ticker.currency === "USD" ? currentValue * 0.79 : currentValue;
        const growthRate = parseFloat(ticker.growth_rate);
        const totalGrowthPercent = growthRate; // Keep the same variable for clarity
        const purchaseAmount = calculatePurchaseAmount(
          currentValueGBP,
          ticker.purchase_date,
          totalGrowthPercent,
        );

        // 1. Handle override for existing tickers being edited
        if (!ticker.is_new && ticker.is_editing) {
          // Delete existing investment transactions for this ticker in this account
          const { error: deleteTransactionsError } = await supabase
            .from("transactions")
            .delete()
            .eq("investment_id", ticker.id)
            .eq("account_id", selectedAccountId)
            .eq("user_id", user.id);

          if (deleteTransactionsError) {
            console.warn(
              "Could not delete existing transactions:",
              deleteTransactionsError,
            );
            // Continue anyway - might not have had transactions
          }

          // Delete existing market values for this ticker
          const { error: deleteMarketValuesError } = await supabase
            .from("investment_market_values")
            .delete()
            .eq("investment_id", ticker.id);

          if (deleteMarketValuesError) {
            console.warn(
              "Could not delete existing market values:",
              deleteMarketValuesError,
            );
            // Continue anyway - might not have had market values
          }
        }

        // 2. Create/Update Investment Record
        let investmentId = ticker.id;
        if (ticker.is_new) {
          const { data: investmentData, error: investmentError } =
            await supabase
              .from("investments")
              .insert({
                user_id: user.id,
                ticker: ticker.ticker.toUpperCase(),
                investment_type: ticker.investment_type,
              })
              .select()
              .single();

          if (investmentError) throw investmentError;
          investmentId = investmentData.id;
        }

        // 3. Check for existing market values in ±3 month window (only needed for logic above)
        const today = new Date();
        const threeMonthsBefore = new Date(today);
        threeMonthsBefore.setMonth(today.getMonth() - 3);
        const threeMonthsAfter = new Date(today);
        threeMonthsAfter.setMonth(today.getMonth() + 3);

        // 4. Create market value data points (always create for edited existing tickers, check for new ones)
        let shouldCreateMarketValues = ticker.is_new; // Always create for new tickers

        if (!ticker.is_new && ticker.is_editing) {
          // For edited existing tickers, we already deleted old data, so create new data
          shouldCreateMarketValues = true;
        } else if (!ticker.is_new) {
          // For non-edited existing tickers, check if data exists in window
          const { data: existingValues } = await supabase
            .from("investment_market_values")
            .select("*")
            .eq("investment_id", investmentId)
            .gte("updated_at", threeMonthsBefore.toISOString())
            .lte("updated_at", threeMonthsAfter.toISOString());

          shouldCreateMarketValues =
            !existingValues || existingValues.length === 0;
        }

        if (shouldCreateMarketValues) {
          const purchaseDate = new Date(ticker.purchase_date);
          const monthsDiff =
            (today.getFullYear() - purchaseDate.getFullYear()) * 12 +
            (today.getMonth() - purchaseDate.getMonth());

          // Use the user's specified total return to calculate monthly compound rate
          const totalGrowthFactor = growthRate / 100; // Convert percentage to decimal (growthRate is available here)
          const monthlyGrowthRate =
            monthsDiff > 0
              ? Math.pow(1 + totalGrowthFactor, 1 / monthsDiff) - 1 // Compound rate that achieves total return
              : 0;

          const marketValueInserts = [];

          // Create monthly data points
          for (let i = 0; i <= monthsDiff; i++) {
            const date = new Date(purchaseDate);
            date.setMonth(purchaseDate.getMonth() + i);

            const monthlyValue =
              purchaseAmount * Math.pow(1 + monthlyGrowthRate, i);

            marketValueInserts.push({
              investment_id: investmentId,
              market_value: monthlyValue,
              updated_at: date.toISOString(),
            });
          }

          const { error: marketValueError } = await supabase
            .from("investment_market_values")
            .insert(marketValueInserts);

          if (marketValueError) throw marketValueError;
        }

        // 5. Create Initial Purchase Transaction
        const { data: investmentCategory } = await supabase
          .from("categories")
          .select("id")
          .eq("name", "Investment")
          .eq("user_id", user.id)
          .single();

        if (investmentCategory) {
          const { error: transactionError } = await supabase
            .from("transactions")
            .insert({
              user_id: user.id,
              date: ticker.purchase_date,
              description: `Initial Purchase of ${ticker.ticker}`,
              amount:
                ticker.currency === "USD"
                  ? purchaseAmount / 0.79
                  : purchaseAmount,
              currency: ticker.currency,
              amount_gbp: purchaseAmount,
              exchange_rate: ticker.currency === "USD" ? 0.79 : 1.0,
              category_id: investmentCategory.id,
              account_id: selectedAccountId,
              transaction_type: "expense",
              investment_id: investmentId,
            });

          if (transactionError) throw transactionError;

          // 6. Create Current Market Value Update Transaction
          const { error: updateTransactionError } = await supabase
            .from("transactions")
            .insert({
              user_id: user.id,
              date: today.toISOString().split("T")[0],
              description: `Market Value Update - ${ticker.ticker}`,
              amount: 0, // This is just a market value update, not a buy/sell
              currency: "GBP",
              amount_gbp: 0,
              exchange_rate: 1.0,
              category_id: investmentCategory.id,
              account_id: selectedAccountId,
              transaction_type: "expense",
              investment_id: investmentId,
            });

          if (updateTransactionError) throw updateTransactionError;
        }
      }

      const updatedCount = completedTickers.filter(
        (t) => !t.is_new && t.is_editing,
      ).length;
      const newCount = completedTickers.filter((t) => t.is_new).length;

      let successMessage = `Successfully processed ${completedTickers.length} ticker${completedTickers.length !== 1 ? "s" : ""}`;
      if (updatedCount > 0 && newCount > 0) {
        successMessage += ` (${newCount} new, ${updatedCount} updated)`;
      } else if (updatedCount > 0) {
        successMessage += ` (${updatedCount} updated with override)`;
      } else {
        successMessage += ` (${newCount} new)`;
      }

      toast({
        title: "Success!",
        description: successMessage,
      });

      onSave();
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Error",
        description: "Failed to add existing balances.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSelectedAccountName = () => {
    return (
      investmentAccounts.find((acc) => acc.id === selectedAccountId)?.name || ""
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            💰 Add Existing Balance
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Select Investment Account
              </h3>
              <p className="text-muted-foreground mb-4">
                Choose which investment account contains your existing balances.
              </p>
            </div>

            {investmentAccounts.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">
                    No investment accounts found. Please add investment accounts
                    first.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {investmentAccounts.map((account) => (
                  <Card
                    key={account.id}
                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => handleAccountSelect(account.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold">{account.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {account.account_type || "Investment Account"} •{" "}
                            {account.currency || "GBP"}
                          </p>
                        </div>
                        <Badge variant="secondary">Select →</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Add Ticker Balances</h3>
                <p className="text-muted-foreground">
                  Account:{" "}
                  <span className="font-medium">
                    {getSelectedAccountName()}
                  </span>
                  <br />
                  Enter current value, purchase date, and total return since
                  purchase for each ticker
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                  ← Back
                </Button>
                <Button variant="outline" size="sm" onClick={addNewTicker}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Ticker
                </Button>
              </div>
            </div>

            {tickerBalances.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    No existing tickers found. Add a new ticker to get started.
                  </p>
                  <Button onClick={addNewTicker}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Ticker
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {tickerBalances.map((ticker, index) => (
                  <Card key={index} className="relative">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {ticker.is_new ? (
                            <Input
                              placeholder="Enter ticker (e.g., AAPL)"
                              value={ticker.ticker}
                              onChange={(e) =>
                                updateTickerBalance(
                                  index,
                                  "ticker",
                                  e.target.value.toUpperCase(),
                                )
                              }
                              className="font-mono text-sm w-48"
                            />
                          ) : (
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-lg">
                                {ticker.ticker}
                              </span>
                              {ticker.existing_balance > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  Current: £{ticker.existing_balance.toFixed(2)}
                                </Badge>
                              )}
                            </div>
                          )}
                        </CardTitle>
                        {ticker.is_new ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTickerBalance(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            Remove
                          </Button>
                        ) : (
                          <Button
                            variant={ticker.is_editing ? "outline" : "default"}
                            size="sm"
                            onClick={() => toggleEditingTicker(index)}
                          >
                            {ticker.is_editing ? "Cancel Edit" : "Edit"}
                          </Button>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      {/* Warning for existing tickers with transaction history */}
                      {tickerWarnings[index] && ticker.is_editing && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <div className="text-yellow-600 dark:text-yellow-400 mt-0.5">
                              ⚠️
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                                Warning: This will override existing data
                              </h4>
                              <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
                                This ticker has existing investment transactions
                                and market value history in this account.
                                Updating the balance will:
                              </p>
                              <ul className="text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside space-y-1 mb-3">
                                <li>
                                  Delete all existing investment transactions
                                  for {ticker.ticker} in this account
                                </li>
                                <li>
                                  Replace all market value history with new
                                  calculated data
                                </li>
                                <li>
                                  Recalculate performance from your new purchase
                                  date and growth rate
                                </li>
                              </ul>
                              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                <strong>Alternative:</strong> If you just want
                                to update the current balance while keeping
                                transaction history, consider adding a new
                                buy/sell transaction instead.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Only show form fields if ticker is being edited */}
                      {ticker.is_new || ticker.is_editing ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Left Column */}
                          <div className="space-y-4">
                            {/* Investment Type - Only for new tickers */}
                            {ticker.is_new && (
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                  Investment Type *
                                </Label>
                                <Select
                                  value={ticker.investment_type || ""}
                                  onValueChange={(value) =>
                                    updateTickerBalance(
                                      index,
                                      "investment_type",
                                      value,
                                    )
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select type..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {INVESTMENT_TYPES.map((type) => (
                                      <SelectItem key={type} value={type}>
                                        {type}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {/* Current Market Value */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">
                                Current Market Value *
                              </Label>
                              <div className="flex gap-2">
                                <Select
                                  value={ticker.currency}
                                  onValueChange={(value) =>
                                    updateTickerBalance(
                                      index,
                                      "currency",
                                      value,
                                    )
                                  }
                                >
                                  <SelectTrigger className="w-24">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="GBP">GBP</SelectItem>
                                    <SelectItem value="USD">USD</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={ticker.current_value}
                                  onChange={(e) =>
                                    updateTickerBalance(
                                      index,
                                      "current_value",
                                      e.target.value,
                                    )
                                  }
                                  className="flex-1"
                                />
                              </div>
                            </div>

                            {/* First Purchase Date */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">
                                First Purchase Date *
                              </Label>
                              <Input
                                type="date"
                                value={ticker.purchase_date}
                                onChange={(e) =>
                                  updateTickerBalance(
                                    index,
                                    "purchase_date",
                                    e.target.value,
                                  )
                                }
                                max={new Date().toISOString().split("T")[0]}
                              />
                            </div>
                          </div>

                          {/* Right Column */}
                          <div className="space-y-4">
                            {/* Growth Rate */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">
                                <TrendingUp className="h-4 w-4 inline mr-1" />
                                Total Growth Rate *
                              </Label>
                              <div className="relative">
                                <Input
                                  type="number"
                                  step="0.1"
                                  placeholder="0.0"
                                  value={ticker.growth_rate}
                                  onChange={(e) =>
                                    updateTickerBalance(
                                      index,
                                      "growth_rate",
                                      e.target.value,
                                    )
                                  }
                                />
                                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                                  %
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Total growth since purchase (e.g., 25 for +25%)
                              </p>
                            </div>

                            {/* Calculated Purchase Amount */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">
                                <Calculator className="h-4 w-4 inline mr-1" />
                                Calculated Purchase Amount
                              </Label>
                              <div className="p-3 bg-muted rounded border">
                                {ticker.current_value &&
                                ticker.purchase_date &&
                                ticker.growth_rate ? (
                                  <div className="text-center">
                                    <span className="text-lg font-mono font-semibold">
                                      £
                                      {calculatePurchaseAmount(
                                        parseFloat(ticker.current_value) *
                                          (ticker.currency === "USD"
                                            ? 0.79
                                            : 1),
                                        ticker.purchase_date,
                                        parseFloat(ticker.growth_rate),
                                      ).toFixed(2)}
                                    </span>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Original investment amount
                                    </p>
                                  </div>
                                ) : (
                                  <div className="text-center">
                                    <span className="text-sm text-muted-foreground">
                                      Complete fields to calculate
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center p-6 text-muted-foreground">
                          <p>
                            Click "Edit" to add balance information for this
                            ticker
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Save Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={
                  loading ||
                  tickerBalances.filter(
                    (t) =>
                      (t.is_new || t.is_editing) &&
                      t.current_value &&
                      t.purchase_date &&
                      t.growth_rate,
                  ).length === 0
                }
                className="flex-1"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding Balances...
                  </>
                ) : (
                  <>
                    Add Existing Balances (
                    {
                      tickerBalances.filter(
                        (t) =>
                          (t.is_new || t.is_editing) &&
                          t.current_value &&
                          t.purchase_date &&
                          t.growth_rate,
                      ).length
                    }
                    )
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
