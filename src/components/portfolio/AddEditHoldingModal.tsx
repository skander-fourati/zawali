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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { INVESTMENT_TYPES } from "@/components/portfolio/investments";

interface Transaction {
  id: string;
  investment_id: string | null;
  category: {
    name: string;
  } | null;
  account: {
    id: string;
    name: string;
    account_type: string;
  };
}

interface AddEditHoldingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  holding?: any;
  accountId?: string; // For account-specific editing
  existingHoldings: any[];
  accounts: any[]; // Add accounts prop
  transactions: Transaction[]; // Add transactions prop for account mapping
  updateInvestmentMarketValue: (
    investmentId: string,
    marketValue: number,
    accountId: string,
  ) => Promise<{ success: boolean; error?: any }>;
}

const USD_TO_GBP_RATE = 0.79;

export function AddEditHoldingModal({
  isOpen,
  onClose,
  onSave,
  holding,
  accountId,
  existingHoldings,
  accounts,
  transactions,
  updateInvestmentMarketValue,
}: AddEditHoldingModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    ticker: "",
    investment_type: "",
    market_value: "",
    market_value_currency: "GBP", // Add currency selection
    account_id: "", // Add account selection
  });

  const [loading, setLoading] = useState(false);
  const [marketValueLoading, setMarketValueLoading] = useState(false);

  // Reset form when holding changes or modal opens
  useEffect(() => {
    if (holding) {
      setFormData({
        ticker: holding.ticker || "",
        investment_type: holding.investment_type || "",
        market_value:
          holding.current_market_value > 0
            ? holding.current_market_value.toString()
            : "",
        market_value_currency: "GBP", // Default to GBP since market values are stored in GBP
        account_id: accountId || "", // Pre-select account if editing account-specific
      });
    } else {
      setFormData({
        ticker: "",
        investment_type: "",
        market_value: "",
        market_value_currency: "GBP", // Default to GBP
        account_id: "",
      });
    }
  }, [holding, accountId, isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Auto-uppercase ticker
    if (field === "ticker") {
      setFormData((prev) => ({
        ...prev,
        ticker: value.toUpperCase(),
      }));
    }
  };

  // Helper function to convert market value to GBP
  const convertToGBP = (amount: number, currency: string) => {
    if (currency === "USD") {
      return amount * USD_TO_GBP_RATE;
    }
    return amount; // Already in GBP
  };

  // Helper function to format display value with currency
  const formatDisplayValue = (gbpAmount: number, originalCurrency: string) => {
    if (originalCurrency === "USD") {
      const usdAmount = gbpAmount / USD_TO_GBP_RATE;
      return {
        display: `$${usdAmount.toFixed(2)} (≈ £${gbpAmount.toFixed(2)})`,
        usd: usdAmount,
        gbp: gbpAmount,
      };
    }
    return {
      display: `£${gbpAmount.toFixed(2)}`,
      usd: gbpAmount / USD_TO_GBP_RATE,
      gbp: gbpAmount,
    };
  };

  // Helper function to build investment-to-account mapping
  const buildInvestmentAccountMapping = () => {
    const mapping = new Map<string, string>();

    transactions
      .filter((t) => t.investment_id && t.category?.name === "Investment")
      .forEach((t) => {
        if (t.investment_id && t.account?.id) {
          mapping.set(t.investment_id, t.account.id);
        }
      });

    return mapping;
  };

  const validateForm = () => {
    if (!formData.ticker.trim()) {
      toast({
        title: "Validation Error",
        description: "Ticker symbol is required.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.investment_type) {
      toast({
        title: "Validation Error",
        description: "Investment type is required.",
        variant: "destructive",
      });
      return false;
    }

    // Account is required for new holdings
    if (!holding && !formData.account_id) {
      toast({
        title: "Validation Error",
        description: "Please select an account for the new holding.",
        variant: "destructive",
      });
      return false;
    }

    // For new holdings: Check if this ticker already exists in the selected account
    // Since we reuse investment records, we need to check via transactions
    if (!holding && formData.account_id) {
      const tickerInAccount = transactions.some(
        (t) =>
          t.investment_id &&
          t.category?.name === "Investment" &&
          t.account?.id === formData.account_id &&
          existingHoldings.some(
            (h) =>
              h.id === t.investment_id &&
              h.ticker.toLowerCase() === formData.ticker.toLowerCase(),
          ),
      );

      if (tickerInAccount) {
        const selectedAccount = accounts.find(
          (a) => a.id === formData.account_id,
        );
        toast({
          title: "Validation Error",
          description: `Ticker "${formData.ticker}" already exists in ${selectedAccount?.name || "the selected account"}.`,
          variant: "destructive",
        });
        return false;
      }
    }

    // For editing holdings: Prevent changing ticker to one that exists in the same account
    if (
      holding &&
      formData.ticker.toLowerCase() !== holding.ticker?.toLowerCase()
    ) {
      const investmentAccountMapping = buildInvestmentAccountMapping();
      const currentAccountId =
        accountId || investmentAccountMapping.get(holding.id);

      if (currentAccountId) {
        const tickerInAccount = transactions.some(
          (t) =>
            t.investment_id &&
            t.category?.name === "Investment" &&
            t.account?.id === currentAccountId &&
            existingHoldings.some(
              (h) =>
                h.id === t.investment_id &&
                h.id !== holding.id &&
                h.ticker.toLowerCase() === formData.ticker.toLowerCase(),
            ),
        );

        if (tickerInAccount) {
          toast({
            title: "Validation Error",
            description: `Ticker "${formData.ticker}" already exists in this account.`,
            variant: "destructive",
          });
          return false;
        }
      }
    }

    return true;
  };

  const handleMarketValueUpdate = async () => {
    if (!holding || !formData.market_value) return;

    // Determine which account to update
    const targetAccountId =
      accountId ||
      (() => {
        // If no specific account, try to find the first account for this investment
        const investmentAccountMapping = buildInvestmentAccountMapping();
        return investmentAccountMapping.get(holding.id);
      })();

    if (!targetAccountId) {
      toast({
        title: "Error",
        description:
          "Cannot determine which account to update. Please try editing from the account-specific row.",
        variant: "destructive",
      });
      return;
    }

    const inputValue = parseFloat(formData.market_value);
    if (isNaN(inputValue) || inputValue <= 0) {
      toast({
        title: "Invalid Market Value",
        description: "Please enter a valid market value greater than 0.",
        variant: "destructive",
      });
      return;
    }

    // Convert to GBP if needed (since market values are stored in GBP)
    const marketValueGBP = convertToGBP(
      inputValue,
      formData.market_value_currency,
    );

    setMarketValueLoading(true);

    try {
      const result = await updateInvestmentMarketValue(
        holding.id,
        marketValueGBP,
        targetAccountId,
      );

      if (result.success) {
        const accountName =
          accounts.find((a) => a.id === targetAccountId)?.name ||
          "selected account";
        const displayFormat = formatDisplayValue(
          marketValueGBP,
          formData.market_value_currency,
        );

        toast({
          title: "Success!",
          description: `Market value updated to ${displayFormat.display} for ${holding.ticker} in ${accountName}.`,
        });
        onSave(); // Refresh data
      } else {
        throw result.error || new Error("Update failed");
      }
    } catch (error) {
      console.error("Market value update error:", error);
      toast({
        title: "Error",
        description: "Failed to update market value.",
        variant: "destructive",
      });
    } finally {
      setMarketValueLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    if (!validateForm()) return;

    setLoading(true);

    try {
      let investmentId = holding?.id;

      if (holding) {
        // Update existing holding
        const holdingData = {
          user_id: user.id,
          ticker: formData.ticker.toUpperCase().trim(),
          investment_type: formData.investment_type,
        };

        const { error: updateError } = await supabase
          .from("investments")
          .update(holdingData)
          .eq("id", holding.id);

        if (updateError) throw updateError;
      } else {
        // For new holdings, check if investment record already exists for this ticker
        const { data: existingInvestment, error: checkError } = await supabase
          .from("investments")
          .select("id")
          .eq("user_id", user.id)
          .eq("ticker", formData.ticker.toUpperCase().trim())
          .single();

        if (checkError && checkError.code !== "PGRST116") {
          // PGRST116 is "not found" - any other error is a real problem
          throw checkError;
        }

        if (existingInvestment) {
          // Investment record exists - reuse it
          investmentId = existingInvestment.id;
          console.log(
            `Reusing existing investment record for ${formData.ticker}`,
          );
        } else {
          // Create new investment record
          const holdingData = {
            user_id: user.id,
            ticker: formData.ticker.toUpperCase().trim(),
            investment_type: formData.investment_type,
          };

          const { data: newInvestment, error: insertError } = await supabase
            .from("investments")
            .insert(holdingData)
            .select()
            .single();

          if (insertError) throw insertError;
          investmentId = newInvestment.id;
          console.log(`Created new investment record for ${formData.ticker}`);
        }

        // Create an initial transaction to link the investment to the selected account
        // First, find the "Investment" category
        const { data: investmentCategory } = await supabase
          .from("categories")
          .select("id")
          .eq("name", "Investment")
          .eq("user_id", user.id)
          .single();

        if (investmentCategory) {
          // Create a placeholder transaction to establish the account relationship
          const { error: transactionError } = await supabase
            .from("transactions")
            .insert({
              user_id: user.id,
              date: new Date().toISOString().split("T")[0], // Today's date
              description: `Account setup - ${formData.ticker}`,
              amount: 0, // Placeholder amount
              currency: "GBP",
              amount_gbp: 0,
              exchange_rate: 1.0,
              category_id: investmentCategory.id,
              account_id: formData.account_id,
              transaction_type: "expense",
              investment_id: investmentId,
            });

          if (transactionError) {
            console.warn(
              "Failed to create initial transaction:",
              transactionError,
            );
            // Continue anyway - the investment was created successfully
          }
        }
      }

      // If market value was provided and this is an edit, update it
      if (holding && formData.market_value) {
        const targetAccountId =
          accountId || buildInvestmentAccountMapping().get(holding.id);
        if (targetAccountId) {
          const inputValue = parseFloat(formData.market_value);
          if (!isNaN(inputValue) && inputValue > 0) {
            const marketValueGBP = convertToGBP(
              inputValue,
              formData.market_value_currency,
            );
            await updateInvestmentMarketValue(
              holding.id,
              marketValueGBP,
              targetAccountId,
            );
          }
        }
      }

      // If market value was provided for a new holding, create initial market value
      if (
        !holding &&
        formData.market_value &&
        investmentId &&
        formData.account_id
      ) {
        const inputValue = parseFloat(formData.market_value);
        if (!isNaN(inputValue) && inputValue > 0) {
          const marketValueGBP = convertToGBP(
            inputValue,
            formData.market_value_currency,
          );
          await updateInvestmentMarketValue(
            investmentId,
            marketValueGBP,
            formData.account_id,
          );
        }
      }

      toast({
        title: "Success!",
        description: `Holding ${holding ? "updated" : "added to account"} successfully.`,
      });

      onSave();
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Error",
        description: `Failed to ${holding ? "update" : "add"} holding.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getModalTitle = () => {
    if (holding && accountId) {
      return "✏️ Edit Account Holding";
    } else if (holding) {
      return "✏️ Edit Holding";
    } else {
      return "➕ Add New Holding";
    }
  };

  const getModalDescription = () => {
    if (holding && accountId) {
      const selectedAccount = accounts.find((acc) => acc.id === accountId);
      return `Editing ${holding.ticker} in ${selectedAccount?.name || "selected account"}`;
    }
    return null;
  };

  // Filter accounts for investment-related types
  const getInvestmentAccounts = () => {
    return accounts.filter(
      (account) =>
        account.account_type === "investment" ||
        account.account_type === "brokerage" ||
        account.name?.toLowerCase().includes("investment") ||
        account.name?.toLowerCase().includes("brokerage") ||
        account.name?.toLowerCase().includes("trading"),
    );
  };

  const investmentAccounts = getInvestmentAccounts();

  // Helper to show exchange rate preview
  const getExchangeRatePreview = () => {
    if (!formData.market_value || formData.market_value_currency === "GBP")
      return null;

    const inputValue = parseFloat(formData.market_value);
    if (isNaN(inputValue)) return null;

    const gbpValue = convertToGBP(inputValue, formData.market_value_currency);
    return `≈ £${gbpValue.toFixed(2)} (using ${USD_TO_GBP_RATE} USD/GBP rate)`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">{getModalTitle()}</DialogTitle>
          {getModalDescription() && (
            <p className="text-sm text-muted-foreground">
              {getModalDescription()}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Account Selection - Only show for new holdings */}
          {!holding && (
            <div className="space-y-2">
              <Label htmlFor="account_id" className="text-sm font-medium">
                Investment Account *
              </Label>
              <Select
                value={formData.account_id}
                onValueChange={(value) =>
                  handleInputChange("account_id", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an account..." />
                </SelectTrigger>
                <SelectContent>
                  {investmentAccounts.length > 0 ? (
                    investmentAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <div className="flex items-center gap-2">
                          <span>{account.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {account.account_type || "Investment"}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No investment accounts found
                    </div>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose which account this holding belongs to
              </p>
              {investmentAccounts.length === 0 && (
                <p className="text-xs text-amber-600">
                  ⚠️ No investment accounts detected. You may need to create an
                  investment account first.
                </p>
              )}
            </div>
          )}

          {/* Show account info for existing holdings */}
          {holding && accountId && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Account:</span>
                <Badge variant="secondary">
                  {accounts.find((acc) => acc.id === accountId)?.name ||
                    "Selected Account"}
                </Badge>
              </div>
            </div>
          )}

          {/* Ticker Symbol */}
          <div className="space-y-2">
            <Label htmlFor="ticker" className="text-sm font-medium">
              Ticker Symbol *
            </Label>
            <Input
              id="ticker"
              value={formData.ticker}
              onChange={(e) => handleInputChange("ticker", e.target.value)}
              placeholder="e.g., AAPL, VTSAX, MSFT"
              className="text-center font-mono text-lg"
              maxLength={10}
            />
            <p className="text-xs text-muted-foreground">
              Enter the ticker symbol for this investment
            </p>
          </div>

          {/* Investment Type */}
          <div className="space-y-2">
            <Label htmlFor="investment_type" className="text-sm font-medium">
              Investment Type *
            </Label>
            <Select
              value={formData.investment_type}
              onValueChange={(value) =>
                handleInputChange("investment_type", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select investment type..." />
              </SelectTrigger>
              <SelectContent>
                {INVESTMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose the category that best describes this investment
            </p>
          </div>

          {/* Market Value with Currency Selection */}
          <div className="space-y-2">
            <Label htmlFor="market_value" className="text-sm font-medium">
              Current Market Value
              {!holding && " (Optional)"}
              {accountId && (
                <Badge variant="outline" className="ml-2 text-xs">
                  Account Specific
                </Badge>
              )}
            </Label>
            <div className="flex gap-2">
              {/* Currency Selection */}
              <Select
                value={formData.market_value_currency}
                onValueChange={(value) =>
                  handleInputChange("market_value_currency", value)
                }
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GBP">£</SelectItem>
                  <SelectItem value="USD">$</SelectItem>
                </SelectContent>
              </Select>

              {/* Amount Input */}
              <div className="relative flex-1">
                <Input
                  id="market_value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.market_value}
                  onChange={(e) =>
                    handleInputChange("market_value", e.target.value)
                  }
                  placeholder="0.00"
                />
              </div>

              {holding && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleMarketValueUpdate}
                  disabled={marketValueLoading || !formData.market_value}
                  className="shrink-0"
                >
                  {marketValueLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      Update
                    </>
                  ) : (
                    "Update Now"
                  )}
                </Button>
              )}
            </div>

            {/* Exchange Rate Preview */}
            {getExchangeRatePreview() && (
              <p className="text-xs text-blue-600 font-medium">
                {getExchangeRatePreview()}
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              {holding && accountId
                ? "Update market value for this ticker in this specific account"
                : holding
                  ? "Update current market value to today's date"
                  : "Set initial market value (you can update this later)"}
            </p>
            {holding && holding.current_market_value > 0 && (
              <p className="text-xs text-muted-foreground">
                Current:{" "}
                {new Intl.NumberFormat("en-GB", {
                  style: "currency",
                  currency: "GBP",
                }).format(holding.current_market_value)}
                {holding.market_value_updated_at && (
                  <span className="ml-1">
                    (updated{" "}
                    {new Date(
                      holding.market_value_updated_at,
                    ).toLocaleDateString("en-GB")}
                    )
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Existing Holdings Reference - Show account context */}
          {!holding && existingHoldings.length > 0 && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Existing holdings by account:
              </p>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {(() => {
                  try {
                    const investmentAccountMapping =
                      buildInvestmentAccountMapping();
                    const groupedByAccount: Record<string, string[]> = {};

                    existingHoldings.forEach((holding) => {
                      const accountId = investmentAccountMapping.get(
                        holding.id,
                      );
                      const accountName =
                        accounts.find((a) => a.id === accountId)?.name ||
                        "Unknown";

                      if (!groupedByAccount[accountName]) {
                        groupedByAccount[accountName] = [];
                      }
                      groupedByAccount[accountName].push(holding.ticker);
                    });

                    return Object.entries(groupedByAccount).map(
                      ([accountName, tickers]) => (
                        <div key={accountName} className="text-xs">
                          <span className="font-medium text-muted-foreground">
                            {accountName}:
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {tickers.map((ticker, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="text-xs"
                              >
                                {ticker}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ),
                    );
                  } catch (error) {
                    return (
                      <div className="flex flex-wrap gap-2">
                        {existingHoldings.slice(0, 8).map((h) => (
                          <Badge
                            key={h.id}
                            variant="outline"
                            className="text-xs"
                          >
                            {h.ticker}
                          </Badge>
                        ))}
                      </div>
                    );
                  }
                })()}
              </div>
              <p className="text-xs text-muted-foreground mt-2 italic">
                Same ticker can exist in different accounts
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading} className="flex-1">
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : holding ? (
              "Update Holding"
            ) : (
              "Create Holding"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
