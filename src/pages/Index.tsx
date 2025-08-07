import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MetricsCards } from "@/components/dashboard/MetricsCards";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { FamilyBalances } from "@/components/dashboard/FamilyBalances";
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
    loading: transactionsLoading,
    getMonthlyStats,
    getExpensesByCategory,
    getLast12MonthsData,
    getExpensesByTrip, // NEW: Get this from the hook now
    trips, // NEW: Get trips from hook
    refetch
  } = useTransactions();

  const [familyBalances, setFamilyBalances] = useState<Array<{
    id: string;
    name: string;
    totalSent: number;
    lastTransaction: string;
    status: 'active' | 'inactive';
  }>>([]);
  
  // REMOVED: No need for separate trips state - it's in the hook now
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchFamilyBalances();
      // REMOVED: fetchTrips() - now handled by useTransactions hook
    }
  }, [user]);

  const fetchFamilyBalances = async () => {
    try {
      const { data, error } = await supabase
        .from('family_balances')
        .select('*')
        .order('name');

      if (error) throw error;
      
      setFamilyBalances(data?.map(item => ({
        id: item.id,
        name: item.name,
        totalSent: Number(item.total_sent),
        lastTransaction: item.last_transaction || '2024-01-01',
        status: item.status as 'active' | 'inactive'
      })) || []);
    } catch (error) {
      console.error('Error fetching family balances:', error);
    }
  };

  // REMOVED: fetchTrips function - now handled by useTransactions hook

  const handleTransactionsUploaded = () => {
    setRefreshKey(prev => prev + 1);
    
    if (typeof refetch === 'function') {
      refetch();
    }
    
    fetchFamilyBalances();
    // REMOVED: fetchTrips() - now handled by useTransactions hook refetch
    
    toast({
      title: "Success!",
      description: "Transactions uploaded successfully. Dashboard updated.",
    });
  };

  const handleAddBalanceClick = async () => {
    const name = prompt("Enter family member name:");
    if (!name) return;

    const amount = prompt("Enter initial amount sent (GBP):");
    if (!amount || isNaN(Number(amount))) return;

    try {
      const { error } = await supabase
        .from('family_balances')
        .insert([{
          user_id: user?.id,
          name,
          total_sent: Number(amount),
          last_transaction: new Date().toISOString().split('T')[0],
          status: 'active'
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Added ${name} with £${amount} sent.`,
      });
      
      fetchFamilyBalances();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add family balance. Please try again.",
        variant: "destructive",
      });
    }
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
        color: colors[index % colors.length]
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6 max-w-7xl">
          <DashboardHeader 
            onAddBalanceClick={handleAddBalanceClick}
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
            <FamilyBalances 
              balances={familyBalances}
              onAddBalance={handleAddBalanceClick}
            />
          </div>

          <div className="space-y-8">
  {/* Full-width Expenses Over Time chart */}
  <div className="w-full">
    <ExpensesOverTime 
      key={`expenses-time-${refreshKey}`}
      data={getImprovedExpensesOverTime()} 
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
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Index;