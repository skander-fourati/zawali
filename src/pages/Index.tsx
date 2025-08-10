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
    refetch
  } = useTransactions();

  // Transaction modal state
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleTransactionsUploaded = () => {
    setRefreshKey(prev => prev + 1);
    
    if (typeof refetch === 'function') {
      refetch();
    }
    
    toast({
      title: "Success!",
      description: "Transactions uploaded successfully. Dashboard updated.",
    });
  };

  const handleAddTransactionClick = () => {
    setEditingTransaction(null);
    setIsTransactionModalOpen(true);
  };

  const handleTransactionSaved = () => {
    setIsTransactionModalOpen(false);
    setEditingTransaction(null);
    refetch();
    setRefreshKey(prev => prev + 1);
  };

  if (loading || !user) {
    return null;
  }

  // Calculate metrics using centralized calculations
  const monthlyStats = chartCalculations.getMonthlyStats(transactions);
  const lastMonthStats = chartCalculations.getLastMonthStats(transactions);
  const totalSavings = chartCalculations.getTotalSavings(transactions);
  const totalInvestments = chartCalculations.getTotalInvestments(transactions);
  const averageIncome12Months = chartCalculations.get12MonthAverageIncome(transactions);

  // Family balances logic from existing hook
  const familyBalances = getFamilyBalances();
  const familyTransferCategory = categories.find(cat => cat.name === 'Family Transfer');
  const recentFamilyTransactions = transactions
    .filter(t => t.category?.id === familyTransferCategory?.id && t.family_member_id)
    .slice(0, 10) // Increased from 5 to 10
    .map(t => ({
      id: t.id,
      date: t.date,
      description: t.description,
      amount_gbp: t.amount_gbp,
      family_member: {
        name: t.family_member?.name || 'Unknown',
        color: t.family_member?.color || '#gray'
      },
      account: {
        name: t.account?.name || 'Unknown Account'
      }
    }));

  // Recent transactions for display (increased limit)
  const recentTransactionsForDisplay = transactions
    .filter(t => 
      // Apply same base filtering as chart calculations
      t.encord_expensable !== true && 
      t.category?.name !== 'Transfers' && 
      t.category?.name !== 'Family Transfer' &&
      t.transaction_type !== 'transfer'
    )
    .slice(0, 15) // Increased from 5 to 15
    .map(t => ({
      id: t.id,
      date: t.date,
      description: t.description,
      amount: t.amount_gbp,
      category: t.category?.name || 'Uncategorized',
      type: t.transaction_type as 'income' | 'expense',
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

          {/* Call-to-action for Insights */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Ready to dive deeper into your finances?
            </h3>
            <p className="text-gray-600 mb-4">
              View detailed charts and spending insights to better understand your financial patterns.
            </p>
            <button
              onClick={() => navigate('/insights')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              View Financial Insights
            </button>
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
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Index;