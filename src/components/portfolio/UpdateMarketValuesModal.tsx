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
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  ArrowRight,
  SkipForward,
  Save,
  X,
} from "lucide-react";
import { Investment } from "@/hooks/useTransactions";

interface UpdateMarketValuesModalProps {
  isOpen: boolean;
  onClose: () => void;
  investments: Investment[];
  onUpdateMarketValue: (
    investmentId: string,
    marketValue: number,
  ) => Promise<{ success: boolean; error?: any }>;
}

export function UpdateMarketValuesModal({
  isOpen,
  onClose,
  investments,
  onUpdateMarketValue,
}: UpdateMarketValuesModalProps) {
  const { toast } = useToast();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [marketValue, setMarketValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [updatedCount, setUpdatedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);

  // Filter investments that need updating (not updated in last 24 hours)
  const investmentsToUpdate = investments.filter((inv) => {
    if (!inv.market_value_updated_at) return true;

    const lastUpdated = new Date(inv.market_value_updated_at);
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    return lastUpdated < twentyFourHoursAgo;
  });

  const totalInvestments = investmentsToUpdate.length;
  const currentInvestment = investmentsToUpdate[currentIndex];
  const hasInvestments = totalInvestments > 0;
  const isLastInvestment = currentIndex === totalInvestments - 1;
  const progress =
    totalInvestments > 0 ? ((currentIndex + 1) / totalInvestments) * 100 : 0;

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setMarketValue("");
      setUpdatedCount(0);
      setSkippedCount(0);

      // Pre-populate with current market value if available
      if (hasInvestments && currentInvestment?.current_market_value) {
        setMarketValue(currentInvestment.current_market_value.toString());
      }
    }
  }, [isOpen, hasInvestments]);

  // Update market value field when current investment changes
  useEffect(() => {
    if (currentInvestment?.current_market_value) {
      setMarketValue(currentInvestment.current_market_value.toString());
    } else {
      setMarketValue("");
    }
  }, [currentInvestment]);

  const handleSaveAndNext = async () => {
    if (!currentInvestment || !marketValue || isNaN(parseFloat(marketValue))) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid market value.",
        variant: "destructive",
      });
      return;
    }

    const numericValue = parseFloat(marketValue);
    if (numericValue <= 0) {
      toast({
        title: "Validation Error",
        description: "Market value must be greater than zero.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const result = await onUpdateMarketValue(
        currentInvestment.id,
        numericValue,
      );

      if (!result.success) {
        throw result.error;
      }

      setUpdatedCount((prev) => prev + 1);

      toast({
        title: "Market Value Updated",
        description: `Updated ${currentInvestment.ticker} to £${numericValue.toLocaleString()}`,
      });

      if (isLastInvestment) {
        // All done
        toast({
          title: "All Updates Complete!",
          description: `Updated ${updatedCount + 1} investments, skipped ${skippedCount}.`,
        });
        onClose();
      } else {
        // Move to next investment
        setCurrentIndex((prev) => prev + 1);
        setMarketValue("");
      }
    } catch (error) {
      console.error("Error updating market value:", error);
      toast({
        title: "Update Failed",
        description: `Failed to update ${currentInvestment.ticker}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    setSkippedCount((prev) => prev + 1);

    if (isLastInvestment) {
      // All done
      toast({
        title: "Updates Complete!",
        description: `Updated ${updatedCount} investments, skipped ${skippedCount + 1}.`,
      });
      onClose();
    } else {
      // Move to next investment
      setCurrentIndex((prev) => prev + 1);
      setMarketValue("");
    }
  };

  const handleCancel = () => {
    if (updatedCount > 0) {
      toast({
        title: "Progress Saved",
        description: `Your ${updatedCount} updates have been saved.`,
      });
    }
    onClose();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateReturn = () => {
    if (
      !currentInvestment ||
      !marketValue ||
      !currentInvestment.total_invested
    ) {
      return { amount: 0, percentage: 0, isPositive: true };
    }

    const newMarketValue = parseFloat(marketValue);
    const totalInvested = Math.abs(currentInvestment.total_invested);
    const returnAmount = newMarketValue - totalInvested;
    const returnPercentage =
      totalInvested > 0 ? (returnAmount / totalInvested) * 100 : 0;

    return {
      amount: returnAmount,
      percentage: returnPercentage,
      isPositive: returnAmount >= 0,
    };
  };

  const returnInfo = calculateReturn();

  if (!hasInvestments) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Market Values</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">
              All investments are up to date!
            </p>
            <p className="text-sm text-muted-foreground">
              All market values have been updated within the last 24 hours.
            </p>
          </div>
          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Update Market Values
            <Badge variant="outline">
              {currentIndex + 1} of {totalInvestments}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Current Investment Info */}
          <div className="bg-muted/50 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  {currentInvestment.ticker}
                </h3>
                <Badge variant="secondary">
                  {currentInvestment.investment_type}
                </Badge>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">
                  Current Market Value
                </div>
                <div className="text-lg font-semibold">
                  {currentInvestment.current_market_value
                    ? formatCurrency(currentInvestment.current_market_value)
                    : "Not set"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Total Invested</div>
                <div className="font-medium">
                  {formatCurrency(
                    Math.abs(currentInvestment.total_invested || 0),
                  )}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Transactions</div>
                <div className="font-medium">
                  {currentInvestment.transaction_count || 0}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Last Updated</div>
                <div className="font-medium">
                  {currentInvestment.market_value_updated_at
                    ? formatDate(currentInvestment.market_value_updated_at)
                    : "Never"}
                </div>
              </div>
            </div>
          </div>

          {/* New Market Value Input */}
          <div className="space-y-2">
            <Label htmlFor="market_value">New Market Value (GBP)</Label>
            <Input
              id="market_value"
              type="number"
              step="0.01"
              value={marketValue}
              onChange={(e) => setMarketValue(e.target.value)}
              placeholder="0.00"
              className="text-lg"
            />
          </div>

          {/* Return Preview */}
          {marketValue &&
            !isNaN(parseFloat(marketValue)) &&
            currentInvestment.total_invested && (
              <div
                className={`flex items-center gap-2 p-3 rounded-lg ${
                  returnInfo.isPositive
                    ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800"
                    : "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
                }`}
              >
                {returnInfo.isPositive ? (
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                )}
                <span
                  className={`text-sm font-medium ${
                    returnInfo.isPositive
                      ? "text-green-700 dark:text-green-300"
                      : "text-red-700 dark:text-red-300"
                  }`}
                >
                  {returnInfo.isPositive ? "Gain" : "Loss"}:{" "}
                  {formatCurrency(Math.abs(returnInfo.amount))} (
                  {returnInfo.percentage.toFixed(2)}%)
                </span>
              </div>
            )}

          {/* Stats */}
          <div className="flex justify-between text-sm text-muted-foreground bg-muted/30 rounded p-3">
            <span>Updated: {updatedCount}</span>
            <span>Skipped: {skippedCount}</span>
            <span>Remaining: {totalInvestments - currentIndex - 1}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={handleCancel} className="flex-1">
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button variant="outline" onClick={handleSkip} className="flex-1">
            <SkipForward className="h-4 w-4 mr-2" />
            Skip
          </Button>
          <Button
            onClick={handleSaveAndNext}
            disabled={loading || !marketValue || isNaN(parseFloat(marketValue))}
            className="flex-1"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : isLastInvestment ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save & Finish
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4 mr-2" />
                Save & Next
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
