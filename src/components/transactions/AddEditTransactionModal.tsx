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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface FamilyMember {
  id: string;
  name: string;
  color: string;
  status: string;
}

interface AddEditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  transaction?: any;
  categories: any[];
  accounts: any[];
  trips: any[];
}

export function AddEditTransactionModal({
  isOpen,
  onClose,
  onSave,
  transaction,
  categories,
  accounts,
  trips,
}: AddEditTransactionModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    date: "",
    description: "",
    amount_gbp: "",
    currency: "GBP",
    amount: "",
    category_id: "",
    account_id: "",
    trip_id: "",
    family_member_id: "",
    encord_expensable: false,
    transaction_type: "expense",
  });

  const [loading, setLoading] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);

  // Find Family Transfer category
  const familyTransferCategory = categories.find(
    (cat) => cat.name === "Family Transfer",
  );
  const isFamilyTransfer = formData.category_id === familyTransferCategory?.id;

  // Fetch family members when modal opens
  useEffect(() => {
    if (isOpen && user) {
      fetchFamilyMembers();
    }
  }, [isOpen, user]);

  const fetchFamilyMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("family_members")
        .select("*")
        .eq("user_id", user?.id)
        .eq("status", "active")
        .order("name");

      if (error) throw error;
      setFamilyMembers(data || []);
    } catch (error) {
      console.error("Error fetching family members:", error);
    }
  };

  // Reset form when transaction changes or modal opens
  useEffect(() => {
    if (transaction) {
      setFormData({
        date: transaction.date || "",
        description: transaction.description || "",
        amount_gbp: transaction.amount_gbp?.toString() || "",
        currency: transaction.currency || "GBP",
        amount: transaction.amount?.toString() || "",
        category_id: transaction.category_id || "none",
        account_id: transaction.account_id || "none",
        trip_id: transaction.trip_id || "none",
        family_member_id: transaction.family_member_id || "none",
        encord_expensable: transaction.encord_expensable || false,
        transaction_type: transaction.transaction_type || "expense",
      });
    } else {
      // For new transactions, default to today's date
      const today = new Date().toISOString().split("T")[0];
      setFormData({
        date: today,
        description: "",
        amount_gbp: "",
        currency: "GBP",
        amount: "",
        category_id: "none",
        account_id: "none",
        trip_id: "none",
        family_member_id: "none",
        encord_expensable: false,
        transaction_type: "expense",
      });
    }
  }, [transaction, isOpen]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Auto-calculate amount_gbp if currency changes
    if (field === "amount" || field === "currency") {
      const amount = field === "amount" ? value : formData.amount;
      const currency = field === "currency" ? value : formData.currency;

      if (amount && currency) {
        if (currency === "GBP") {
          setFormData((prev) => ({ ...prev, amount_gbp: amount }));
        } else if (currency === "USD") {
          // Use a simple exchange rate for now
          const gbpAmount = (parseFloat(amount) * 0.79).toFixed(2);
          setFormData((prev) => ({ ...prev, amount_gbp: gbpAmount }));
        }
      }
    }

    // Auto-set transaction type for Family Transfer
    if (field === "category_id" && value === familyTransferCategory?.id) {
      setFormData((prev) => ({ ...prev, transaction_type: "transfer" }));
    }

    // Clear family member and reset transaction type if not Family Transfer
    if (field === "category_id" && value !== familyTransferCategory?.id) {
      setFormData((prev) => ({
        ...prev,
        family_member_id: "none",
        transaction_type: "expense", // Default back to expense for non-family transfers
      }));
    }
  };

  const handleSave = async () => {
    if (!user) return;

    // Basic validation
    if (!formData.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Description is required.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.amount_gbp || isNaN(parseFloat(formData.amount_gbp))) {
      toast({
        title: "Validation Error",
        description: "Valid amount is required.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.date) {
      toast({
        title: "Validation Error",
        description: "Date is required.",
        variant: "destructive",
      });
      return;
    }

    // Family Transfer specific validation
    if (
      isFamilyTransfer &&
      (!formData.family_member_id || formData.family_member_id === "none")
    ) {
      toast({
        title: "Validation Error",
        description:
          "Please select a family member for Family Transfer transactions.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const transactionData = {
        user_id: user.id,
        date: formData.date,
        description: formData.description.trim(),
        amount: formData.amount
          ? parseFloat(formData.amount)
          : parseFloat(formData.amount_gbp),
        currency: formData.currency,
        amount_gbp: parseFloat(formData.amount_gbp),
        exchange_rate: formData.currency === "USD" ? 0.79 : 1.0,
        category_id:
          formData.category_id === "none" ? null : formData.category_id || null,
        account_id:
          formData.account_id === "none" ? null : formData.account_id || null,
        trip_id: formData.trip_id === "none" ? null : formData.trip_id || null,
        family_member_id:
          formData.family_member_id === "none"
            ? null
            : formData.family_member_id || null,
        encord_expensable: formData.encord_expensable,
        transaction_type: formData.transaction_type,
      };

      let error;

      if (transaction) {
        // @ts-ignore
        const { error: updateError } = await supabase
          .from("transactions")
          .update(transactionData)
          .eq("id", transaction.id);
        error = updateError;
      } else {
        // @ts-ignore
        const { error: insertError } = await supabase
          .from("transactions")
          .insert(transactionData);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Success!",
        description: `Transaction ${transaction ? "updated" : "created"} successfully.`,
      });

      onSave();
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Error",
        description: `Failed to ${transaction ? "update" : "create"} transaction.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {transaction ? "Edit Transaction" : "Add New Transaction"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange("date", e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Enter transaction description..."
            />
          </div>

          {/* Amount and Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => handleInputChange("currency", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount ({formData.currency})</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={
                  formData.currency === "GBP"
                    ? formData.amount_gbp
                    : formData.amount
                }
                onChange={(e) => handleInputChange("amount", e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* GBP Amount (if different currency) */}
          {formData.currency !== "GBP" && (
            <div className="space-y-2">
              <Label htmlFor="amount_gbp">Amount (GBP) - Converted</Label>
              <Input
                id="amount_gbp"
                type="number"
                step="0.01"
                value={formData.amount_gbp}
                onChange={(e) =>
                  handleInputChange("amount_gbp", e.target.value)
                }
                placeholder="0.00"
              />
            </div>
          )}

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) =>
                handleInputChange("category_id", value === "none" ? "" : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Category</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Family Member (conditional) */}
          {isFamilyTransfer && (
            <div className="space-y-2">
              <Label htmlFor="family_member">Family Member</Label>
              <Select
                value={formData.family_member_id}
                onValueChange={(value) =>
                  handleInputChange("family_member_id", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select family member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select family member</SelectItem>
                  {familyMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: member.color }}
                        />
                        {member.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {familyMembers.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No active family members found. Add family members in Settings
                  → Manage Data → Family.
                </p>
              )}
            </div>
          )}

          {/* Account */}
          <div className="space-y-2">
            <Label htmlFor="account">Account</Label>
            <Select
              value={formData.account_id}
              onValueChange={(value) =>
                handleInputChange("account_id", value === "none" ? "" : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Account</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Trip (if available) */}
          {trips.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="trip">Trip (Optional)</Label>
              <Select
                value={formData.trip_id}
                onValueChange={(value) =>
                  handleInputChange("trip_id", value === "none" ? "" : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select trip" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Trip</SelectItem>
                  {trips.map((trip) => (
                    <SelectItem key={trip.id} value={trip.id}>
                      {trip.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Encord Expensable */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="encord"
              checked={formData.encord_expensable}
              onChange={(e) =>
                handleInputChange("encord_expensable", e.target.checked)
              }
              className="w-4 h-4"
            />
            <Label
              htmlFor="encord"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Encord Expensable
            </Label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-6">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading} className="flex-1">
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : transaction ? (
              "Update Transaction"
            ) : (
              "Create Transaction"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
