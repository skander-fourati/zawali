import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { parsePersonalCapitalCSV, parseMoneyHubCSV, type ParsedTransaction } from "@/lib/csv-parser";
import { useToast } from "@/hooks/use-toast";

interface TransactionUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransactionsUploaded: () => void;
}

type CSVType = "personal-capital" | "moneyhub";

export function TransactionUploadModal({ isOpen, onClose, onTransactionsUploaded }: TransactionUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [csvType, setCsvType] = useState<CSVType | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);
  const [step, setStep] = useState<"upload" | "preview" | "processing" | "complete">("upload");
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      setStep("upload");
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file",
        variant: "destructive",
      });
    }
  };

  const handlePreview = async () => {
    if (!file || !csvType) return;

    try {
      const text = await file.text();
      let parsed: ParsedTransaction[];
      
      if (csvType === "personal-capital") {
        parsed = parsePersonalCapitalCSV(text);
      } else {
        parsed = parseMoneyHubCSV(text);
      }

      setParsedTransactions(parsed);
      setStep("preview");
    } catch (error) {
      toast({
        title: "Parsing error",
        description: "Failed to parse CSV file. Please check the format.",
        variant: "destructive",
      });
    }
  };

  const handleUpload = async () => {
    if (parsedTransactions.length === 0) return;

    setIsProcessing(true);
    setStep("processing");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Create default categories if they don't exist
      await ensureDefaultCategories(user.id);
      
      // Create default accounts if they don't exist  
      await ensureDefaultAccounts(user.id);

      // Get category and account mappings
      const { data: categories } = await supabase
        .from("categories")
        .select("id, name")
        .eq("user_id", user.id);

      const { data: accounts } = await supabase
        .from("accounts")
        .select("id, name")
        .eq("user_id", user.id);

      // Insert transactions
      const transactionInserts = parsedTransactions.map(tx => {
        const category = categories?.find(c => c.name.toLowerCase() === tx.category.toLowerCase());
        const account = accounts?.find(a => a.name === tx.account);

        return {
          user_id: user.id,
          account_id: account?.id,
          category_id: category?.id,
          date: tx.date,
          description: tx.description,
          amount: tx.currency === "USD" ? tx.amount_usd : tx.amount_gbp,
          currency: tx.currency,
          amount_gbp: tx.amount_gbp,
          exchange_rate: tx.currency === "USD" ? 0.79 : 1.0, // 5-year average USD to GBP
          transaction_type: tx.amount_gbp > 0 ? "income" : "expense"
        };
      });

      const { error } = await supabase
        .from("transactions")
        .insert(transactionInserts);

      if (error) throw error;

      setStep("complete");
      toast({
        title: "Upload successful",
        description: `${parsedTransactions.length} transactions have been added.`,
      });

      // Trigger refresh of dashboard
      setTimeout(() => {
        onTransactionsUploaded();
        handleClose();
      }, 2000);

    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "An error occurred while uploading transactions.",
        variant: "destructive",
      });
      setStep("preview");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setCsvType(null);
    setParsedTransactions([]);
    setStep("upload");
    setIsProcessing(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Transactions
          </DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Select CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {file && (
                <div className="space-y-4">
                  <Alert>
                    <FileText className="h-4 w-4" />
                    <AlertDescription>
                      Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </AlertDescription>
                  </Alert>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      CSV Type
                    </label>
                    <Select value={csvType || ""} onValueChange={(value: CSVType) => setCsvType(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select CSV format..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="personal-capital">Personal Capital (USD)</SelectItem>
                        <SelectItem value="moneyhub">MoneyHub (GBP)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handlePreview} disabled={!csvType} className="w-full">
                    Preview Transactions
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>
                  Found {parsedTransactions.length} transactions. Review and confirm to upload.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Date</th>
                        <th className="text-left p-2">Description</th>
                        <th className="text-left p-2">Category</th>
                        <th className="text-left p-2">Account</th>
                        <th className="text-right p-2">Amount (GBP)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedTransactions.slice(0, 10).map((tx, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{tx.date}</td>
                          <td className="p-2 truncate max-w-40">{tx.description}</td>
                          <td className="p-2">{tx.category}</td>
                          <td className="p-2">{tx.account}</td>
                          <td className="p-2 text-right font-mono">
                            £{tx.amount_gbp.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedTransactions.length > 10 && (
                    <p className="text-sm text-gray-500 p-2">
                      ... and {parsedTransactions.length - 10} more transactions
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button onClick={handleUpload} className="flex-1">
                Upload {parsedTransactions.length} Transactions
              </Button>
            </div>
          </div>
        )}

        {step === "processing" && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-lg font-medium">Processing transactions...</p>
            <p className="text-sm text-gray-500">This may take a few moments</p>
          </div>
        )}

        {step === "complete" && (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
            <p className="text-lg font-medium">Upload Complete!</p>
            <p className="text-sm text-gray-500">
              {parsedTransactions.length} transactions have been added to your account
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Helper functions for ensuring default data exists
// FIXED: Replace the helper functions in TransactionUploadModal.tsx

async function ensureDefaultCategories(userId: string) {
    const defaultCategories = [
      { name: "Bills", type: "expense" },
      { name: "Extras", type: "expense" },
      { name: "Personal Care", type: "expense" },
      { name: "Groceries", type: "expense" },
      { name: "Dining", type: "expense" },
      { name: "Commute", type: "expense" },
      { name: "Service Charges", type: "expense" },
      { name: "Other", type: "expense" },
      { name: "Income", type: "income" },
      { name: "Investment", type: "expense" },
    ];
  
    for (const category of defaultCategories) {
      // Check if category already exists
      const { data: existing } = await supabase
        .from("categories")
        .select("id")
        .eq("user_id", userId)
        .eq("name", category.name)
        .single();
  
      // Only insert if it doesn't exist
      if (!existing) {
        const { error } = await supabase
          .from("categories")
          .insert({
            user_id: userId,
            name: category.name,
            category_type: category.type
          });
        
        if (error) {
          console.error(`Error creating category ${category.name}:`, error);
        }
      }
    }
  }
  
  async function ensureDefaultAccounts(userId: string) {
    const defaultAccounts = [
      { name: "HSBC Checkings", type: "checking", currency: "GBP" },
      { name: "Amex UK", type: "credit", currency: "GBP" },
      { name: "Capital One", type: "credit", currency: "USD" },
      { name: "Cash Rewards", type: "credit", currency: "USD" },
      { name: "Travel Rewards", type: "credit", currency: "USD" },
      { name: "BofA Checkings", type: "checking", currency: "USD" },
      { name: "Citi AAdvantage", type: "credit", currency: "USD" },
      { name: "Wealthfront", type: "investment", currency: "USD" },
      { name: "Global Money", type: "checking", currency: "GBP" },
      { name: "Fidelity", type: "investment", currency: "USD" },
      { name: "Vanguard", type: "investment", currency: "USD" },
      { name: "Dodl (LISA)", type: "investment", currency: "GBP" },
      { name: "Amex Gold", type: "credit", currency: "USD" },
    ];
  
    for (const account of defaultAccounts) {
      // Check if account already exists
      const { data: existing } = await supabase
        .from("accounts")
        .select("id")
        .eq("user_id", userId)
        .eq("name", account.name)
        .single();
  
      // Only insert if it doesn't exist
      if (!existing) {
        const { error } = await supabase
          .from("accounts")
          .insert({
            user_id: userId,
            name: account.name,
            account_type: account.type,
            currency: account.currency
          });
        
        if (error) {
          console.error(`Error creating account ${account.name}:`, error);
        }
      }
    }
  }