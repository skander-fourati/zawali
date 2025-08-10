import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MetricsCards } from "@/components/dashboard/MetricsCards";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { FamilyBalances } from "@/components/dashboard/FamilyBalances";
import { AddEditTransactionModal } from "@/components/transactions/AddEditTransactionModal";
import { useTransactions } from "@/hooks/useTransactions";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { chartCalculations } from "@/lib/chartCalculations";

// Subtle Zawali Message Component - only appears occasionally
const ZawaliToast = ({
  message,
  type,
  onDismiss,
}: {
  message: string;
  type: "success" | "info" | "warning";
  onDismiss: () => void;
}) => {
  const icons = {
    success: "🎉",
    info: "💡",
    warning: "😅",
  };

  return (
    <div className="fixed top-4 right-4 bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-lg z-50 max-w-sm zawali-slide-up">
      <div className="flex items-start gap-3">
        <span className="text-xl">{icons[type]}</span>
        <div className="flex-1">
          <p className="text-gray-200 text-sm">{message}</p>
        </div>
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-200 text-sm"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    transactions,
    categories,
    accounts,
    trips,
    loading: transactionsLoading,
    getFamilyBalances,
    refetch,
  } = useTransactions();

  // Transaction modal state
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Subtle zawali personality - only show occasionally
  const [zawaliMessage, setZawaliMessage] = useState<{
    text: string;
    type: "success" | "info" | "warning";
  } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleTransactionsUploaded = () => {
    setRefreshKey((prev) => prev + 1);

    if (typeof refetch === "function") {
      refetch();
    }

    // Subtle zawali humor - only sometimes
    if (Math.random() < 0.3) {
      setZawaliMessage({
        text: "More transactions uploaded! Your financial story continues... 📊",
        type: "success",
      });
      setTimeout(() => setZawaliMessage(null), 4000);
    }

    toast({
      title: "Success!",
      description: "Transactions uploaded successfully. Dashboard updated.",
    });
  };

  const handleAddTransactionClick = () => {
    setEditingTransaction(null);
    setIsTransactionModalOpen(true);

    // Subtle zawali humor - only sometimes
    if (Math.random() < 0.2) {
      setZawaliMessage({
        text: "Adding another transaction... the plot thickens! 😅",
        type: "info",
      });
      setTimeout(() => setZawaliMessage(null), 3000);
    }
  };

  const handleTransactionSaved = () => {
    setIsTransactionModalOpen(false);
    setEditingTransaction(null);
    refetch();
    setRefreshKey((prev) => prev + 1);

    // Subtle zawali message - only sometimes
    if (Math.random() < 0.25) {
      const messages = [
        "Transaction saved! Your financial journey continues.",
        "Another entry in the books! 📖",
        "Successfully logged your latest financial adventure.",
        "Your transaction has been documented for posterity.",
      ];

      const randomMessage =
        messages[Math.floor(Math.random() * messages.length)];
      setZawaliMessage({
        text: randomMessage,
        type: "success",
      });
      setTimeout(() => setZawaliMessage(null), 3500);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate metrics using centralized calculations
  const monthlyStats = chartCalculations.getMonthlyStats(transactions);
  const lastMonthStats = chartCalculations.getLastMonthStats(transactions);
  const totalSavings = chartCalculations.getTotalSavings(transactions);
  const totalInvestments = chartCalculations.getTotalInvestments(transactions);
  const averageIncome12Months =
    chartCalculations.get12MonthAverageIncome(transactions);

  // Family balances logic from existing hook
  const familyBalances = getFamilyBalances();
  const familyTransferCategory = categories.find(
    (cat) => cat.name === "Family Transfer",
  );
  const recentFamilyTransactions = transactions
    .filter(
      (t) =>
        t.category?.id === familyTransferCategory?.id && t.family_member_id,
    )
    .slice(0, 10) // Increased from 5 to 10
    .map((t) => ({
      id: t.id,
      date: t.date,
      description: t.description,
      amount_gbp: t.amount_gbp,
      family_member: {
        name: t.family_member?.name || "Unknown",
        color: t.family_member?.color || "#gray",
      },
      account: {
        name: t.account?.name || "Unknown Account",
      },
    }));

  // Recent transactions for display (increased limit)
  const recentTransactionsForDisplay = transactions
    .filter(
      (t) =>
        // Apply same base filtering as chart calculations
        t.encord_expensable !== true &&
        t.category?.name !== "Transfers" &&
        t.category?.name !== "Family Transfer" &&
        t.transaction_type !== "transfer",
    )
    .slice(0, 15) // Increased from 5 to 15
    .map((t) => ({
      id: t.id,
      date: t.date,
      description: t.description,
      amount: t.amount_gbp,
      category: t.category?.name || "Uncategorized",
      type: t.transaction_type as "income" | "expense",
    }));

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6 max-w-7xl">
          <DashboardHeader
            onAddTransactionClick={handleAddTransactionClick}
            onTransactionsUploaded={handleTransactionsUploaded}
          />

          <MetricsCards
            key={`metrics-${refreshKey}`}
            totalSavings={totalSavings}
            totalInvestments={totalInvestments}
            monthlyIncome={monthlyStats.monthlyIncome}
            monthlyExpenses={monthlyStats.monthlyExpenses}
            lastMonthIncome={lastMonthStats.lastMonthIncome}
            lastMonthExpenses={lastMonthStats.lastMonthExpenses}
            averageIncome12Months={averageIncome12Months}
          />

          {/* Expanded Recent Transactions and Family Balances - Single Column on Large Screens */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
            <div className="xl:col-span-1">
              <RecentTransactions
                key={`transactions-${refreshKey}`}
                transactions={recentTransactionsForDisplay}
              />
            </div>
            <div className="xl:col-span-1">
              <FamilyBalances
                balances={familyBalances}
                recentTransactions={recentFamilyTransactions}
              />
            </div>
          </div>

          <AddEditTransactionModal
            isOpen={isTransactionModalOpen}
            onClose={() => setIsTransactionModalOpen(false)}
            onSave={handleTransactionSaved}
            transaction={editingTransaction}
            categories={categories}
            accounts={accounts}
            trips={trips}
          />

          {/* Zawali toast message - appears occasionally */}
          {zawaliMessage && (
            <ZawaliToast
              message={zawaliMessage.text}
              type={zawaliMessage.type}
              onDismiss={() => setZawaliMessage(null)}
            />
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Index;
