import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  exchange_rate: number;
  amount_gbp: number;
  transaction_type: 'income' | 'expense' | 'transfer';
  trip_id: string | null;
  family_member_id: string | null; // NEW: Family member reference
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
  family_member: { // NEW: Family member data
    id: string;
    name: string;
    color: string;
    status: 'active' | 'settled' | 'archived';
  } | null;
}

export interface Category {
  id: string;
  name: string;
  category_type: 'income' | 'expense';
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

// NEW: Family member interface
export interface FamilyMember {
  id: string;
  user_id: string;
  name: string;
  color: string;
  status: 'active' | 'settled' | 'archived';
  created_at?: string;
  updated_at?: string;
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]); // NEW: Family members state
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // UPDATED: Fetch transactions with family member data included
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          *,
          category:categories(*),
          account:accounts(*),
          trip:trips(id, name),
          family_member:family_members(id, name, color, status)
        `)
        .eq('user_id', user?.id)
        .order('date', { ascending: false });

      if (transactionsError) throw transactionsError;

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user?.id)
        .order('name');

      if (categoriesError) throw categoriesError;

      // Fetch accounts
      const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user?.id)
        .order('name');

      if (accountsError) throw accountsError;

      // Fetch trips
      const { data: tripsData, error: tripsError } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user?.id)
        .order('name');

      if (tripsError) {
        console.log('No trips found or error fetching trips:', tripsError);
      }

      // NEW: Fetch family members
      const { data: familyMembersData, error: familyMembersError } = await supabase
        .from('family_members')
        .select('*')
        .eq('user_id', user?.id)
        .order('name');

      if (familyMembersError) {
        console.log('No family members found or error fetching family members:', familyMembersError);
      }

      setTransactions((transactionsData || []) as unknown as Transaction[]);
      setCategories((categoriesData || []) as Category[]);
      setAccounts((accountsData || []) as Account[]);
      setTrips((tripsData || []) as Trip[]);
      setFamilyMembers((familyMembersData || []) as unknown as FamilyMember[]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'category' | 'account' | 'trip' | 'family_member'> & { 
    category_id?: string; 
    account_id: string;
    trip_id?: string | null;
    family_member_id?: string | null; // NEW: Family member support
  }) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .insert([{
          ...transaction,
          user_id: user?.id,
        }]);

      if (error) throw error;
      
      await fetchData();
      return { success: true };
    } catch (error) {
      console.error('Error adding transaction:', error);
      return { success: false, error };
    }
  };

  const getMonthlyStats = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });

    const monthlyIncome = currentMonthTransactions
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + t.amount_gbp, 0);

    const monthlyExpenses = currentMonthTransactions
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + t.amount_gbp, 0);

    const totalBalance = transactions
      .reduce((balance, t) => {
        return t.transaction_type === 'income' 
          ? balance + t.amount_gbp 
          : balance - t.amount_gbp;
      }, 0);

    return {
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      monthlySavings: monthlyIncome - monthlyExpenses
    };
  };

  const getExpensesByCategory = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthExpenses = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return t.transaction_type === 'expense' &&
             transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });

    const categoryTotals = currentMonthExpenses.reduce((acc, transaction) => {
      const categoryName = transaction.category?.name || 'Uncategorized';
      const categoryColor = transaction.category?.color || '#6b7280';
      
      if (!acc[categoryName]) {
        acc[categoryName] = { amount: 0, color: categoryColor };
      }
      acc[categoryName].amount += transaction.amount_gbp;
      return acc;
    }, {} as Record<string, { amount: number; color: string }>);

    return Object.entries(categoryTotals).map(([category, data]) => ({
      category,
      amount: data.amount,
      color: data.color
    }));
  };

  const getLast12MonthsData = () => {
    const now = new Date();
    const months = [];

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === date.getMonth() && 
               transactionDate.getFullYear() === date.getFullYear();
      });

      const income = monthTransactions
        .filter(t => t.transaction_type === 'income')
        .reduce((sum, t) => sum + t.amount_gbp, 0);

      const expenses = monthTransactions
        .filter(t => t.transaction_type === 'expense')
        .reduce((sum, t) => sum + t.amount_gbp, 0);

      months.push({
        month: date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
        income,
        expenses,
        savings: income - expenses,
        categories: {}
      });
    }

    return months;
  };

  const getExpensesByTrip = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthExpenses = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return t.transaction_type === 'expense' &&
             t.trip_id &&
             transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });

    const tripTotals = currentMonthExpenses.reduce((acc, transaction) => {
      const tripName = transaction.trip?.name || 'Unknown Trip';
      
      if (!acc[tripName]) {
        acc[tripName] = { amount: 0 };
      }
      acc[tripName].amount += Math.abs(transaction.amount_gbp);
      return acc;
    }, {} as Record<string, { amount: number }>);

    const colors = [
      'hsl(260, 70%, 50%)', 'hsl(30, 70%, 50%)', 'hsl(150, 70%, 50%)',
      'hsl(200, 70%, 50%)', 'hsl(320, 70%, 50%)', 'hsl(80, 70%, 50%)'
    ];

    return Object.entries(tripTotals).map(([trip, data], index) => ({
      trip,
      amount: data.amount,
      color: colors[index % colors.length]
    }));
  };

  // NEW: Get family balance calculations
  const getFamilyBalances = () => {
    const familyTransferCategory = categories.find(cat => cat.name === 'Family Transfer');
    
    if (!familyTransferCategory) return [];

    const familyTransactions = transactions.filter(t => 
      t.category?.id === familyTransferCategory.id && t.family_member_id
    );

    const balances = familyMembers.map(member => {
      const memberTransactions = familyTransactions.filter(t => 
        t.family_member_id === member.id
      );

      const totalReceived = memberTransactions
        .filter(t => t.amount_gbp > 0) // Money received from family
        .reduce((sum, t) => sum + t.amount_gbp, 0);

      const totalGiven = memberTransactions
        .filter(t => t.amount_gbp < 0) // Money given back to family
        .reduce((sum, t) => sum + Math.abs(t.amount_gbp), 0);

      const balance = totalReceived - totalGiven; // Positive = you owe them, Negative = they owe you

      const lastTransaction = memberTransactions.length > 0 
        ? memberTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
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
        transactionCount: memberTransactions.length
      };
    });

    return balances;
  };

  return {
    transactions,
    categories,
    accounts,
    trips,
    familyMembers, // NEW: Return family members
    loading,
    addTransaction,
    getMonthlyStats,
    getExpensesByCategory,
    getLast12MonthsData,
    getExpensesByTrip,
    getFamilyBalances, // NEW: Return family balance calculations
    refetch: fetchData
  };
}