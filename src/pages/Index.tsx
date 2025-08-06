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
    getLast12MonthsData
  } = useTransactions();

  const [familyBalances, setFamilyBalances] = useState<Array<{
    id: string;
    name: string;
    totalSent: number;
    lastTransaction: string;
    status: 'active' | 'inactive';
  }>>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchFamilyBalances();
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

  if (loading || !user) {
    return null; // ProtectedRoute will handle the redirect
  }

  const monthlyStats = getMonthlyStats();
  const expensesByCategory = getExpensesByCategory();
  const last12MonthsData = getLast12MonthsData();

  const handleUploadClick = () => {
    toast({
      title: "Upload Feature",
      description: "File upload functionality coming soon! You can manually add transactions for now.",
      duration: 5000,
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
          user_id: user.id,
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6 max-w-7xl">
          <DashboardHeader 
            onUploadClick={handleUploadClick}
            onAddBalanceClick={handleAddBalanceClick}
          />
          
          <MetricsCards 
            totalBalance={monthlyStats.totalBalance}
            monthlyIncome={monthlyStats.monthlyIncome}
            monthlyExpenses={monthlyStats.monthlyExpenses}
            investments={monthlyStats.totalBalance - monthlyStats.monthlyIncome + monthlyStats.monthlyExpenses}
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <RecentTransactions transactions={transactions.slice(0, 5).filter(t => t.transaction_type !== 'transfer').map(t => ({
              id: t.id,
              date: t.date,
              description: t.description,
              amount: t.amount_gbp,
              category: t.category?.name || 'Uncategorized',
              type: t.transaction_type as 'income' | 'expense'
            }))} />
            <FamilyBalances 
              balances={familyBalances}
              onAddBalance={handleAddBalanceClick}
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ExpensesByCategory data={expensesByCategory} />
            <ExpensesOverTime data={last12MonthsData.map(m => ({ 
              month: m.month, 
              amount: m.expenses,
              categories: {}
            }))} />
            <IncomeOverTime data={last12MonthsData.map(m => ({ 
              month: m.month, 
              amount: m.income
            }))} />
            <SavingsOverTime data={last12MonthsData.map(m => ({ 
              month: m.month, 
              amount: m.savings
            }))} />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Index;