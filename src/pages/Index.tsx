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
    getMonthlyStats,
    getExpensesByCategory,
    getLast12MonthsData,
    getExpensesByTrip,
    getFamilyBalances, // NEW: Get family balances calculator
    refetch
  } = useTransactions();

  // NEW: Transaction modal state
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const [categoryColors, setCategoryColors] = useState<Record<string, string>>({});
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
      }, {} as Record<string, string>) || {};

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

  // NEW: Handle opening transaction modal
  const handleAddTransactionClick = () => {
    setEditingTransaction(null);
    setIsTransactionModalOpen(true);
  };

  // NEW: Handle transaction saved
  const handleTransactionSaved = () => {
    setIsTransactionModalOpen(false);
    setEditingTransaction(null);
    refetch(); // Refresh all data
    setRefreshKey(prev => prev + 1);
  };

  // IMPROVED DATA PROCESSING - Fixed to work with existing types
  const getFilteredTransactions = () => {
    return transactions.filter(t => t.transaction_type !== 'transfer');
  };

  const getImprovedExpensesByCategory = () => {
    const categoryTotals: Record<string, number> = {};
    
    getFilteredTransactions().forEach(transaction => {
      const categoryName = transaction.category?.name || 'Uncategorized';
      const amount = transaction.amount_gbp || 0;
      
      // Exclude INVESTMENT category from expenses
      if (categoryName === 'Investment') return;
      
      // Handle INCOME category - only include positive amounts (refunds)
      if (categoryName === 'Income') {
        if (amount > 0) {
          categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + amount; // Refunds reduce expenses
        }
        return;
      }
      
      // For other categories, include negative amounts (actual expenses) but show as positive
      if (amount < 0) {
        categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + Math.abs(amount);
      }
    });
  
    // Fallback colors (same as your original)
    const colors = [
      'hsl(220, 70%, 50%)', 
      'hsl(10, 70%, 50%)', 
      'hsl(120, 70%, 50%)', 
      'hsl(40, 70%, 50%)', 
      'hsl(280, 70%, 50%)', 
      'hsl(180, 70%, 50%)'
    ];
    
    return Object.entries(categoryTotals)
      .map(([category, amount], index) => ({
        category,
        amount,
        // ✅ FIXED: Use database color first, then fallback
        color: categoryColors[category] || colors[index % colors.length]
      }))
      .sort((a, b) => b.amount - a.amount); // Sort by amount descending
  };

  const getImprovedExpensesOverTime = () => {
    const monthlyData: Record<string, Record<string, number>> = {};
    
    getFilteredTransactions().forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = date.toISOString().slice(0, 7);
      const categoryName = transaction.category?.name || 'Uncategorized';
      const amount = transaction.amount_gbp || 0;
      
      // Apply same filtering as category chart
      if (categoryName === 'Investment') return;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {};
      }
      
      if (categoryName === 'Income') {
        // Only include positive income amounts (refunds)
        if (amount > 0) {
          monthlyData[monthKey][categoryName] = (monthlyData[monthKey][categoryName] || 0) + amount;
        }
      } else if (amount < 0) {
        // For other categories, include negative amounts but store as positive
        monthlyData[monthKey][categoryName] = (monthlyData[monthKey][categoryName] || 0) + Math.abs(amount);
      }
    });

    return Object.entries(monthlyData)
      .map(([month, categories]) => {
        const totalAmount = Object.values(categories).reduce((sum, amount) => sum + amount, 0);
        return {
          month: new Date(month + '-01').toLocaleDateString('en-US', { 
            month: 'short', 
            year: 'numeric' 
          }),
          amount: totalAmount,
          categories
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month));
  };

  // SIMPLIFIED: Trip functions now use data directly from transactions (fixed)
  const getImprovedExpensesByTrip = () => {
    const tripTotals: Record<string, number> = {};
    
    getFilteredTransactions().forEach(transaction => {
      const tripName = transaction.trip?.name; // This should work now
      
      if (!tripName) return; // Only include transactions with trips
      
      const amount = transaction.amount_gbp || 0;
      const categoryName = transaction.category?.name || 'Uncategorized';
      
      // Use same filtering logic as expenses
      if (categoryName === 'Investment') return;
      
      if (categoryName === 'Income') {
        // Only include positive income amounts (refunds)  
        if (amount > 0) {
          tripTotals[tripName] = (tripTotals[tripName] || 0) + amount;
        }
      } else if (amount < 0) {
        // For other categories, include negative amounts but store as positive
        tripTotals[tripName] = (tripTotals[tripName] || 0) + Math.abs(amount);
      }
    });

    const colors = [
      'hsl(260, 70%, 50%)', 'hsl(30, 70%, 50%)', 'hsl(150, 70%, 50%)',
      'hsl(200, 70%, 50%)', 'hsl(320, 70%, 50%)', 'hsl(80, 70%, 50%)'
    ];
    
    return Object.entries(tripTotals)
      .map(([trip, amount], index) => ({
        trip,
        amount,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.amount - a.amount); // Sort by amount descending
  };

  const getImprovedSavingsOverTime = () => {
    const monthlyData: Record<string, { income: number; expenses: number }> = {};
    
    getFilteredTransactions().forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = date.toISOString().slice(0, 7);
      const categoryName = transaction.category?.name || 'Uncategorized';
      const amount = transaction.amount_gbp || 0;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0 };
      }
      
      // FIXED: Proper savings calculation excluding investments
      if (categoryName === 'Investment') return; // Skip investments entirely
      
      if (categoryName === 'Income' && amount > 0) {
        // Positive income amounts
        monthlyData[monthKey].income += amount;
      } else if (amount < 0) {
        // Negative amounts are expenses - convert to positive for calculation
        monthlyData[monthKey].expenses += Math.abs(amount);
      }
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { 
          month: 'short', 
          year: 'numeric' 
        }),
        amount: data.income - data.expenses // Savings = Income - Expenses (both as positive numbers)
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  };

  const getInvestmentsOverTime = () => {
    const monthlyInvestments: Record<string, number> = {};
    
    getFilteredTransactions().forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = date.toISOString().slice(0, 7);
      const categoryName = transaction.category?.name || 'Uncategorized';
      const amount = transaction.amount_gbp || 0;
      
      // Investment transactions: negative amounts (money leaving account) 
      // or transactions in the "Investment" category
      if (categoryName === 'Investment' || 
          (amount < 0 && ['Wealthfront', 'Fidelity', 'Vanguard', 'Dodl'].includes(transaction.account?.name || ''))) {
        monthlyInvestments[monthKey] = (monthlyInvestments[monthKey] || 0) + Math.abs(amount);
      }
    });

    return Object.entries(monthlyInvestments)
      .map(([month, amount]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { 
          month: 'short', 
          year: 'numeric' 
        }),
        amount
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  };

  if (loading || !user) {
    return null;
  }

  const monthlyStats = getMonthlyStats();
  const expensesByCategory = getExpensesByCategory();
  const last12MonthsData = getLast12MonthsData();

  // NEW: Get family balances and recent family transactions
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
      }
    }));

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6 max-w-7xl">
          <DashboardHeader 
            onAddTransactionClick={handleAddTransactionClick} // UPDATED: Changed prop name
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
              transactions={transactions.slice(0, 5).filter(t => t.transaction_type !== 'transfer').map(t => ({
                id: t.id,
                date: t.date,
                description: t.description,
                amount: t.amount_gbp,
                category: t.category?.name || 'Uncategorized',
                type: t.transaction_type as 'income' | 'expense'
              }))} 
            />
            {/* UPDATED: FamilyBalances with real data */}
            <FamilyBalances 
              balances={familyBalances}
              recentTransactions={recentFamilyTransactions}
              onAddTransaction={handleAddTransactionClick} // UPDATED: Changed prop name
            />
          </div>

          <div className="space-y-8">
            {/* Full-width Expenses Over Time chart */}
            <div className="w-full">
              <ExpensesOverTime 
                key={`expenses-time-${refreshKey}`}
                data={getImprovedExpensesOverTime()}
                categoryColors={categoryColors} 
              />
            </div>

            {/* Rest of the charts in 2-column grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ExpensesByCategory 
                key={`expenses-category-${refreshKey}`}
                data={getImprovedExpensesByCategory()} 
              />
              <IncomeOverTime 
                key={`income-time-${refreshKey}`}
                data={last12MonthsData.map(m => ({ 
                  month: m.month, 
                  amount: m.income
                }))} 
              />
              <SavingsOverTime 
                key={`savings-time-${refreshKey}`}
                data={getImprovedSavingsOverTime()}
              />        
              <InvestmentsOverTime 
                key={`investments-time-${refreshKey}`}
                data={getInvestmentsOverTime()}
              />
              <ExpensesByTrip 
                key={`expenses-trip-${refreshKey}`}
                data={getImprovedExpensesByTrip()}
              />
              {/* Add a placeholder div if you want even number of items in the grid */}
              <div></div>
            </div>
          </div>

          {/* NEW: Transaction Modal */}
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