export interface ParsedTransaction {
  date: string;
  description: string;
  amount_usd?: number;
  amount_gbp: number;
  currency: "USD" | "GBP";
  category: string;
  account: string;
  encord_expensable: boolean;
  trip: string;
}

// 5-year average USD to GBP exchange rate
const USD_TO_GBP_RATE = 0.79;

// £100 in USD for travel threshold
const TRAVEL_THRESHOLD_USD = 100 / USD_TO_GBP_RATE; // ~$126.58
const TRAVEL_THRESHOLD_GBP = 100;

// Comprehensive Personal Capital category mappings
const PERSONAL_CAPITAL_CATEGORY_MAP: Record<string, string> = {
  // Current mappings (updated)
  "restaurants": "Dining",
  "groceries": "Groceries", 
  "general merchandise": "Extras",
  "clothing/shoes": "Extras",
  "home improvement": "Other / Unknown",
  "online services": "Service Charges/Fees",
  "other expenses": "Other / Unknown",
  "transportation": "Commute",
  "transport": "Commute",
  "entertainment": "Extras",
  "income": "Income",
  "securities transfers": "Investment",
  "transfers": "Investment",
  "cash & cash equivalents": "Income",
  "commute": "Commute",
  // "travel": handled conditionally by amount
  "food & dining": "Dining",
  "shopping": "Extras",
  "bills & utilities": "Bills",
  "personal care": "Personal Care",
  "health & fitness": "Personal Care",
  "auto & transport": "Commute",
  "fees & charges": "Service Charges/Fees",
  
  // Additional comprehensive mappings
  "advertising": "Other / Unknown",
  "advisory fee": "Investment",
  "atm/cash": "Service Charges/Fees",
  "automotive": "Commute",
  "bills": "Bills",
  "business miscellaneous": "Other / Unknown",
  "cable/satellite": "Bills",
  "charitable giving": "Other / Unknown",
  "checks": "Service Charges/Fees",
  "child/dependent": "Extras",
  "dues & subscriptions": "Bills",
  "education": "Personal Care",
  "electronics": "Extras",
  "gasoline/fuel": "Commute",
  "gifts": "Extras",
  "paychecks/salary": "Income",
  "refunds & reimbursements": "Income",
  "retirement income": "Income",
  "rewards": "Income",
  "sales": "Income",
  "services": "Income",
  "other income": "Income",
  "interest": "Income",
  "investment income": "Income",
  "dividends received": "Investment",
  "dividends received (tax-advantaged)": "Income",
  "deposits": "Income",
  
  // Investment categories (all map to Investment per requirement #2)
  "investment": "Investment",
  "securities trades": "Investment",
  "portfolio management": "Investment",
  "retirement contributions": "Investment",
  "diversified transferred-in securities": "Investment",
  "not traded": "Investment",
  "personal strategy implementation": "Investment",
  "savings": "Investment",
  "strategy change": "Investment",
  "tax location": "Investment",
  "tax loss harvesting": "Investment",
  
  // Other categories
  "allocated excess cash": "Other / Unknown",
  "cash raised": "Other / Unknown",
  "client request": "Other / Unknown",
  "credit card": "Transfers",
  "expense reimbursement": "Other / Unknown",
  "general rebalance": "Other / Unknown",
  "uncategorized": "Other / Unknown",
};

// Comprehensive MoneyHub category mappings (using subcategories)
const MONEYHUB_CATEGORY_MAP: Record<string, string> = {
  // Bills subcategories
  "insurance": "Bills",
  "cable": "Bills",
  "online service": "Bills", 
  "other-bills": "Bills",
  "telephone": "Bills",
  "utilities": "Bills",
  "rent": "Bills",
  
  // Business subcategories (map to Other per requirement #6)
  "office-supplies": "Other / Unknown",
  "advertising": "Other / Unknown",
  "business": "Other / Unknown",
  "postage": "Other / Unknown",
  "printing": "Other / Unknown",
  "office-maintenance": "Other / Unknown",
  "wages": "Other / Unknown",
  
  // Cash
  "atm": "Service Charges/Fees",
  
  // Entertainment subcategories
  "entertainment": "Extras",
  "restaurants": "Dining",
  "hobbies": "Extras",
  "dues": "Bills",
  "gambling": "Extras",
  "extras": "Extras",
  
  // Gifts
  "charitable": "Other / Unknown",
  "gifts to friends & family": "Extras",
  
  // Groceries
  "groceries": "Groceries",
  "general merchandise": "Extras",
  
  // Health
  "healthcare": "Personal Care",
  "personal": "Personal Care",
  
  // Household subcategories
  "child": "Extras",
  "clothing & shoes": "Extras",
  "education": "Personal Care", // Per your requirement
  "homemaintenance": "Other / Unknown",
  "homeimprovement": "Other / Unknown",
  "pets": "Extras",
  "electronic": "Extras",
  
  // Income subcategories
  "benefits": "Income",
  "consulting": "Income",
  "deposits": "Income",
  "expense": "Income", // Reimbursements
  "interest": "Income",
  "investment": "Income",
  "other-income": "Income",
  "paychecks": "Income",
  "rental-income": "Income",
  "retirement": "Income",
  "rewards": "Income",
  "salary": "Income",
  "sales": "Income",
  "services": "Income",
  "work expenses": "Transfers",
  
  // Mixed
  "mixed": "Other / Unknown",
  
  // Other
  "uncategorized": "Other / Unknown",
  "other": "Other / Unknown",
  "cheques": "Other / Unknown",
  
  // Repayments
  "loans": "Bills",
  "mortgages": "Bills",
  
  // Taxes
  "taxes": "Bills",
  
  // Transfers subcategories (per requirement #7)
  "credit card payments": "Transfers", // Credit card payments
  "transfers": "Transfers",
  // "securities": handled conditionally by amount (positive = Investment, negative = Transfers)
  "savings": "Transfers",
  "pension-contributions": "Transfers",
  
  // Transport subcategories
  "automotive": "Commute",
  "gasoline": "Commute",
  // "travel": handled conditionally by amount
  
  // Legacy mappings to maintain compatibility
  "eating out": "Dining",
  "transport": "Commute", 
  "bills": "Bills",
  "cash & cash equivalents": "Income",
  "securities trades": "Investment",
  "health": "Personal Care",
  "subscriptions": "Service Charges/Fees",
  "fees": "Service Charges/Fees",
};

// Special transaction name mappings for MoneyHub
const MONEYHUB_SPECIAL_NAMES: Record<string, string> = {
  "rent": "Bills",
  "settle siofra splitwise": "Bills",
};

// Account mappings for Personal Capital
const PERSONAL_CAPITAL_ACCOUNT_MAP: Record<string, string> = {
  "capital one": "Capital One",
  "citi aadvantage": "Citi AAdvantage", 
  "citi advantage": "Citi AAdvantage",
  "vanguard": "Vanguard",
  "wealthfront": "Wealthfront",
  "fidelity": "Fidelity",
  "amex": "Amex Gold",
  "american express": "Amex Gold",
  "bank of america": "BofA Checkings",
  "bofa": "BofA Checkings",
  "chase": "Cash Rewards",
  "discover": "Cash Rewards",
};

// Account mappings for MoneyHub  
const MONEYHUB_ACCOUNT_MAP: Record<string, string> = {
  "hsbc checking": "HSBC Checkings",
  "hsbc checkings": "HSBC Checkings", 
  "hsbc current": "HSBC Checkings",
  "amex uk": "Amex UK",
  "amex": "Amex UK",
  "american express": "Amex UK",
  "global money": "Global Money",
  "dodl": "Dodl (LISA)",
  "lisa": "Dodl (LISA)",
};

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Enhanced category mapping function for Personal Capital
 */
function mapPersonalCapitalCategory(category: string, amount: number): string {
  const cleanCategory = category.toLowerCase().trim();
  
  // Handle travel with amount-based logic
  if (cleanCategory === "travel") {
    return Math.abs(amount) >= TRAVEL_THRESHOLD_USD ? "Extras" : "Commute";
  }
  
  return PERSONAL_CAPITAL_CATEGORY_MAP[cleanCategory] || "Other / Unknown";
}

/**
 * Enhanced category mapping function for MoneyHub
 */
function mapMoneyHubCategory(category: string, amount: number, description: string = ""): string {
  const cleanCategory = category.toLowerCase().trim();
  const cleanDescription = description.toLowerCase().trim();
  
  // Handle special transaction names first
  for (const [name, mappedCategory] of Object.entries(MONEYHUB_SPECIAL_NAMES)) {
    if (cleanDescription.includes(name)) {
      return mappedCategory;
    }
  }
  
  // Handle travel with amount-based logic
  if (cleanCategory === "travel") {
    return Math.abs(amount) >= TRAVEL_THRESHOLD_GBP ? "Extras" : "Commute";
  }
  
  // Handle securities with positive/negative logic
  if (cleanCategory === "securities") {
    return amount > 0 ? "Investment" : "Transfers";
  }
  
  return MONEYHUB_CATEGORY_MAP[cleanCategory] || "Other / Unknown";
}

/**
 * Unified category mapping function (maintains backward compatibility)
 */
function mapCategory(category: string, isPersonalCapital: boolean, amount: number = 0, description: string = ""): string {
  if (isPersonalCapital) {
    return mapPersonalCapitalCategory(category, amount);
  } else {
    return mapMoneyHubCategory(category, amount, description);
  }
}

function mapAccount(account: string, isPersonalCapital: boolean): string {
  const cleanAccount = account.toLowerCase().trim();
  const map = isPersonalCapital ? PERSONAL_CAPITAL_ACCOUNT_MAP : MONEYHUB_ACCOUNT_MAP;
  
  // Try exact match first
  if (map[cleanAccount]) {
    return map[cleanAccount];
  }
  
  // Try partial match
  for (const [key, value] of Object.entries(map)) {
    if (cleanAccount.includes(key) || key.includes(cleanAccount)) {
      return value;
    }
  }
  
  // Default fallback
  return isPersonalCapital ? "BofA Checkings" : "HSBC Checkings";
}

function parseDate(dateString: string): string {
  // Handle various date formats
  const cleanDate = dateString.trim();
  
  // Try MM/DD/YY or MM/DD/YYYY format (Personal Capital)
  if (cleanDate.includes('/')) {
    const [month, day, year] = cleanDate.split('/');
    const fullYear = year.length === 2 ? `20${year}` : year;
    return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Try DD/MM/YY or DD/MM/YYYY format (MoneyHub)
  if (cleanDate.includes('/')) {
    const parts = cleanDate.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      const fullYear = year.length === 2 ? `20${year}` : year;
      return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  
  // Try YYYY-MM-DD format (already correct)
  if (cleanDate.includes('-') && cleanDate.length >= 8) {
    return cleanDate;
  }
  
  // Default to today if parsing fails
  return new Date().toISOString().split('T')[0];
}

export function parsePersonalCapitalCSV(csvContent: string): ParsedTransaction[] {
  const lines = csvContent.trim().split('\n');
  const transactions: ParsedTransaction[] = [];
  
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    try {
      const columns = parseCSVLine(line);
      
      // Personal Capital format: DATE, ACCOUNT, DESCRIPTION, CATEGORY, TAGS, AMOUNT
      if (columns.length >= 6) {
        const date = parseDate(columns[0]);           // Date
        const accountRaw = columns[1];                // Account  
        const description = columns[2] || 'Unknown Transaction'; // Description
        const categoryRaw = columns[3];               // Category
        // columns[4] is Tags (ignored)
        const amount = parseFloat(columns[5]) || 0;   // Amount
        
        let category = mapPersonalCapitalCategory(categoryRaw || 'Other / Unknown', amount);
        const account = mapAccount(accountRaw || 'Capital One', true);

        // Check if Investment category should be Transfers based on account type
        const investmentAccounts = ['Vanguard', 'Wealthfront', 'Fidelity'];
        if (category === 'Investment' && !investmentAccounts.includes(account)) {
          category = 'Transfers';
        };
        
        // Convert USD to GBP
        const amountGbp = amount * USD_TO_GBP_RATE;
        
        console.log(`Personal Capital: ${date}, ${description}, $${amount} -> £${amountGbp.toFixed(2)}, Category: ${category}`);
        
        transactions.push({
          date,
          description: description.substring(0, 255), // Limit description length
          amount_usd: amount,
          amount_gbp: amountGbp,
          currency: "USD",
          category,
          account,
          encord_expensable: false, // Default to false
          trip: "", // Default to empty
        });
      }
    } catch (error) {
      console.warn(`Failed to parse Personal Capital line ${i + 1}:`, error);
    }
  }
  
  return transactions;
}

export function parseMoneyHubCSV(csvContent: string): ParsedTransaction[] {
  const lines = csvContent.trim().split('\n');
  const transactions: ParsedTransaction[] = [];
  
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    try {
      const columns = parseCSVLine(line);
      
      // MoneyHub format: DATE, AMOUNT, DESCRIPTION, CATEGORY, CATEGORY, ACCOUNT
      if (columns.length >= 6) {
        const date = parseDate(columns[0]);
        const amount = parseFloat(columns[1]) || 0;
        const description = columns[2] || 'Unknown Transaction';
        const categoryRaw = columns[3]; // Using first category (subcategory)
        const account = mapAccount(columns[5] || 'HSBC Checkings', false);
        
        // Use enhanced mapping with amount and description parameters
        const category = mapMoneyHubCategory(categoryRaw || 'Other / Unknown', amount, description);
        
        console.log(`MoneyHub: ${date}, ${description}, £${amount}, Category: ${category}`);
        
        transactions.push({
          date,
          description: description.substring(0, 255), // Limit description length
          amount_gbp: amount,
          currency: "GBP",
          category,
          account,
          encord_expensable: false, // Default to false
          trip: "", // Default to empty
        });
      }
    } catch (error) {
      console.warn(`Failed to parse MoneyHub line ${i + 1}:`, error);
    }
  }
  
  return transactions;
}