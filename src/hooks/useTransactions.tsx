import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { shouldIncludeInPortfolioBreakdown } from "@/components/portfolio/investments";

// New interface for investment types with colors
export interface InvestmentType {
  id: string;
  name: string;
  color: string;
  created_at?: string;
  updated_at?: string;
}

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
    color: string; // Added color to account
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
    investment_type_detail?: {
      name: string;
      color: string;
    }; // Added investment type details with color
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
  color: string; // Added color field
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

// Updated Investment interface with investment type details
export interface Investment {
  id: string;
  user_id: string;
  ticker: string;
  investment_type: string;
  investment_type_id?: string; // Added for new foreign key
  investment_type_detail?: {
    name: string;
    color: string;
  }; // Added investment type details with color
  created_at?: string;
  updated_at?: string;
  // These are now calculated across all accounts for this investment
  current_market_value: number;
  market_value_updated_at: string | null;
  total_invested: number;
  transaction_count: number;
  total_return: number;
  return_percentage: number;
}

export interface InvestmentMarketValue {
  id: string;
  investment_id: string;
  account_id: string;
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
  const [investmentTypes, setInvestmentTypes] = useState<InvestmentType[]>([]); // Added investment types state
  const [marketValues, setMarketValues] = useState<InvestmentMarketValue[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Helper function to get exactly 1 market value for each investment/account combination
  const getMostRecentMarketValues = (marketValues: InvestmentMarketValue[]) => {
    // Filter out records with null account_id (bad migration data)
    const validMarketValues = marketValues.filter(
      (mv) => mv.account_id != null,
    );

    const grouped = validMarketValues.reduce(
      (acc, mv) => {
        const key = `${mv.investment_id}-${mv.account_id}`;
        // Only keep the first one for each combination (since they all have same date after migration)
        // Or use the one with highest ID if multiple exist
        if (!acc[key] || mv.id > acc[key].id) {
          acc[key] = mv;
        }
        return acc;
      },
      {} as Record<string, InvestmentMarketValue>,
    );

    return Object.values(grouped);
  };

  // Helper function to get default market value from latest transaction for a specific investment/account
  const getDefaultMarketValueFromTransactions = (
    investmentId: string,
    accountId: string,
    transactions: Transaction[],
  ) => {
    const relevantTransactions = transactions
      .filter(
        (t) =>
          t.investment_id === investmentId &&
          t.account?.id === accountId &&
          t.category?.name === "Investment" &&
          Math.abs(t.amount_gbp || 0) > 0,
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (relevantTransactions.length === 0) {
      return 0;
    }

    const totalInvested = relevantTransactions.reduce((sum, t) => {
      const amount = t.amount_gbp || 0;
      if (amount > 0) {
        return sum + amount;
      } else {
        return sum - Math.abs(amount);
      }
    }, 0);

    return Math.max(0, totalInvested);
  };

  // Calculate investment metrics across all accounts
  const calculateInvestmentMetrics = (
    investmentId: string,
    transactions: Transaction[],
    marketValues: InvestmentMarketValue[],
  ) => {
    // Get all investment transactions for this investment across all accounts
    const investmentTransactions = transactions.filter(
      (t) =>
        t.investment_id === investmentId && t.category?.name === "Investment",
    );

    // Calculate total invested across all accounts
    const total_invested = investmentTransactions.reduce((sum, t) => {
      const amount = t.amount_gbp || 0;
      if (amount > 0) {
        return sum + amount;
      } else {
        return sum - Math.abs(amount);
      }
    }, 0);

    // CRITICAL FIX: If no investment transactions exist, don't count any market value
    if (investmentTransactions.length === 0) {
      return {
        current_market_value: 0,
        market_value_updated_at: null,
        total_invested: 0,
        transaction_count: 0,
        total_return: 0,
        return_percentage: 0,
      };
    }

    // Get most recent market values for this investment across all accounts (filter out null account_id)
    const investmentMarketValues = marketValues.filter(
      (mv) => mv.investment_id === investmentId && mv.account_id != null,
    );
    const mostRecentValues = getMostRecentMarketValues(investmentMarketValues);

    // Sum market values across all accounts
    let current_market_value = mostRecentValues.reduce(
      (sum, mv) => sum + mv.market_value,
      0,
    );

    // Find the most recent update timestamp
    let market_value_updated_at =
      mostRecentValues.length > 0
        ? mostRecentValues.sort(
            (a, b) =>
              new Date(b.updated_at).getTime() -
              new Date(a.updated_at).getTime(),
          )[0].updated_at
        : null;

    // If no market values exist, calculate defaults from transactions per account
    if (mostRecentValues.length === 0) {
      // Get unique accounts for this investment
      const accountsForInvestment = [
        ...new Set(
          investmentTransactions.map((t) => t.account?.id).filter(Boolean),
        ),
      ];

      // Calculate default value for each account and sum them
      current_market_value = accountsForInvestment.reduce((sum, accountId) => {
        return (
          sum +
          getDefaultMarketValueFromTransactions(
            investmentId,
            accountId!,
            transactions,
          )
        );
      }, 0);

      market_value_updated_at = null;
    }

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

      // Fetch investment types with colors
      const { data: investmentTypesData, error: investmentTypesError } =
        await supabase.from("investment_types").select("*").order("name");

      if (investmentTypesError) {
        console.log("Error fetching investment types:", investmentTypesError);
      }

      // Fetch transactions with investment data including colors
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
          investment:investments(
            id, ticker, investment_type,
            investment_type_detail:investment_types(name, color)
          )
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

      // Fetch accounts with colors
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

      // Get market values with account information
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
      setInvestmentTypes((investmentTypesData || []) as InvestmentType[]); // Set investment types
      setMarketValues(marketValues);

      // Calculate investment metrics (simplified - one record per investment)
      try {
        const { data: investmentsData, error: investmentsError } =
          await supabase
            .from("investments")
            .select(
              `
              *,
              investment_type_detail:investment_types(name, color)
            `,
            )
            .eq("user_id", user?.id)
            .order("ticker");

        if (investmentsError) {
          console.log(
            "No investments found or error fetching investments:",
            investmentsError,
          );
        }

        // Process investments - one record per investment (not per account)
        const processedInvestments: Investment[] = (investmentsData || []).map(
          (inv: any) => {
            const metrics = calculateInvestmentMetrics(
              inv.id,
              transactions,
              marketValues,
            );
            return {
              ...inv,
              ...metrics,
            };
          },
        );

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

    const transactionMap = new Map(
      transactions.map((t) => [
        t.id,
        { description: t.description, date: t.date },
      ]),
    );

    for (const transactionId of transactionIds) {
      try {
        const updateData: any = {};

        switch (property) {
          case "category":
            updateData.category_id = value === "none" ? null : value;

            if (additionalData?.family_member_id) {
              updateData.family_member_id = additionalData.family_member_id;
              updateData.transaction_type = "transfer";
            } else if (value !== "none") {
              const familyTransferCategory = categories.find(
                (cat) => cat.name === "Family Transfer",
              );
              if (value !== familyTransferCategory?.id) {
                updateData.family_member_id = null;
                updateData.transaction_type = "expense";
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

        const { error } = await supabase
          .from("transactions")
          .update(updateData)
          .eq("id", transactionId)
          .eq("user_id", user?.id);

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

    const transactionMap = new Map(
      transactions.map((t) => [
        t.id,
        { description: t.description, date: t.date },
      ]),
    );

    for (const transactionId of transactionIds) {
      try {
        const { error } = await supabase
          .from("transactions")
          .delete()
          .eq("id", transactionId)
          .eq("user_id", user?.id);

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
        const categoryColor =
          transaction.category?.color || "hsl(var(--muted))";

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

  // Portfolio-specific functions - use aggregated investment data
  const getPortfolioSummary = () => {
    // Sum the current_market_value from each investment (already aggregated across accounts)
    const totalPortfolioValue = investments.reduce(
      (sum, inv) => sum + inv.current_market_value,
      0,
    );

    // Calculate total invested across all investments (already aggregated)
    const totalInvested = investments.reduce(
      (sum, inv) => sum + inv.total_invested,
      0,
    );

    const totalReturn = totalPortfolioValue - totalInvested;
    const returnPercentage =
      totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

    // Find last updated date from investments
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
    // Use aggregated investment data (already properly calculated per investment) with database colors
    const investmentsByType = investments
      .filter((inv) => shouldIncludeInPortfolioBreakdown(inv.investment_type))
      .reduce(
        (acc, inv) => {
          const marketValue = inv.current_market_value;
          if (marketValue > 0) {
            if (!acc[inv.investment_type]) {
              acc[inv.investment_type] = {
                amount: 0,
                count: 0,
                color: inv.investment_type_detail?.color || "hsl(var(--muted))", // Use database color
              };
            }
            acc[inv.investment_type].amount += marketValue;
            acc[inv.investment_type].count++;
          }
          return acc;
        },
        {} as Record<string, { amount: number; count: number; color: string }>,
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
      color: data.color, // Include database color
    }));
  };

  const getAccountAllocation = () => {
    // Get most recent market values for each investment/account combination (helper already filters null account_id)
    const mostRecentValues = getMostRecentMarketValues(marketValues);

    // Group market values by account with database colors
    const investmentsByAccount = mostRecentValues.reduce(
      (acc, mv) => {
        const investment = investments.find(
          (inv) => inv.id === mv.investment_id,
        );
        if (
          investment &&
          shouldIncludeInPortfolioBreakdown(investment.investment_type)
        ) {
          const account = accounts.find((acc) => acc.id === mv.account_id);
          if (account) {
            const accountName = account.name;
            if (!acc[accountName]) {
              acc[accountName] = {
                amount: 0,
                count: 0,
                color: account.color || "hsl(var(--muted))", // Use database color with fallback
              };
            }
            acc[accountName].amount += mv.market_value;
            acc[accountName].count++;
          }
        }
        return acc;
      },
      {} as Record<string, { amount: number; count: number; color: string }>,
    );

    const totalValue = Object.values(investmentsByAccount).reduce(
      (sum, data) => sum + data.amount,
      0,
    );

    return Object.entries(investmentsByAccount).map(([accountName, data]) => ({
      account_name: accountName,
      amount: data.amount,
      percentage: totalValue > 0 ? (data.amount / totalValue) * 100 : 0,
      count: data.count,
      color: data.color, // Include database color
    }));
  };

  const getTopAccountByMarketValue = () => {
    const accountAllocation = getAccountAllocation();
    if (accountAllocation.length === 0) return null;

    return accountAllocation.reduce((top, account) =>
      account.amount > top.amount ? account : top,
    );
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

  // Updated market value function - still account-specific
  const updateInvestmentMarketValue = async (
    investmentId: string,
    marketValue: number,
    accountId: string,
  ) => {
    try {
      // Delete existing market value for this investment in this account
      const { error: deleteError } = await supabase
        .from("investment_market_values")
        .delete()
        .eq("investment_id", investmentId)
        .eq("account_id", accountId);

      if (deleteError && deleteError.code !== "PGRST116") {
        console.warn("Could not delete existing market value:", deleteError);
      }

      // Insert new market value
      const { error } = await supabase.from("investment_market_values").insert({
        investment_id: investmentId,
        account_id: accountId,
        market_value: marketValue,
      });

      if (error) throw error;

      await fetchData();
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
    investmentTypes, // Added investment types to return object
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
    getAccountAllocation,
    getTopAccountByMarketValue,
  };
}
