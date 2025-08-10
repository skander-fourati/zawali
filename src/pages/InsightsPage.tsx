import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpensesByCategory } from "@/components/charts/ExpensesByCategory";
import { ExpensesOverTime } from "@/components/charts/ExpensesOverTime";
import { ExpensesByTrip } from "@/components/charts/ExpensesByTrip";
import { IncomeOverTime } from "@/components/charts/IncomeOverTime";
import SavingsOverTime from "@/components/charts/SavingsOverTime";
import { InvestmentsOverTime } from "@/components/charts/InvestmentsOverTime";
import { useTransactions } from "@/hooks/useTransactions";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { chartCalculations } from "@/lib/chartCalculations";
import { ArrowLeft, BarChart3, TrendingUp, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

// Zawali Insights Header
const ZawaliInsightsHeader = () => (
  <div className="flex items-center gap-4 mb-8">
    <div className="text-4xl zawali-float">📊</div>
    <div>
      <h1 className="text-3xl font-bold text-zawali-gradient">Financial Insights</h1>
      <p className="text-muted-foreground mt-1">
        Discover where your money went to hide (spoiler: it's probably not coming back)
      </p>
    </div>
  </div>
);

// Zawali Loading Component
const ZawaliLoading = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center">
      <div className="text-6xl mb-4 zawali-float">💰</div>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">Analyzing your financial adventures...</p>
    </div>
  </div>
);

// Zawali Coming Soon Card with moved expense analysis
const ZawaliComingSoon = ({ expensesByCategory }: { expensesByCategory: any[] }) => (
  <div className="space-y-6">
    {/* Zawali Expense Analysis - Moved from Expenses tab */}
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <span>🔍</span>
          <span>Zawali Expense Analysis</span>
        </CardTitle>
        <CardDescription>Current insights based on your data</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-2xl mb-2">😅</div>
            <div className="text-sm text-muted-foreground">Most Frequent Category</div>
            <div className="font-medium text-foreground">
              {expensesByCategory.length > 0 ? expensesByCategory[0].category : "No data"}
            </div>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-2xl mb-2">💸</div>
            <div className="text-sm text-muted-foreground">Biggest Money Drain</div>
            <div className="font-medium text-foreground">
              £{expensesByCategory.length > 0 ? Math.abs(expensesByCategory[0].amount).toFixed(2) : "0.00"}
            </div>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-2xl mb-2">📊</div>
            <div className="text-sm text-muted-foreground">Total Categories</div>
            <div className="font-medium text-foreground">
              {expensesByCategory.length}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Future AI Insights Card */}
    <Card className="border-dashed border-2 border-border bg-card">
      <CardHeader className="text-center py-12">
        <div className="text-6xl mb-4 zawali-float">🤖</div>
        <div className="mx-auto w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4">
          <Lightbulb className="h-6 w-6 text-muted-foreground" />
        </div>
        <CardTitle className="text-xl text-foreground">
          AI-Powered Insights Coming Soon
        </CardTitle>
        <CardDescription className="text-base max-w-md mx-auto mt-2">
          Get personalized financial insights, spending recommendations, and maybe even some life advice 
          (because your finances need all the help they can get).
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center pb-12">
        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            Smart spending pattern detection (aka "where did it all go wrong?")
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-success rounded-full"></div>
            Personalized saving recommendations (assuming there's anything left to save)
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-accent rounded-full"></div>
            Budget optimization suggestions (professional zawali advice)
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-warning rounded-full"></div>
            Investment opportunity analysis (for when you have money to invest)
          </div>
        </div>
        <div className="mt-6 text-xs text-muted-foreground italic">
          "Coming soon" in zawali time means "eventually, maybe, if we figure out how money works" 💭
        </div>
      </CardContent>
    </Card>
  </div>
);

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
        <ZawaliLoading />
      </ProtectedRoute>
    );
  }

  // Calculate chart data
  console.log('=== DEBUGGING INSIGHTS PAGE ===');
  console.log('Transactions count:', transactions.length);
  console.log('Sample transaction:', transactions[0]);
  
  let expensesByCategory = [];
  try {
    expensesByCategory = chartCalculations.getLastMonthExpensesByCategory(transactions, categoryColors);
    console.log('expensesByCategory result:', expensesByCategory);
  } catch (error) {
    console.error('Error in getLastMonthExpensesByCategory:', error);
  }
  const expensesOverTime = chartCalculations.getExpensesOverTime(transactions, categoryColors);
  const expensesByTrip = chartCalculations.getExpensesByTrip(transactions);
  const incomeOverTime = chartCalculations.getIncomeOverTime(transactions);
  const savingsOverTime = chartCalculations.getSavingsOverTime(transactions);
  const investmentsOverTime = chartCalculations.getInvestmentsOverTime(transactions);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6 max-w-7xl">
          {/* Header with Back Button */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center gap-2 hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>

          {/* Zawali Header */}
          <ZawaliInsightsHeader />

          {/* Tabs with enhanced styling */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3 bg-card">
              <TabsTrigger value="expenses" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted">
                <BarChart3 className="h-4 w-4" />
                <span>💸</span>
                <span className="hidden sm:inline">Expenses</span>
              </TabsTrigger>
              <TabsTrigger value="income-savings" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted">
                <TrendingUp className="h-4 w-4" />
                <span>💰</span>
                <span className="hidden sm:inline">Income & Savings</span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted">
                <Lightbulb className="h-4 w-4" />
                <span>🤖</span>
                <span className="hidden sm:inline">AI Insights</span>
              </TabsTrigger>
            </TabsList>

            {/* Expenses Tab */}
            <TabsContent value="expenses" className="space-y-8">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Where Your Money Went to Die 💸
                </h2>
                <p className="text-muted-foreground text-sm">
                  A comprehensive autopsy of your spending habits
                </p>
              </div>

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

              {/* Zawali Expense Wisdom */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <span>🧠</span>
                    <span>Zawali Expense Wisdom</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                      <span className="text-xl">🇹🇳</span>
                      <div>
                        <h4 className="font-medium text-foreground">The Tunisian Truth</h4>
                        <p className="text-sm text-muted-foreground">
                          Fun fact: "Zawali" means "brokie" in Tunisian. So basically, this whole app is just 
                          embracing your financial destiny with Mediterranean flair.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                      <span className="text-xl">🤷</span>
                      <div>
                        <h4 className="font-medium text-foreground">Zawali Life Philosophy</h4>
                        <p className="text-sm text-muted-foreground">
                          Why worry about being zawali when you can track it in style? At least now you have 
                          beautiful charts to show exactly how broke you are.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Income & Savings Tab */}
            <TabsContent value="income-savings" className="space-y-8">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  The Money That Actually Showed Up 💰
                </h2>
                <p className="text-muted-foreground text-sm">
                  Your financial success stories (however rare they may be)
                </p>
              </div>

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

              {/* Zawali Savings Wisdom */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <span>💡</span>
                    <span>Zawali Savings Wisdom</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                      <span className="text-xl">🐷</span>
                      <div>
                        <h4 className="font-medium text-foreground">The Piggy Bank Principle</h4>
                        <p className="text-sm text-muted-foreground">
                          Every pound saved is a pound your future self won't have to worry about. 
                          Unless you spend it on coffee tomorrow.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                      <span className="text-xl">📈</span>
                      <div>
                        <h4 className="font-medium text-foreground">Investment Reality Check</h4>
                        <p className="text-sm text-muted-foreground">
                          Compound interest is the eighth wonder of the world. Understanding it is the ninth.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Insights Tab - Zawali Enhanced with moved expense analysis */}
            <TabsContent value="insights" className="space-y-8">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  AI-Powered Financial Wisdom 🤖
                </h2>
                <p className="text-muted-foreground text-sm">
                  Because sometimes you need a robot to tell you what you already know
                </p>
              </div>

              <ZawaliComingSoon expensesByCategory={expensesByCategory} />
            </TabsContent>
          </Tabs>

          {/* Zawali Footer Quote */}
          <div className="text-center py-8 mt-8 border-t border-border">
            <div className="text-4xl mb-4 zawali-float">💭</div>
            <p className="text-muted-foreground italic text-sm">
              "The best financial advice is hindsight. The second best is zawali insights." 
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default InsightsPage;