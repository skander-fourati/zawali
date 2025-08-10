import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, Building } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";

// Types
interface Account {
  id: string;
  user_id: string;
  name: string;
  account_type: string;
  currency: string;
  created_at: string;
  updated_at: string;
  transaction_count?: number;
}

interface AccountFormData {
  name: string;
  account_type: string;
  currency: string;
}

// Account type mapping
const ACCOUNT_TYPES = [
  { value: "checking", label: "Checking" },
  { value: "savings", label: "Savings" },
  { value: "credit", label: "Credit Card" },
  { value: "investment", label: "Investment" },
  { value: "other", label: "Other" },
];

// Currency options
const CURRENCIES = [
  { value: "USD", label: "USD" },
  { value: "GBP", label: "GBP" },
];

const AccountManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Account state
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [reassignToAccountId, setReassignToAccountId] = useState<string | null>(
    null,
  );

  // Forms
  const addForm = useForm<AccountFormData>({
    defaultValues: {
      name: "",
      account_type: "",
      currency: "",
    },
  });

  const editForm = useForm<AccountFormData>({
    defaultValues: {
      name: "",
      account_type: "",
      currency: "",
    },
  });

  // Helper function to get account type label
  const getAccountTypeLabel = (value: string) => {
    const type = ACCOUNT_TYPES.find((t) => t.value === value);
    return type ? type.label : value;
  };

  // Fetch accounts with transaction counts
  const fetchAccounts = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get accounts
      const { data: accountsData, error: accountsError } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      if (accountsError) throw accountsError;

      // Get transaction counts for each account
      const accountsWithCounts = await Promise.all(
        (accountsData || []).map(async (account) => {
          const { count, error: countError } = await supabase
            .from("transactions")
            .select("id", { count: "exact" })
            .eq("account_id", account.id);

          if (countError) {
            console.error("Error counting transactions:", countError);
            return { ...account, transaction_count: 0 };
          }

          return { ...account, transaction_count: count || 0 };
        }),
      );

      setAccounts(accountsWithCounts);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      toast({
        title: "Error",
        description: "Failed to load accounts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [user]);

  // Add new account
  const onAddAccount = async (data: AccountFormData) => {
    if (!user) return;

    try {
      // Check for duplicate names
      const existing = accounts.find(
        (a) => a.name.toLowerCase() === data.name.toLowerCase(),
      );
      if (existing) {
        addForm.setError("name", {
          message: "An account with this name already exists",
        });
        return;
      }

      const { error } = await supabase.from("accounts").insert([
        {
          user_id: user.id,
          name: data.name,
          account_type: data.account_type,
          currency: data.currency,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Account "${data.name}" created successfully`,
      });

      setIsAddDialogOpen(false);
      addForm.reset();
      fetchAccounts();
    } catch (error) {
      console.error("Error adding account:", error);
      toast({
        title: "Error",
        description: "Failed to create account",
        variant: "destructive",
      });
    }
  };

  // Edit account
  const onEditAccount = async (data: AccountFormData) => {
    if (!editingAccount || !user) return;

    try {
      // Check for duplicate names (excluding current account)
      const existing = accounts.find(
        (a) =>
          a.name.toLowerCase() === data.name.toLowerCase() &&
          a.id !== editingAccount.id,
      );
      if (existing) {
        editForm.setError("name", {
          message: "An account with this name already exists",
        });
        return;
      }

      const { error } = await supabase
        .from("accounts")
        .update({
          name: data.name,
          account_type: data.account_type,
          currency: data.currency,
        })
        .eq("id", editingAccount.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Account "${data.name}" updated successfully`,
      });

      setIsEditDialogOpen(false);
      setEditingAccount(null);
      editForm.reset();
      fetchAccounts();
    } catch (error) {
      console.error("Error editing account:", error);
      toast({
        title: "Error",
        description: "Failed to update account",
        variant: "destructive",
      });
    }
  };

  // Delete account
  const onDeleteAccount = async () => {
    if (!deletingAccount) return;

    try {
      // If reassigning, update all transactions first
      if (reassignToAccountId && reassignToAccountId !== "null") {
        const { error: updateError } = await supabase
          .from("transactions")
          .update({ account_id: reassignToAccountId })
          .eq("account_id", deletingAccount.id);

        if (updateError) throw updateError;
      } else {
        // Set transactions to null (no account)
        const { error: updateError } = await supabase
          .from("transactions")
          .update({ account_id: null })
          .eq("account_id", deletingAccount.id);

        if (updateError) throw updateError;
      }

      // Now delete the account
      const { error } = await supabase
        .from("accounts")
        .delete()
        .eq("id", deletingAccount.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Account "${deletingAccount.name}" deleted successfully`,
      });

      setIsDeleteDialogOpen(false);
      setDeletingAccount(null);
      setReassignToAccountId(null);
      fetchAccounts();
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "Error",
        description: "Failed to delete account",
        variant: "destructive",
      });
    }
  };

  // Open edit dialog
  const openEditDialog = (account: Account) => {
    setEditingAccount(account);
    editForm.reset({
      name: account.name,
      account_type: account.account_type,
      currency: account.currency,
    });
    setIsEditDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (account: Account) => {
    setDeletingAccount(account);
    setReassignToAccountId(null);
    setIsDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-4">Loading accounts...</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Financial Accounts ({accounts.length})
        </CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Account</DialogTitle>
            </DialogHeader>
            <Form {...addForm}>
              <form
                onSubmit={addForm.handleSubmit(onAddAccount)}
                className="space-y-4"
              >
                <FormField
                  control={addForm.control}
                  name="name"
                  rules={{ required: "Account name is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., HSBC Checking, Savings Account"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="account_type"
                  rules={{ required: "Account type is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select account type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ACCOUNT_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="currency"
                  rules={{ required: "Currency is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CURRENCIES.map((currency) => (
                            <SelectItem
                              key={currency.value}
                              value={currency.value}
                            >
                              {currency.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Add Account
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Building className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>No accounts found. Add your first account to get started!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <Building className="w-3 h-3 text-green-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{account.name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>
                        {getAccountTypeLabel(account.account_type)} •{" "}
                        {account.currency}
                      </div>
                      <div>
                        Used in {account.transaction_count || 0} transactions
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditDialog(account)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openDeleteDialog(account)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Edit Account Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(onEditAccount)}
              className="space-y-4"
            >
              <FormField
                control={editForm.control}
                name="name"
                rules={{ required: "Account name is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="account_type"
                rules={{ required: "Account type is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ACCOUNT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="currency"
                rules={{ required: "Currency is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CURRENCIES.map((currency) => (
                          <SelectItem
                            key={currency.value}
                            value={currency.value}
                          >
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Update Account
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Are you sure you want to delete the account{" "}
              <strong>"{deletingAccount?.name}"</strong>?
            </p>
            {deletingAccount && deletingAccount.transaction_count > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Warning:</strong> This account is used by{" "}
                  {deletingAccount.transaction_count} transactions.
                </p>
                <p className="text-sm text-yellow-700 mt-2">
                  You can either reassign these transactions to another account
                  or leave them without an account.
                </p>
                <div className="mt-3">
                  <Select
                    value={reassignToAccountId || "null"}
                    onValueChange={setReassignToAccountId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Reassign transactions to..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="null">
                        Leave without account
                      </SelectItem>
                      {accounts
                        .filter((a) => a.id !== deletingAccount.id)
                        .map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={onDeleteAccount}
                className="flex-1"
              >
                Delete Account
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AccountManagement;
