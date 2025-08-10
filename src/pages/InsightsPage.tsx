import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpensesByCategory } from "@/components/charts/ExpensesByCategory";
import { ExpensesOverTime } from "@/components/charts/ExpensesOverTime";
import { ExpensesByTrip } from "@/components/charts/ExpensesByTrip";
import { IncomeOverTime } from "@/components/charts/IncomeOverTime";
import { SavingsOverTime } from "@/components/charts/SavingsOverTime";
import { InvestmentsOverTime } from "@/components/charts/InvestmentsOverTime";
import { useTransactions } from "@/hooks/useTransactions";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { chartCalculations } from "@/lib/chartCalculations";
import { ArrowLeft, BarChart3, TrendingUp, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

const InsightsPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const {
    transactions,
    loading: transactionsLoading,
  } = useTransactions();

  const [categoryColors, setCategoryColors] = useState({});
  const [activeTab, setActiveTab] = useState("expenses");

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

  if (loading || !user || transactionsLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  // Calculate chart data
  const expensesByCategory = chartCalculations.getExpensesByCategory(transactions, categoryColors);
  const expensesOverTime = chartCalculations.getExpensesOverTime(transactions, categoryColors);
  const expensesByTrip = chartCalculations.getExpensesByTrip(transactions);
  const incomeOverTime = chartCalculations.getIncomeOverTime(transactions);
  const savingsOverTime = chartCalculations.getSavingsOverTime(transactions);
  const investmentsOverTime = chartCalculations.getInvestmentsOverTime(transactions);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6 max-w-7xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Financial Insights</h1>
              <p className="text-gray-600 mt-1">
                Analyze your spending patterns, income trends, and financial health
              </p>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
              <TabsTrigger value="expenses" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Expenses
              </TabsTrigger>
              <TabsTrigger value="income-savings" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Income & Savings
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Insights
              </TabsTrigger>
            </TabsList>

            {/* Expenses Tab */}
            <TabsContent value="expenses" className="space-y-8">
              {/* Full-width Expenses Over Time chart */}
              <div className="w-full">
                <ExpensesOverTime 
                  data={expensesOverTime}
                  categoryColors={categoryColors} 
                />
              </div>

              {/* ExpensesByCategory and ExpensesByTrip in 2-column layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ExpensesByCategory data={expensesByCategory} />
                <ExpensesByTrip data={expensesByTrip} />
              </div>
            </TabsContent>

            {/* Income & Savings Tab */}
            <TabsContent value="income-savings" className="space-y-8">
              {/* Full-width IncomeOverTime chart */}
              <div className="w-full">
                <IncomeOverTime 
                  data={incomeOverTime}
                  categoryColors={categoryColors}
                />
              </div>

              {/* Full-width SavingsOverTime chart */}
              <div className="w-full">
                <SavingsOverTime data={savingsOverTime} />
              </div>

              {/* Full-width InvestmentsOverTime chart */}
              <div className="w-full">
                <InvestmentsOverTime 
                  data={investmentsOverTime}
                  categoryColors={categoryColors}
                />
              </div>
            </TabsContent>

            {/* Insights Tab - Empty for now */}
            <TabsContent value="insights" className="space-y-8">
              <Card className="border-dashed border-2 border-gray-300">
                <CardHeader className="text-center py-12">
                  <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                    <Lightbulb className="h-6 w-6 text-gray-400" />
                  </div>
                  <CardTitle className="text-xl text-gray-600">
                    AI-Powered Insights Coming Soon
                  </CardTitle>
                  <CardDescription className="text-base max-w-md mx-auto mt-2">
                    Get personalized financial insights, spending recommendations, and trend analysis 
                    powered by advanced analytics.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center pb-12">
                  <div className="space-y-3 text-sm text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Smart spending pattern detection
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Personalized saving recommendations
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      Budget optimization suggestions
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      Investment opportunity analysis
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default InsightsPage;