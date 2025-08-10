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

interface AddEditHoldingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  holding?: any;
  existingHoldings: any[];
}

export function AddEditHoldingModal({
  isOpen,
  onClose,
  onSave,
  holding,
  existingHoldings,
}: AddEditHoldingModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    ticker: "",
    investment_type: "",
  });

  const [loading, setLoading] = useState(false);

  // Reset form when holding changes or modal opens
  useEffect(() => {
    if (holding) {
      setFormData({
        ticker: holding.ticker || "",
        investment_type: holding.investment_type || "",
      });
    } else {
      setFormData({
        ticker: "",
        investment_type: "",
      });
    }
  }, [holding, isOpen]);

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

    // Check for duplicate ticker (only for new holdings)
    if (!holding) {
      const duplicateTicker = existingHoldings.find(
        (h) => h.ticker.toLowerCase() === formData.ticker.toLowerCase(),
      );
      if (duplicateTicker) {
        toast({
          title: "Validation Error",
          description: `A holding with ticker "${formData.ticker}" already exists.`,
          variant: "destructive",
        });
        return false;
      }
    }

    // Check for duplicate ticker when editing (but exclude current holding)
    if (holding) {
      const duplicateTicker = existingHoldings.find(
        (h) =>
          h.ticker.toLowerCase() === formData.ticker.toLowerCase() &&
          h.id !== holding.id,
      );
      if (duplicateTicker) {
        toast({
          title: "Validation Error",
          description: `A holding with ticker "${formData.ticker}" already exists.`,
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!user) return;

    if (!validateForm()) return;

    setLoading(true);

    try {
      const holdingData = {
        user_id: user.id,
        ticker: formData.ticker.toUpperCase().trim(),
        investment_type: formData.investment_type,
      };

      let error;

      if (holding) {
        // Update existing holding
        const { error: updateError } = await supabase
          .from("investments")
          .update(holdingData)
          .eq("id", holding.id);
        error = updateError;
      } else {
        // Create new holding
        const { error: insertError } = await supabase
          .from("investments")
          .insert(holdingData);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Success!",
        description: `Holding ${holding ? "updated" : "created"} successfully.`,
      });

      onSave();
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Error",
        description: `Failed to ${holding ? "update" : "create"} holding.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {holding ? "✏️ Edit Holding" : "➕ Add New Holding"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
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

          {/* Existing Holdings Reference */}
          {!holding && existingHoldings.length > 0 && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Existing holdings:
              </p>
              <div className="flex flex-wrap gap-2">
                {existingHoldings.slice(0, 8).map((h) => (
                  <Badge key={h.id} variant="outline" className="text-xs">
                    {h.ticker}
                  </Badge>
                ))}
                {existingHoldings.length > 8 && (
                  <Badge variant="outline" className="text-xs">
                    +{existingHoldings.length - 8} more
                  </Badge>
                )}
              </div>
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
