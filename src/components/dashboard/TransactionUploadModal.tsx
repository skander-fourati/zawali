import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Upload, FileText, CheckCircle, AlertCircle, AlertTriangle, Edit3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { parsePersonalCapitalCSV, parseMoneyHubCSV, type ParsedTransaction } from "@/lib/csv-parser";
import { useToast } from "@/hooks/use-toast";

interface TransactionUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransactionsUploaded: () => void;
}

type CSVType = "personal-capital" | "moneyhub";
type StepType = "upload" | "preview" | "suspicious" | "processing" | "complete";

interface EditableTransaction extends ParsedTransaction {
  isEdited: boolean;
  originalValues: Partial<ParsedTransaction>;
  suspiciousReasons: string[];
}

interface ValidationError {
  field: string;
  message: string;
}

export function TransactionUploadModal({ isOpen, onClose, onTransactionsUploaded }: TransactionUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [csvType, setCsvType] = useState<CSVType | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedTransactions, setParsedTransactions] = useState<EditableTransaction[]>([]);
  const [suspiciousTransactions, setSuspiciousTransactions] = useState<EditableTransaction[]>([]);
  const [step, setStep] = useState<StepType>("upload");
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [accounts, setAccounts] = useState<{id: string, name: string}[]>([]);
  const [validationErrors, setValidationErrors] = useState<{[key: number]: ValidationError[]}>({});
  const { toast } = useToast();

  const USD_TO_GBP_RATE = 0.79;

  // Load categories and accounts on mount
  useEffect(() => {
    if (isOpen) {
      loadCategoriesAndAccounts();
    }
  }, [isOpen]);

  const loadCategoriesAndAccounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Ensure default data exists first
      await ensureDefaultCategories(user.id);
      await ensureDefaultAccounts(user.id);

      const [categoriesResult, accountsResult] = await Promise.all([
        supabase.from("categories").select("id, name").eq("user_id", user.id),
        supabase.from("accounts").select("id, name").eq("user_id", user.id)
      ]);

      if (categoriesResult.data) setCategories(categoriesResult.data);
      if (accountsResult.data) setAccounts(accountsResult.data);
    } catch (error) {
      console.error("Error loading categories and accounts:", error);
    }
  };

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

      // Convert to editable transactions
      const editableTransactions: EditableTransaction[] = parsed.map(tx => ({
        ...tx,
        isEdited: false,
        originalValues: {},
        suspiciousReasons: []
      }));

      setParsedTransactions(editableTransactions);
      setStep("preview");
    } catch (error) {
      toast({
        title: "Parsing error",
        description: "Failed to parse CSV file. Please check the format.",
        variant: "destructive",
      });
    }
  };

  const validateTransaction = (tx: EditableTransaction): ValidationError[] => {
    const errors: ValidationError[] = [];
    const now = new Date();
    const tenYearsAgo = new Date(now.getFullYear() - 10, 0, 1);
    const txDate = new Date(tx.date);

    // Required fields
    if (!tx.date) errors.push({ field: 'date', message: 'Date is required' });
    if (!tx.description || tx.description.trim().length < 2) {
      errors.push({ field: 'description', message: 'Description must be at least 2 characters' });
    }
    if (!tx.category) errors.push({ field: 'category', message: 'Category is required' });
    if (!tx.account) errors.push({ field: 'account', message: 'Account is required' });
    
    // Amount validation
    if (tx.amount_gbp === 0) errors.push({ field: 'amount_gbp', message: 'Amount cannot be zero' });
    if (csvType === "personal-capital" && (tx.amount_usd === 0 || tx.amount_usd === undefined)) {
      errors.push({ field: 'amount_usd', message: 'USD amount cannot be zero' });
    }

    // Date validation
    if (txDate > now) errors.push({ field: 'date', message: 'Date cannot be in the future' });
    if (txDate < tenYearsAgo) errors.push({ field: 'date', message: 'Date cannot be more than 10 years ago' });

    return errors;
  };

  const detectSuspiciousTransactions = (transactions: EditableTransaction[]): EditableTransaction[] => {
    const suspicious: EditableTransaction[] = [];
    
    // Calculate category averages for rule 6
    const categoryAverages = calculateCategoryAverages(transactions);

    transactions.forEach((tx, index) => {
      const reasons: string[] = [];

      // Rule 1: Duplicate transactions (same amount, description, date within 3 days)
      const duplicates = transactions.filter((other, otherIndex) => {
        if (index === otherIndex) return false;
        const dateDiff = Math.abs(new Date(tx.date).getTime() - new Date(other.date).getTime());
        const daysDiff = dateDiff / (1000 * 60 * 60 * 24);
        return Math.abs(tx.amount_gbp) === Math.abs(other.amount_gbp) && 
               tx.description.toLowerCase() === other.description.toLowerCase() && 
               daysDiff <= 3;
      });
      if (duplicates.length > 0) {
        reasons.push("Potential duplicate transaction");
      }

      // Rule 2: Very round amounts
      const amount = Math.abs(tx.amount_gbp);
      if (amount % 50 === 0 && amount >= 50) {
        reasons.push("Round amount (£" + amount + ")");
      }
      if (csvType === "personal-capital" && tx.amount_usd) {
        const usdAmount = Math.abs(tx.amount_usd);
        if (usdAmount % 50 === 0 && usdAmount >= 50) {
          reasons.push("Round amount ($" + usdAmount + ")");
        }
      }

      // Rule 6: Unusual amounts for category (3x higher than typical)
      const categoryAvg = categoryAverages[tx.category.toLowerCase()];
      if (categoryAvg && Math.abs(tx.amount_gbp) > categoryAvg * 3) {
        reasons.push(`Unusually large for ${tx.category} (avg: £${categoryAvg.toFixed(2)})`);
      }

      // Rule 8: Investment accounts not categorized as Investment
      const investmentAccountKeywords = ['vanguard', 'fidelity', 'wealthfront', 'investment', 'dodl', 'lisa'];
      const isInvestmentAccount = investmentAccountKeywords.some(keyword => 
        tx.account.toLowerCase().includes(keyword)
      );
      if (isInvestmentAccount && tx.category.toLowerCase() !== 'investment') {
        reasons.push("Investment account but not Investment category");
      }

      // Existing rules: Large amounts and "Other / Unknown" category
      if (Math.abs(tx.amount_gbp) > 100) {
        reasons.push("Large amount (>£100)");
      }
      if (tx.category === "Other / Unknown") {
        reasons.push("Uncategorized transaction");
      }

      if (reasons.length > 0) {
        suspicious.push({
          ...tx,
          suspiciousReasons: reasons
        });
      }
    });

    return suspicious;
  };

  const calculateCategoryAverages = (transactions: EditableTransaction[]): {[category: string]: number} => {
    const categoryTotals: {[category: string]: {sum: number, count: number}} = {};
    
    transactions.forEach(tx => {
      const category = tx.category.toLowerCase();
      if (!categoryTotals[category]) {
        categoryTotals[category] = { sum: 0, count: 0 };
      }
      categoryTotals[category].sum += Math.abs(tx.amount_gbp);
      categoryTotals[category].count += 1;
    });

    const averages: {[category: string]: number} = {};
    Object.entries(categoryTotals).forEach(([category, data]) => {
      averages[category] = data.sum / data.count;
    });

    return averages;
  };

  const handleContinueToSuspicious = () => {
    // Validate all transactions first
    const errors: {[key: number]: ValidationError[]} = {};
    let hasErrors = false;

    parsedTransactions.forEach((tx, index) => {
      const txErrors = validateTransaction(tx);
      if (txErrors.length > 0) {
        errors[index] = txErrors;
        hasErrors = true;
      }
    });

    setValidationErrors(errors);

    if (hasErrors) {
      toast({
        title: "Validation errors",
        description: "Please fix the highlighted errors before continuing.",
        variant: "destructive",
      });
      return;
    }

    // Detect suspicious transactions
    const suspicious = detectSuspiciousTransactions(parsedTransactions);
    setSuspiciousTransactions(suspicious);
    
    if (suspicious.length > 0) {
      setStep("suspicious");
    } else {
      // No suspicious transactions, go directly to upload
      handleUpload();
    }
  };

  const updateTransaction = (index: number, field: keyof ParsedTransaction, value: any) => {
    setParsedTransactions(prev => prev.map((tx, i) => {
      if (i !== index) return tx;
      
      const updated = { ...tx };
      
      // Store original value if this is the first edit of this field
      if (!updated.isEdited || !updated.originalValues[field]) {
        updated.originalValues = {
          ...updated.originalValues,
          [field]: tx[field]
        };
      }
      
      // Update the field with type assertion
      (updated as any)[field] = value;
      updated.isEdited = true;

      // Handle special case for Personal Capital USD amount changes
      if (field === 'amount_usd' && csvType === "personal-capital") {
        updated.amount_gbp = value * USD_TO_GBP_RATE;
      }

      return updated;
    }));

    // Clear validation errors for this transaction
    if (validationErrors[index]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[index];
        return newErrors;
      });
    }
  };

  const updateSuspiciousTransaction = (index: number, field: keyof ParsedTransaction, value: any) => {
    setSuspiciousTransactions(prev => prev.map((tx, i) => {
      if (i !== index) return tx;
      
      const updated = { ...tx };
      
      // Store original value if this is the first edit of this field
      if (!updated.isEdited || !updated.originalValues[field]) {
        updated.originalValues = {
          ...updated.originalValues,
          [field]: tx[field]
        };
      }
      
      // Update the field with type assertion
      (updated as any)[field] = value;
      updated.isEdited = true;

      // Handle special case for Personal Capital USD amount changes
      if (field === 'amount_usd' && csvType === "personal-capital") {
        updated.amount_gbp = value * USD_TO_GBP_RATE;
      }

      return updated;
    }));
  };

  const resetTransaction = (index: number, isSuspicious = false) => {
    const setter = isSuspicious ? setSuspiciousTransactions : setParsedTransactions;
    
    setter(prev => prev.map((tx, i) => {
      if (i !== index) return tx;
      
      const reset = { ...tx };
      
      // Reset all edited fields to original values
      Object.entries(reset.originalValues).forEach(([field, value]) => {
        (reset as any)[field as keyof ParsedTransaction] = value as any;
      });
      
      reset.isEdited = false;
      reset.originalValues = {};
      
      return reset;
    }));
  };

  const handleUpload = async () => {
    // Use suspicious transactions if we're coming from that step, otherwise use all transactions
    const transactionsToUpload = step === "suspicious" ? 
      [...parsedTransactions.filter(tx => !suspiciousTransactions.find(s => s.date === tx.date && s.description === tx.description)), 
       ...suspiciousTransactions] : 
      parsedTransactions;

    if (transactionsToUpload.length === 0) return;

    setIsProcessing(true);
    setStep("processing");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Get category and account mappings
      const categoryMap = new Map(categories.map(c => [c.name.toLowerCase(), c.id]));
      const accountMap = new Map(accounts.map(a => [a.name, a.id]));

      // Insert transactions
      const transactionInserts = transactionsToUpload.map(tx => {
        const categoryId = categoryMap.get(tx.category.toLowerCase());
        const accountId = accountMap.get(tx.account);

        return {
          user_id: user.id,
          account_id: accountId,
          category_id: categoryId,
          date: tx.date,
          description: tx.description,
          amount: tx.currency === "USD" ? tx.amount_usd : tx.amount_gbp,
          currency: tx.currency,
          amount_gbp: tx.amount_gbp,
          exchange_rate: tx.currency === "USD" ? USD_TO_GBP_RATE : 1.0,
          transaction_type: tx.amount_gbp > 0 ? "income" : "expense",
          encord: tx.encord
        };
      });

      const { error } = await supabase
        .from("transactions")
        .insert(transactionInserts);

      if (error) throw error;

      setStep("complete");
      toast({
        title: "Upload successful",
        description: `${transactionsToUpload.length} transactions have been added.`,
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
      setStep(step === "suspicious" ? "suspicious" : "preview");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setCsvType(null);
    setParsedTransactions([]);
    setSuspiciousTransactions([]);
    setStep("upload");
    setIsProcessing(false);
    setShowAllTransactions(false);
    setValidationErrors({});
    onClose();
  };

  const renderEditableCell = (
    tx: EditableTransaction, 
    index: number, 
    field: keyof ParsedTransaction, 
    isSuspicious = false
  ) => {
    const value = tx[field];
    const hasError = validationErrors[index]?.some(err => err.field === field);
    const updateFn = isSuspicious ? updateSuspiciousTransaction : updateTransaction;

    if (field === 'category') {
      return (
        <Select 
          value={value as string} 
          onValueChange={(val) => updateFn(index, field, val)}
        >
          <SelectTrigger className={`h-8 text-xs ${hasError ? 'border-red-500' : ''}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (field === 'account') {
      return (
        <Select 
          value={value as string} 
          onValueChange={(val) => updateFn(index, field, val)}
        >
          <SelectTrigger className={`h-8 text-xs ${hasError ? 'border-red-500' : ''}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {accounts.map(acc => (
              <SelectItem key={acc.id} value={acc.name}>{acc.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (field === 'date') {
      return (
        <Input
          type="date"
          value={value as string}
          onChange={(e) => updateFn(index, field, e.target.value)}
          className={`h-8 text-xs ${hasError ? 'border-red-500' : ''}`}
        />
      );
    }

    if (field === 'amount_usd' || field === 'amount_gbp') {
      const isReadOnly = field === 'amount_gbp' && csvType === "personal-capital";
      return (
        <Input
          type="number"
          step="0.01"
          value={typeof value === 'number' ? value.toFixed(2) : ''}
          onChange={(e) => updateFn(index, field, parseFloat(e.target.value) || 0)}
          className={`h-8 text-xs text-right font-mono ${hasError ? 'border-red-500' : ''} ${isReadOnly ? 'bg-gray-50' : ''}`}
          readOnly={isReadOnly}
        />
      );
    }

    if (field === 'description') {
      return (
        <Input
          type="text"
          value={value as string}
          onChange={(e) => updateFn(index, field, e.target.value)}
          className={`h-8 text-xs ${hasError ? 'border-red-500' : ''}`}
        />
      );
    }

    if (field === 'encord') {
      return (
        <div className="flex justify-center">
          <input
            type="checkbox"
            checked={value as boolean}
            onChange={(e) => updateFn(index, field, e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </div>
      );
    }

    return <span className="text-xs">{value as string}</span>;
  };

  const displayedTransactions = showAllTransactions ? parsedTransactions : parsedTransactions.slice(0, 10);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Transactions
            {csvType === "personal-capital" && (
              <span className="text-xs text-gray-500 ml-auto">Exchange rate: 1 USD = {USD_TO_GBP_RATE} GBP</span>
            )}
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
                <CardTitle className="flex items-center justify-between">
                  <span>Preview & Edit Transactions</span>
                  <span className="text-sm font-normal text-gray-500">
                    {parsedTransactions.filter(tx => tx.isEdited).length} edited
                  </span>
                </CardTitle>
                <CardDescription>
                  Found {parsedTransactions.length} transactions. Click any cell to edit. 
                  {Object.keys(validationErrors).length > 0 && (
                    <span className="text-red-600 ml-2">
                      {Object.keys(validationErrors).length} transactions have validation errors.
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white border-b">
                      <tr>
                        <th className="text-left p-2 w-24">Date</th>
                        <th className="text-left p-2">Description</th>
                        <th className="text-left p-2 w-32">Category</th>
                        <th className="text-left p-2 w-32">Account</th>
                        {csvType === "personal-capital" && (
                          <th className="text-right p-2 w-24">Amount (USD)</th>
                        )}
                        <th className="text-right p-2 w-24">Amount (GBP)</th>
                        <th className="text-center p-2 w-20">Expensable</th>
                        <th className="w-16">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedTransactions.map((tx, index) => (
                        <tr 
                          key={index} 
                          className={`border-b ${tx.isEdited ? 'bg-blue-50' : ''} ${validationErrors[index] ? 'bg-red-50' : ''}`}
                        >
                          <td className="p-1">{renderEditableCell(tx, index, 'date')}</td>
                          <td className="p-1">{renderEditableCell(tx, index, 'description')}</td>
                          <td className="p-1">{renderEditableCell(tx, index, 'category')}</td>
                          <td className="p-1">{renderEditableCell(tx, index, 'account')}</td>
                          {csvType === "personal-capital" && (
                            <td className="p-1">{renderEditableCell(tx, index, 'amount_usd')}</td>
                          )}
                          <td className="p-1">{renderEditableCell(tx, index, 'amount_gbp')}</td>
                          <td className="p-1">{renderEditableCell(tx, index, 'encord')}</td>
                          <td className="p-1">
                            {tx.isEdited && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => resetTransaction(index)}
                                className="h-6 w-6 p-0"
                              >
                                ↺
                              </Button>
                            )}
                            {validationErrors[index] && (
                              <AlertCircle className="h-4 w-4 text-red-500 ml-1" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedTransactions.length > 10 && !showAllTransactions && (
                    <div className="p-4 text-center">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowAllTransactions(true)}
                      >
                        Load all {parsedTransactions.length - 10} remaining transactions
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* Validation Errors Summary */}
                {Object.keys(validationErrors).length > 0 && (
                  <Alert className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Validation Errors:</strong>
                      <ul className="list-disc list-inside mt-2">
                        {Object.entries(validationErrors).map(([index, errors]) => (
                          <li key={index} className="text-sm">
                            Row {parseInt(index) + 1}: {errors.map(e => e.message).join(', ')}
                          </li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button onClick={handleContinueToSuspicious} className="flex-1">
                Continue to Review
              </Button>
            </div>
          </div>
        )}

        {step === "suspicious" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Review Suspicious Transactions
                </CardTitle>
                <CardDescription>
                  {suspiciousTransactions.length} transactions flagged for review. Edit as needed, then upload.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white border-b">
                      <tr>
                        <th className="text-left p-2 w-24">Date</th>
                        <th className="text-left p-2">Description</th>
                        <th className="text-left p-2 w-32">Category</th>
                        <th className="text-left p-2 w-32">Account</th>
                        {csvType === "personal-capital" && (
                          <th className="text-right p-2 w-24">Amount (USD)</th>
                        )}
                        <th className="text-right p-2 w-24">Amount (GBP)</th>
                        <th className="text-center p-2 w-20">Expensable</th>
                        <th className="text-left p-2">Flags</th>
                        <th className="w-16">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suspiciousTransactions.map((tx, index) => (
                        <tr key={index} className={`border-b ${tx.isEdited ? 'bg-blue-50' : 'bg-amber-50'}`}>
                          <td className="p-1">{renderEditableCell(tx, index, 'date', true)}</td>
                          <td className="p-1">{renderEditableCell(tx, index, 'description', true)}</td>
                          <td className="p-1">{renderEditableCell(tx, index, 'category', true)}</td>
                          <td className="p-1">{renderEditableCell(tx, index, 'account', true)}</td>
                          {csvType === "personal-capital" && (
                            <td className="p-1">{renderEditableCell(tx, index, 'amount_usd', true)}</td>
                          )}
                          <td className="p-1">{renderEditableCell(tx, index, 'amount_gbp', true)}</td>
                          <td className="p-1">{renderEditableCell(tx, index, 'encord', true)}</td>
                          <td className="p-1">
                            <div className="space-y-1">
                              {tx.suspiciousReasons.map((reason, i) => (
                                <div key={i} className="text-xs text-amber-700 bg-amber-100 px-1 rounded">
                                  {reason}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="p-1">
                            {tx.isEdited && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => resetTransaction(index, true)}
                                className="h-6 w-6 p-0"
                              >
                                ↺
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("preview")}>
                Back
              </Button>
              <Button onClick={handleUpload} className="flex-1">
                Upload All {parsedTransactions.length} Transactions
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
async function ensureDefaultCategories(userId: string) {
  const defaultCategories = [
    { name: "Bills", type: "expense" },
    { name: "Extras", type: "expense" },
    { name: "Personal Care", type: "expense" },
    { name: "Groceries", type: "expense" },
    { name: "Dining", type: "expense" },
    { name: "Commute", type: "expense" },
    { name: "Service Charges/Fees", type: "expense" },
    { name: "Other / Unknown", type: "expense" },
    { name: "Income", type: "income" },
    { name: "Investment", type: "expense" },
    { name: "Family Transfer", type: "expense" },
    { name: "Transfers", type: "expense" },
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