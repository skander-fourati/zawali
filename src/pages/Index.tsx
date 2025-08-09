import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MetricsCards } from "@/components/dashboard/MetricsCards";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { FamilyBalances } from "@/components/dashboard/FamilyBalances";
import { AddEditTransactionModal } from "@/components/transactions/AddEditTransactionModal";
import { ExpensesByCategory } from "@/components/charts/ExpensesByCategory";
import { ExpensesOverTime } from "@/components/charts/ExpensesOverTime";
import { IncomeOverTime } from "@/components/charts/IncomeOverTime";
import { SavingsOverTime } from "@/components/charts/SavingsOverTime";
import { InvestmentsOverTime } from "@/components/charts/InvestmentsOverTime";
import { ExpensesByTrip } from "@/components/charts/ExpensesByTrip";
import { useTransactions } from "@/hooks/useTransactions";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { chartCalculations } from "@/lib/chartCalculations"; // NEW: Import centralized calculations

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
    getFamilyBalances, // Keep family balances from hook for now
    refetch
  } = useTransactions();

  // Transaction modal state
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [categoryColors, setCategoryColors] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchCategoryColors();
    }
  }, [user]);

  const fetchCategoryColors = async () => {
    if (!user) return;
    
    try {
      const { data: categories, error } = await supabase
        .from('categories')
        .select('name, color')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching category colors:', error);
        return;
      }

      const colorMap = categories?.reduce((acc, category) => {
        if (category.color) {
          acc[category.name] = category.color;
        }
        return acc;
      }, {}) || {};

      setCategoryColors(colorMap);
    } catch (error) {
      console.error('Error fetching category colors:', error);
    }
  };

  const handleTransactionsUploaded = () => {
    setRefreshKey(prev => prev + 1);
    
    if (typeof refetch === 'function') {
      refetch();
    }
    
    fetchCategoryColors();
    
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

  // UPDATED: Use centralized calculations
  const monthlyStats = chartCalculations.getMonthlyStats(transactions);
  const expensesByCategory = chartCalculations.getExpensesByCategory(transactions, categoryColors);
  const expensesOverTime = chartCalculations.getExpensesOverTime(transactions, categoryColors);
  const incomeOverTime = chartCalculations.getIncomeOverTime(transactions);
  const savingsOverTime = chartCalculations.getSavingsOverTime(transactions);
  const investmentsOverTime = chartCalculations.getInvestmentsOverTime(transactions);
  const expensesByTrip = chartCalculations.getExpensesByTrip(transactions);

  // Keep family balances logic from existing hook
  const familyBalances = getFamilyBalances();
  const familyTransferCategory = categories.find(cat => cat.name === 'Family Transfer');
  const recentFamilyTransactions = transactions
    .filter(t => t.category?.id === familyTransferCategory?.id && t.family_member_id)
    .slice(0, 5)
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

  // Recent transactions for display (using same base filtering as calculations)
  const recentTransactionsForDisplay = transactions
    .filter(t => 
      // Apply same base filtering as chart calculations
      t.encord_expensable !== true && 
      t.category?.name !== 'Transfers' && 
      t.category?.name !== 'Family Transfer' &&
      t.transaction_type !== 'transfer'
    )
    .slice(0, 5)
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
            totalBalance={monthlyStats.totalBalance}
            monthlyIncome={monthlyStats.monthlyIncome}
            monthlyExpenses={monthlyStats.monthlyExpenses}
            investments={monthlyStats.totalBalance - monthlyStats.monthlyIncome + monthlyStats.monthlyExpenses}
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <RecentTransactions 
              key={`transactions-${refreshKey}`}
              transactions={recentTransactionsForDisplay} 
            />
            <FamilyBalances 
              balances={familyBalances}
              recentTransactions={recentFamilyTransactions}
            />
          </div>

          <div className="space-y-8">
            {/* Full-width Expenses Over Time chart */}
            <div className="w-full">
              <ExpensesOverTime 
                key={`expenses-time-${refreshKey}`}
                data={expensesOverTime}
                categoryColors={categoryColors} 
              />
            </div>

            {/* ExpensesByCategory in 2-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ExpensesByCategory 
                key={`expenses-category-${refreshKey}`}
                data={expensesByCategory} 
              />
              {/* Placeholder for symmetry */}
              <div></div>
            </div>

            {/* Full-width ExpensesByTrip - same format as Expenses Over Time */}
            <div className="w-full">
              <ExpensesByTrip 
                key={`expenses-trip-${refreshKey}`}
                data={expensesByTrip}
              />
            </div>

            {/* Full-width IncomeOverTime - same format as Expenses Over Time */}
            <div className="w-full">
              <IncomeOverTime 
                key={`income-time-${refreshKey}`}
                data={incomeOverTime}
                categoryColors={categoryColors}
              />
            </div>

            {/* Full-width SavingsOverTime - same format as Expenses Over Time */}
            <div className="w-full">
              <SavingsOverTime 
                key={`savings-time-${refreshKey}`}
                data={savingsOverTime}
              />
            </div>

            {/* Full-width InvestmentsOverTime - same format as Expenses Over Time */}
            <div className="w-full">
              <InvestmentsOverTime 
                key={`investments-time-${refreshKey}`}
                data={investmentsOverTime}
                categoryColors={categoryColors}
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
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Index;