import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { shouldIncludeInPortfolioBreakdown } from "@/components/portfolio/investments";

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  exchange_rate: number;
  amount_gbp: number;
  transaction_type: "income" | "expense" | "transfer";
  trip_id: string | null;
  family_member_id: string | null;
  investment_id: string | null;
  encord_expensable?: boolean;
  category: {
    id: string;
    name: string;
    color: string;
  } | null;
  account: {
    id: string;
    name: string;
    account_type: string;
  };
  trip: {
    id: string;
    name: string;
  } | null;
  family_member: {
    id: string;
    name: string;
    color: string;
    status: "active" | "settled" | "archived";
  } | null;
  investment: {
    id: string;
    ticker: string;
    investment_type: string;
  } | null;
}

export interface Category {
  id: string;
  name: string;
  category_type: "income" | "expense";
  color: string;
}

export interface Account {
  id: string;
  name: string;
  account_type: string;
  currency: string;
}

export interface Trip {
  id: string;
  name: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface FamilyMember {
  id: string;
  user_id: string;
  name: string;
  color: string;
  status: "active" | "settled" | "archived";
  created_at?: string;
  updated_at?: string;
}

// FIXED: Made all calculated fields required with default values
export interface Investment {
  id: string;
  user_id: string;
  ticker: string;
  investment_type: string;
  created_at?: string;
  updated_at?: string;
  // Calculated fields from the view - now required with defaults
  current_market_value: number;
  market_value_updated_at: string | null;
  total_invested: number;
  transaction_count: number;
  // Performance calculations - now required with defaults
  total_return: number;
  return_percentage: number;
}

export interface InvestmentMarketValue {
  id: string;
  investment_id: string;
  market_value: number;
  updated_at: string;
}

export interface BulkUpdateResult {
  successCount: number;
  failureCount: number;
  failures: Array<{
    id: string;
    description: string;
    date: string;
    error: string;
  }>;
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // FIXED: Helper function to calculate investment metrics from transactions
  const calculateInvestmentMetrics = (
    investmentId: string,
    transactions: Transaction[],
    marketValues: InvestmentMarketValue[],
  ) => {
    // Get all investment transactions for this specific investment
    const investmentTransactions = transactions.filter(
      (t) =>
        t.investment_id === investmentId && t.category?.name === "Investment",
    );

    // Calculate total invested (sum of all investment transactions for this investment)
    const total_invested = investmentTransactions.reduce((sum, t) => {
      const amount = t.amount_gbp || 0;
      if (amount > 0) {
        // Positive amounts are money going into investments
        return sum + amount;
      } else {
        // Negative amounts are withdrawals - subtract from total invested
        return sum - Math.abs(amount);
      }
    }, 0);

    // Get current market value (from market_values table or 0)
    const latestMarketValue = marketValues
      .filter((mv) => mv.investment_id === investmentId)
      .sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      )[0];

    const current_market_value = latestMarketValue?.market_value || 0;
    const market_value_updated_at = latestMarketValue?.updated_at || null;

    // Calculate performance metrics
    const total_return = current_market_value - total_invested;
    const return_percentage =
      total_invested > 0 ? (total_return / total_invested) * 100 : 0;

    return {
      current_market_value,
      market_value_updated_at,
      total_invested,
      transaction_count: investmentTransactions.length,
      total_return,
      return_percentage,
    };
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch transactions with investment data
      const { data: transactionsData, error: transactionsError } =
        await supabase
          .from("transactions")
          .select(
            `
          *,
          category:categories(*),
          account:accounts(*),
          trip:trips(id, name),
          family_member:family_members(id, name, color, status),
          investment:investments(id, ticker, investment_type)
        `,
          )
          .eq("user_id", user?.id)
          .order("date", { ascending: false })
          .limit(1000000);

      if (transactionsError) throw transactionsError;

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", user?.id)
        .order("name");

      if (categoriesError) throw categoriesError;

      // Fetch accounts
      const { data: accountsData, error: accountsError } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", user?.id)
        .order("name");

      if (accountsError) throw accountsError;

      // Fetch trips
      const { data: tripsData, error: tripsError } = await supabase
        .from("trips")
        .select("*")
        .eq("user_id", user?.id)
        .order("name");

      if (tripsError) {
        console.log("No trips found or error fetching trips:", tripsError);
      }

      // Fetch family members
      const { data: familyMembersData, error: familyMembersError } =
        await supabase
          .from("family_members")
          .select("*")
          .eq("user_id", user?.id)
          .order("name");

      if (familyMembersError) {
        console.log(
          "No family members found or error fetching family members:",
          familyMembersError,
        );
      }

      // FIXED: Get market values for calculations
      const { data: marketValuesData, error: marketValuesError } =
        await supabase
          .from("investment_market_values")
          .select("*")
          .order("updated_at", { ascending: false });

      if (marketValuesError) {
        console.log("Error fetching market values:", marketValuesError);
      }

      const transactions = (transactionsData || []) as unknown as Transaction[];
      const marketValues = (marketValuesData || []) as InvestmentMarketValue[];

      setTransactions(transactions);
      setCategories((categoriesData || []) as Category[]);
      setAccounts((accountsData || []) as Account[]);
      setTrips((tripsData || []) as Trip[]);
      setFamilyMembers((familyMembersData || []) as unknown as FamilyMember[]);

      // FIXED: Fetch investments with calculated metrics
      try {
        const { data: investmentsData, error: investmentsError } =
          await supabase
            .from("investments")
            .select("*")
            .eq("user_id", user?.id)
            .order("ticker");

        if (investmentsError) {
          console.log(
            "No investments found or error fetching investments:",
            investmentsError,
          );
        }

        // FIXED: Calculate proper metrics for each investment
        const processedInvestments = (investmentsData || []).map((inv: any) => {
          const metrics = calculateInvestmentMetrics(
            inv.id,
            transactions,
            marketValues,
          );
          return {
            ...inv,
            ...metrics, // Spread the calculated metrics
          };
        });

        setInvestments(processedInvestments as Investment[]);
      } catch (investmentError) {
        console.log("Investment fetch error:", investmentError);
        setInvestments([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (
    transaction: Omit<
      Transaction,
      "id" | "category" | "account" | "trip" | "family_member" | "investment"
    > & {
      category_id?: string;
      account_id: string;
      trip_id?: string | null;
      family_member_id?: string | null;
      investment_id?: string | null;
    },
  ) => {
    try {
      const { error } = await supabase.from("transactions").insert([
        {
          ...transaction,
          user_id: user?.id,
        },
      ]);

      if (error) throw error;

      await fetchData();
      return { success: true };
    } catch (error) {
      console.error("Error adding transaction:", error);
      return { success: false, error };
    }
  };

  const bulkUpdateTransactions = async (
    transactionIds: string[],
    property: string,
    value: any,
    additionalData?: any,
  ): Promise<BulkUpdateResult> => {
    const result: BulkUpdateResult = {
      successCount: 0,
      failureCount: 0,
      failures: [],
    };

    // Get transaction data for error reporting
    const transactionMap = new Map(
      transactions.map((t) => [
        t.id,
        { description: t.description, date: t.date },
      ]),
    );

    // Process each transaction individually for better error handling
    for (const transactionId of transactionIds) {
      try {
        // Build the update object based on the property
        const updateData: any = {};

        switch (property) {
          case "category":
            updateData.category_id = value === "none" ? null : value;

            // Handle Family Transfer special case
            if (additionalData?.family_member_id) {
              updateData.family_member_id = additionalData.family_member_id;
              updateData.transaction_type = "transfer";
            } else if (value !== "none") {
              // If changing to a non-Family Transfer category, clear family member
              const familyTransferCategory = categories.find(
                (cat) => cat.name === "Family Transfer",
              );
              if (value !== familyTransferCategory?.id) {
                updateData.family_member_id = null;
                updateData.transaction_type = "expense"; // Reset to expense
              }
            }
            break;

          case "account":
            updateData.account_id = value === "none" ? null : value;
            break;

          case "trip":
            updateData.trip_id = value === "none" ? null : value;
            break;

          case "encord_expensable":
            updateData.encord_expensable = value === "true";
            break;

          default:
            throw new Error(`Unknown property: ${property}`);
        }

        // Update the transaction
        const { error } = await supabase
          .from("transactions")
          .update(updateData)
          .eq("id", transactionId)
          .eq("user_id", user?.id); // Extra security check

        if (error) throw error;

        result.successCount++;
      } catch (error) {
        console.error(`Failed to update transaction ${transactionId}:`, error);

        const transactionInfo = transactionMap.get(transactionId);
        result.failureCount++;
        result.failures.push({
          id: transactionId,
          description: transactionInfo?.description || "Unknown transaction",
          date: transactionInfo?.date || "Unknown date",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return result;
  };

  const bulkDeleteTransactions = async (
    transactionIds: string[],
  ): Promise<BulkUpdateResult> => {
    const result: BulkUpdateResult = {
      successCount: 0,
      failureCount: 0,
      failures: [],
    };

    // Get transaction data for error reporting
    const transactionMap = new Map(
      transactions.map((t) => [
        t.id,
        { description: t.description, date: t.date },
      ]),
    );

    // Process each transaction individually for better error handling
    for (const transactionId of transactionIds) {
      try {
        const { error } = await supabase
          .from("transactions")
          .delete()
          .eq("id", transactionId)
          .eq("user_id", user?.id); // Extra security check

        if (error) throw error;

        result.successCount++;
      } catch (error) {
        console.error(`Failed to delete transaction ${transactionId}:`, error);

        const transactionInfo = transactionMap.get(transactionId);
        result.failureCount++;
        result.failures.push({
          id: transactionId,
          description: transactionInfo?.description || "Unknown transaction",
          date: transactionInfo?.date || "Unknown date",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return result;
  };

  const getMonthlyStats = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthTransactions = transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return (
        transactionDate.getMonth() === currentMonth &&
        transactionDate.getFullYear() === currentYear
      );
    });

    const monthlyIncome = currentMonthTransactions
      .filter((t) => t.transaction_type === "income")
      .reduce((sum, t) => sum + t.amount_gbp, 0);

    const monthlyExpenses = currentMonthTransactions
      .filter((t) => t.transaction_type === "expense")
      .reduce((sum, t) => sum + t.amount_gbp, 0);

    const totalBalance = transactions.reduce((balance, t) => {
      return t.transaction_type === "income"
        ? balance + t.amount_gbp
        : balance - t.amount_gbp;
    }, 0);

    return {
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      monthlySavings: monthlyIncome - monthlyExpenses,
    };
  };

  const getExpensesByCategory = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthExpenses = transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return (
        t.transaction_type === "expense" &&
        transactionDate.getMonth() === currentMonth &&
        transactionDate.getFullYear() === currentYear
      );
    });

    const categoryTotals = currentMonthExpenses.reduce(
      (acc, transaction) => {
        const categoryName = transaction.category?.name || "Uncategorized";
        const categoryColor = transaction.category?.color || "#6b7280";

        if (!acc[categoryName]) {
          acc[categoryName] = { amount: 0, color: categoryColor };
        }
        acc[categoryName].amount += transaction.amount_gbp;
        return acc;
      },
      {} as Record<string, { amount: number; color: string }>,
    );

    return Object.entries(categoryTotals).map(([category, data]) => ({
      category,
      amount: data.amount,
      color: data.color,
    }));
  };

  const getLast12MonthsData = () => {
    const now = new Date();
    const months = [];

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthTransactions = transactions.filter((t) => {
        const transactionDate = new Date(t.date);
        return (
          transactionDate.getMonth() === date.getMonth() &&
          transactionDate.getFullYear() === date.getFullYear()
        );
      });

      const income = monthTransactions
        .filter((t) => t.transaction_type === "income")
        .reduce((sum, t) => sum + t.amount_gbp, 0);

      const expenses = monthTransactions
        .filter((t) => t.transaction_type === "expense")
        .reduce((sum, t) => sum + t.amount_gbp, 0);

      months.push({
        month: date.toLocaleDateString("en-GB", {
          month: "short",
          year: "2-digit",
        }),
        income,
        expenses,
        savings: income - expenses,
        categories: {},
      });
    }

    return months;
  };

  const getExpensesByTrip = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthExpenses = transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return (
        t.transaction_type === "expense" &&
        t.trip_id &&
        transactionDate.getMonth() === currentMonth &&
        transactionDate.getFullYear() === currentYear
      );
    });

    const tripTotals = currentMonthExpenses.reduce(
      (acc, transaction) => {
        const tripName = transaction.trip?.name || "Unknown Trip";

        if (!acc[tripName]) {
          acc[tripName] = { amount: 0 };
        }
        acc[tripName].amount += Math.abs(transaction.amount_gbp);
        return acc;
      },
      {} as Record<string, { amount: number }>,
    );

    const colors = [
      "hsl(260, 70%, 50%)",
      "hsl(30, 70%, 50%)",
      "hsl(150, 70%, 50%)",
      "hsl(200, 70%, 50%)",
      "hsl(320, 70%, 50%)",
      "hsl(80, 70%, 50%)",
    ];

    return Object.entries(tripTotals).map(([trip, data], index) => ({
      trip,
      amount: data.amount,
      color: colors[index % colors.length],
    }));
  };

  const getFamilyBalances = () => {
    const familyTransferCategory = categories.find(
      (cat) => cat.name === "Family Transfer",
    );

    if (!familyTransferCategory) return [];

    const familyTransactions = transactions.filter(
      (t) => t.category?.id === familyTransferCategory.id && t.family_member_id,
    );

    const balances = familyMembers.map((member) => {
      const memberTransactions = familyTransactions.filter(
        (t) => t.family_member_id === member.id,
      );

      const totalReceived = memberTransactions
        .filter((t) => t.amount_gbp > 0)
        .reduce((sum, t) => sum + t.amount_gbp, 0);

      const totalGiven = memberTransactions
        .filter((t) => t.amount_gbp < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount_gbp), 0);

      const balance = totalReceived - totalGiven;

      const lastTransaction =
        memberTransactions.length > 0
          ? memberTransactions.sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
            )[0]
          : null;

      return {
        id: member.id,
        name: member.name,
        color: member.color,
        status: member.status,
        balance,
        totalReceived,
        totalGiven,
        lastTransaction: lastTransaction?.date || null,
        transactionCount: memberTransactions.length,
      };
    });

    return balances;
  };

  // Portfolio-specific functions
  const getPortfolioSummary = () => {
    const totalPortfolioValue = investments.reduce(
      (sum, inv) => sum + inv.current_market_value,
      0,
    );

    // FIXED: Use same logic as chartCalculations.getTotalInvestments for consistency
    const totalInvested = investments.reduce(
      (sum, inv) => sum + inv.total_invested, // Already calculated as net invested amount
      0,
    );

    const totalReturn = totalPortfolioValue - totalInvested;
    const returnPercentage =
      totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

    // Find last updated date from market values
    const lastUpdated =
      investments
        .map((inv) => inv.market_value_updated_at)
        .filter((date) => date !== null)
        .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0] ||
      null;

    return {
      totalPortfolioValue,
      totalInvested,
      totalReturn,
      returnPercentage,
      holdingsCount: investments.length,
      lastUpdated,
    };
  };

  const getAssetAllocation = () => {
    // Simplified - just group by investment type
    const investmentsByType = investments
      .filter((inv) => shouldIncludeInPortfolioBreakdown(inv.investment_type))
      .reduce(
        (acc, inv) => {
          const marketValue = inv.current_market_value;
          if (marketValue > 0) {
            if (!acc[inv.investment_type]) {
              acc[inv.investment_type] = { amount: 0, count: 0 };
            }
            acc[inv.investment_type].amount += marketValue;
            acc[inv.investment_type].count++;
          }
          return acc;
        },
        {} as Record<string, { amount: number; count: number }>,
      );

    const totalValue = Object.values(investmentsByType).reduce(
      (sum, data) => sum + data.amount,
      0,
    );

    return Object.entries(investmentsByType).map(([type, data]) => ({
      investment_type: type,
      amount: data.amount,
      percentage: totalValue > 0 ? (data.amount / totalValue) * 100 : 0,
      count: data.count,
    }));
  };

  const getInvestmentTransactions = () => {
    const investmentCategory = categories.find(
      (cat) => cat.name === "Investment",
    );
    if (!investmentCategory) return [];

    return transactions
      .filter((t) => t.category?.id === investmentCategory.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // Simplified market value update function
  const updateInvestmentMarketValue = async (
    investmentId: string,
    marketValue: number,
  ) => {
    try {
      const { error } = await supabase.from("investment_market_values").insert({
        investment_id: investmentId,
        market_value: marketValue,
      });

      if (error) throw error;

      await fetchData(); // Refresh data
      return { success: true };
    } catch (error) {
      console.error("Error updating market value:", error);
      return { success: false, error };
    }
  };

  return {
    transactions,
    categories,
    accounts,
    trips,
    familyMembers,
    investments,
    loading,
    addTransaction,
    bulkUpdateTransactions,
    bulkDeleteTransactions,
    updateInvestmentMarketValue,
    getMonthlyStats,
    getExpensesByCategory,
    getLast12MonthsData,
    getExpensesByTrip,
    getFamilyBalances,
    // Portfolio functions
    getPortfolioSummary,
    getAssetAllocation,
    getInvestmentTransactions,
    refetch: fetchData,
  };
}
