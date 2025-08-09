// utils/chartCalculations.js
// Centralized chart calculations with consistent filtering rules

/**
 * Base filtering function that applies universal exclusion rules
 * @param {Array} transactions - All transactions
 * @returns {Array} - Filtered transactions
 */
const getBaseFilteredTransactions = (transactions) => {
  return transactions.filter(transaction => {
    // Universal exclusions for ALL charts:
    // 1. Exclude Encord expensable transactions (business expenses)
    if (transaction.encord_expensable === true) {
      return false;
    }
    
    // 2. Exclude Transfers and Family Transfer categories
    const categoryName = transaction.category?.name;
    if (categoryName === 'Transfers' || categoryName === 'Family Transfer') {
      return false;
    }
    
    return true;
  });
};

/**
 * Get transactions filtered for expense charts
 * Excludes: base exclusions + Income + Investment categories
 */
const getExpenseFilteredTransactions = (transactions) => {
  return getBaseFilteredTransactions(transactions).filter(transaction => {
    const categoryName = transaction.category?.name;
    // Additional exclusions for expense charts
    return categoryName !== 'Income' && categoryName !== 'Investment';
  });
};

/**
 * Get transactions filtered for income charts  
 * Only includes: Income category (after base exclusions)
 */
const getIncomeFilteredTransactions = (transactions) => {
  return getBaseFilteredTransactions(transactions).filter(transaction => {
    const categoryName = transaction.category?.name;
    return categoryName === 'Income';
  });
};

/**
 * Get transactions filtered for investment charts
 * Only includes: Investment category (after base exclusions)
 */
const getInvestmentFilteredTransactions = (transactions) => {
  return getBaseFilteredTransactions(transactions).filter(transaction => {
    const categoryName = transaction.category?.name;
    return categoryName === 'Investment';
  });
};

/**
 * Get transactions filtered for savings charts
 * Excludes: base exclusions + Investment category (but includes Income)
 */
const getSavingsFilteredTransactions = (transactions) => {
  return getBaseFilteredTransactions(transactions).filter(transaction => {
    const categoryName = transaction.category?.name;
    return categoryName !== 'Investment';
  });
};

// Chart calculation functions
export const chartCalculations = {
  
  /**
   * Calculate expenses by category for current month
   * @param {Array} transactions 
   * @param {Record<string, string>} categoryColors 
   * @returns {Array} - Category expense data with colors
   */
  getExpensesByCategory: (transactions, categoryColors = {}) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Filter for current month expenses
    const currentMonthTransactions = getExpenseFilteredTransactions(transactions).filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });

    const categoryData = {};

    currentMonthTransactions.forEach(transaction => {
      const categoryName = transaction.category?.name || 'Uncategorized';
      const amount = transaction.amount_gbp || 0;
      
      if (!categoryData[categoryName]) {
        categoryData[categoryName] = { expenses: 0, refunds: 0 };
      }
      
      if (amount < 0) {
        categoryData[categoryName].expenses += Math.abs(amount);
      } else if (amount > 0) {
        categoryData[categoryName].refunds += amount;
      }
    });
    
    // Calculate net amounts
    const categoryTotals = {};
    Object.entries(categoryData).forEach(([category, data]) => {
      const netAmount = data.expenses - data.refunds;
      if (netAmount > 0) {
        categoryTotals[category] = netAmount;
      }
    });

    // Fallback colors
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
        color: categoryColors[category] || colors[index % colors.length]
      }))
      .sort((a, b) => b.amount - a.amount);
  },

  /**
   * Calculate expenses over time by month and category
   * @param {Array} transactions 
   * @param {Record<string, string>} categoryColors 
   * @returns {Array} - Monthly expense data with category breakdowns
   */
  getExpensesOverTime: (transactions, categoryColors = {}) => {
    const monthlyData = {};
    
    getExpenseFilteredTransactions(transactions).forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = date.toISOString().slice(0, 7);
      const categoryName = transaction.category?.name || 'Uncategorized';
      const amount = transaction.amount_gbp || 0;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {};
      }
      
      if (!monthlyData[monthKey][categoryName]) {
        monthlyData[monthKey][categoryName] = { expenses: 0, refunds: 0 };
      }
      
      if (amount < 0) {
        monthlyData[monthKey][categoryName].expenses += Math.abs(amount);
      } else if (amount > 0) {
        monthlyData[monthKey][categoryName].refunds += amount;
      }
      });

      return Object.entries(monthlyData)
      .map(([month, categoryData]) => {
        // Calculate net amounts for each category
        const categories = {};
        let totalAmount = 0;
        
        Object.entries(categoryData).forEach(([category, data]) => {
          const netAmount = data.expenses - data.refunds;
          if (netAmount > 0) {
            categories[category] = netAmount;
            totalAmount += netAmount;
          }
        });
        
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
  },

  /**
   * Calculate income over time
   * @param {Array} transactions 
   * @returns {Array} - Monthly income data
   */
  getIncomeOverTime: (transactions) => {
    const monthlyIncome = {};
    
    getIncomeFilteredTransactions(transactions).forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = date.toISOString().slice(0, 7);
      const amount = transaction.amount_gbp || 0;
      
      // Only include positive income amounts
      if (amount > 0) {
        monthlyIncome[monthKey] = (monthlyIncome[monthKey] || 0) + amount;
      }
    });
    
    return Object.entries(monthlyIncome)
    .sort(([a], [b]) => new Date(a + '-01').getTime() - new Date(b + '-01').getTime()) // Sort by date first
    .map(([month, amount]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric' 
      }),
      amount
    }));
  },

  /**
   * Calculate savings over time (Income - Expenses, excluding investments)
   * @param {Array} transactions 
   * @returns {Array} - Monthly savings data
   */
  getSavingsOverTime: (transactions) => {
    const monthlyData = {};
    
    getSavingsFilteredTransactions(transactions).forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = date.toISOString().slice(0, 7);
      const categoryName = transaction.category?.name || 'Uncategorized';
      const amount = transaction.amount_gbp || 0;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0 };
      }
      
      if (categoryName === 'Income' && amount > 0) {
        // Positive income amounts
        monthlyData[monthKey].income += amount;
      } else if (categoryName !== 'Income' && amount < 0) {
        // Negative amounts are expenses - convert to positive for calculation
        monthlyData[monthKey].expenses += Math.abs(amount);
      } else if (categoryName !== 'Income' && amount > 0) {
        // Positive amounts in expense categories (refunds) - reduce expenses
        monthlyData[monthKey].expenses = Math.max(0, monthlyData[monthKey].expenses - amount);
      }
    });

    return Object.entries(monthlyData)
    .sort(([a], [b]) => new Date(a + '-01').getTime() - new Date(b + '-01').getTime()) // Sort by date first
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { 
          month: 'short', 
          year: 'numeric' 
        }),
        amount: data.income - data.expenses // Savings = Income - Expenses
      }))
  },

  /**
   * Calculate investments over time
   * @param {Array} transactions 
   * @returns {Array} - Monthly investment data
   */
  getInvestmentsOverTime: (transactions) => {
    const monthlyInvestments = {};
    
    getInvestmentFilteredTransactions(transactions).forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = date.toISOString().slice(0, 7);
      const amount = transaction.amount_gbp || 0;
      
            // Use separate tracking to avoid order dependency issues
      if (!monthlyInvestments[monthKey]) {
        monthlyInvestments[monthKey] = { invested: 0, withdrawn: 0 };
      }

      if (amount > 0) {
        // Positive amounts are investments (money going into investments)
        monthlyInvestments[monthKey].invested += amount;
      } else if (amount < 0) {
        // Negative amounts are withdrawals (money coming out of investments)  
        monthlyInvestments[monthKey].withdrawn += Math.abs(amount);
      }
    });

    return Object.entries(monthlyInvestments)
    .sort(([a], [b]) => new Date(a + '-01').getTime() - new Date(b + '-01').getTime()) // Sort by date first
    .map(([month, data]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric' 
      }),
      amount: data.invested - data.withdrawn // Net investment amount
    }))
  },

  /**
   * Calculate expenses by trip for current month
   * @param {Array} transactions 
   * @returns {Array} - Trip expense data with colors
   */
  getExpensesByTrip: (transactions) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

// Filter for ALL expenses with trips (not just current month)
const tripTransactions = getExpenseFilteredTransactions(transactions).filter(t => {
  return t.trip?.name; // Only include transactions that have a trip
});

    const tripData = {};

    tripTransactions.forEach(transaction => {
      const tripName = transaction.trip.name;
      const amount = transaction.amount_gbp || 0;
      
      if (!tripData[tripName]) {
        tripData[tripName] = { expenses: 0, refunds: 0 };
      }
      
      if (amount < 0) {
        // Negative amounts are expenses
        tripData[tripName].expenses += Math.abs(amount);
      } else if (amount > 0) {
        // Positive amounts are refunds
        tripData[tripName].refunds += amount;
      }
    });
    
    // Calculate net amounts
    const tripTotals = {};
    Object.entries(tripData).forEach(([trip, data]) => {
      const netAmount = data.expenses - data.refunds;
      if (netAmount > 0) {
        tripTotals[trip] = netAmount;
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
      .sort((a, b) => b.amount - a.amount);
  },

  /**
   * Calculate monthly stats for current month
   * @param {Array} transactions 
   * @returns {Object} - Current month financial stats
   */
  getMonthlyStats: (transactions) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Use base filtered transactions for balance calculation (includes all valid transactions)
    const baseFilteredTransactions = getBaseFilteredTransactions(transactions);
    
    const currentMonthTransactions = baseFilteredTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });

    // Calculate monthly income (from Income category only)
    const monthlyIncome = currentMonthTransactions
    .filter(t => t.category?.name === 'Income' && t.amount_gbp > 0)
    .reduce((sum, t) => sum + t.amount_gbp, 0);
        
    // Calculate monthly income (from Income category only)
    let grossExpenses = 0;
    let expenseRefunds = 0;
    
    currentMonthTransactions
      .filter(t => t.category?.name !== 'Income' && t.category?.name !== 'Investment')
      .forEach(t => {
        const amount = t.amount_gbp || 0;
        if (amount < 0) {
          grossExpenses += Math.abs(amount);
        } else if (amount > 0) {
          expenseRefunds += amount;
        }
      });
    
    const netMonthlyExpenses = Math.max(0, grossExpenses - expenseRefunds);

    // Calculate monthly expenses (excluding Income and Investment categories)
    const monthlyExpenses = currentMonthTransactions
      .filter(t => t.category?.name !== 'Income' && t.category?.name !== 'Investment' && t.amount_gbp < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount_gbp), 0);

    // Calculate total balance (all transactions contribute)
    const totalBalance = baseFilteredTransactions
      .reduce((balance, t) => {
        const amount = t.amount_gbp || 0;
        return balance + amount; // Positive amounts increase balance, negative decrease it
      }, 0);

    return {
      totalBalance,
      monthlyIncome,
      monthlyExpenses: netMonthlyExpenses,
      monthlySavings: monthlyIncome - netMonthlyExpenses
    };
  }
};