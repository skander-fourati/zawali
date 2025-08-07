export interface ParsedTransaction {
  date: string;
  description: string;
  amount_usd?: number;
  amount_gbp: number;
  currency: "USD" | "GBP";
  category: string;
  account: string;
  encord: boolean;
  trip: string;
}

// 5-year average USD to GBP exchange rate
const USD_TO_GBP_RATE = 0.79;

// Category mappings for Personal Capital
const PERSONAL_CAPITAL_CATEGORY_MAP: Record<string, string> = {
  "restaurants": "Dining",
  "groceries": "Groceries", 
  "general merchandise": "Extras",
  "clothing/shoes": "Extras",
  "home improvement": "Other",
  "online services": "Service Charges",
  "other expenses": "Other",
  "transportation": "Commute",
  "transport": "Commute",
  "entertainment": "Extras",
  "income": "Income",
  "securities transfers": "Investment",
  "transfers": "Investment",
  "cash & cash equivalents": "Income",
  "commute": "Commute",
  "travel": "Commute",
  "food & dining": "Dining",
  "shopping": "Extras",
  "bills & utilities": "Bills",
  "personal care": "Personal Care",
  "health & fitness": "Personal Care",
  "auto & transport": "Commute",
  "fees & charges": "Service Charges",
};

// Category mappings for MoneyHub
const MONEYHUB_CATEGORY_MAP: Record<string, string> = {
  "eating out": "Dining",
  "transport": "Commute", 
  "travel": "Commute",
  "entertainment": "Extras",
  "income": "Income",
  "transfers": "Investment",
  "groceries": "Groceries",
  "shopping": "Extras",
  "bills": "Bills",
  "cash & cash equivalents": "Income",
  "securities transfers": "Investment",
  "personal care": "Personal Care",
  "health": "Personal Care",
  "subscriptions": "Service Charges",
  "fees": "Service Charges",
  "other": "Other",
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

function mapCategory(category: string, isPersonalCapital: boolean): string {
  const cleanCategory = category.toLowerCase().trim();
  const map = isPersonalCapital ? PERSONAL_CAPITAL_CATEGORY_MAP : MONEYHUB_CATEGORY_MAP;
  return map[cleanCategory] || "Other";
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
      
      // CORRECTED Personal Capital format: DATE, ACCOUNT, DESCRIPTION, CATEGORY, TAGS, AMOUNT
      if (columns.length >= 6) {
        const date = parseDate(columns[0]);           // Date
        const accountRaw = columns[1];                // Account  
        const description = columns[2] || 'Unknown Transaction'; // Description
        const categoryRaw = columns[3];               // Category
        // columns[4] is Tags (ignored)
        const amount = parseFloat(columns[5]) || 0;   // Amount (FIXED: was columns[1])
        
        const category = mapCategory(categoryRaw || 'Other', true);
        const account = mapAccount(accountRaw || 'Capital One', true);
        
        // Convert USD to GBP
        const amountGbp = amount * USD_TO_GBP_RATE;
        
        console.log(`Personal Capital: ${date}, ${description}, $${amount} -> £${amountGbp.toFixed(2)}`); // DEBUG
        
        transactions.push({
          date,
          description: description.substring(0, 255), // Limit description length
          amount_usd: amount,
          amount_gbp: amountGbp, // Keep negative values for expenses
          currency: "USD",
          category,
          account,
          encord: false, // Default to false
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
      // From the image: DATE, AMOUNT, DESCRIPTION CATEGORY, CATEGORY, ACCOUNT, TO ACCOUNT, PROJECT, NOTES
      if (columns.length >= 6) {
        const date = parseDate(columns[0]);
        const amount = parseFloat(columns[1]) || 0;
        const description = columns[2] || 'Unknown Transaction';
        const category = mapCategory(columns[3] || 'Other', false);
        const account = mapAccount(columns[5] || 'HSBC Checkings', false);
        
        console.log(`MoneyHub: ${date}, ${description}, £${amount}`); // DEBUG
        
        transactions.push({
          date,
          description: description.substring(0, 255), // Limit description length
          amount_gbp: amount,
          currency: "GBP",
          category,
          account,
          encord: false, // Default to false
          trip: "", // Default to empty
        });
      }
    } catch (error) {
      console.warn(`Failed to parse MoneyHub line ${i + 1}:`, error);
    }
  }
  
  return transactions;
}