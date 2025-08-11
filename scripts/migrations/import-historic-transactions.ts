import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import Papa from "papaparse";
import dotenv from "dotenv";

// Load environment variables from parent directory
dotenv.config({ path: "/Users/skanderfourati/Desktop/zawali/.env" });

// DEBUG: Add this section right after dotenv.config
console.log("🔍 Debug Environment Loading:");
console.log("Current working directory:", process.cwd());
console.log("Script file location: ", __dirname);
console.log("VITE_SUPABASE_URL exists:", !!process.env.VITE_SUPABASE_URL);
console.log(
  "VITE_SUPABASE_SERVICE_ROLE_KEY exists:",
  !!process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
);
if (process.env.VITE_SUPABASE_URL) {
  console.log("VITE_SUPABASE_URL value:", process.env.VITE_SUPABASE_URL);
}

// ================================
// CONFIGURATION - EDIT THESE AS NEEDED
// ================================
const CONFIG = {
  // File settings
  csvFilePath: "/Users/skanderfourati/Downloads/Budget All Transactions.csv", // Update this path

  // Database settings
  supabaseUrl: process.env.VITE_SUPABASE_URL!,
  supabaseKey: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!,
  userId: "fba5f685-527b-4730-93d9-862eae988550", // Your actual user ID

  // Conversion settings
  exchangeRate: 0.79, // USD/EUR to GBP

  // Account mapping (CSV name → DB name)
  accountMapping: {
    "HSBC Checkings": "HSBC Checkings",
    HSBC: "HSBC Checkings",
    "Amex UK": "Amex UK",
    "Amex Gold": "Amex Gold",
    "BofA Checkings": "BofA Checkings",
    "Capital One": "Capital One",
    "Cash Rewards": "Cash Rewards",
    "Citi AAdvantage": "Citi AAdvantage",
    "Dodl (LISA)": "Dodl (LISA)",
    Fidelity: "Fidelity",
    "Global Money": "Global Money",
    "Travel Rewards": "Travel Rewards",
    Vanguard: "Vanguard",
    Wealthfront: "Wealthfront",
    "": "HSBC Checkings",
  },

  // Category mapping (CSV name → DB name)
  categoryMapping: {
    Income: "Income",
    Bills: "Bills",
    Groceries: "Groceries",
    Commute: "Commute",
    Restaurants: "Dining",
    Extras: "Extras",
    "Personal Care": "Personal Care",
    Investment: "Investment",
    Transfers: "Transfers",
    "Service Charges/Fees": "Service Charges/Fees",
    "Other / Unknown": "Other / Unknown",
    "": "Other / Unknown",
  },

  // Trip mapping (CSV subcategory → DB trip name)
  tripMapping: {
    "Mallorca August 2025": "Mallorca August 2025",
    "Prague Jan 2025": "Prague Jan 2025",
    "Tunis Dec 2024": "Tunis Dec 2024",
    "Paris Nov 2024": "Paris Nov 2024",
    "NY & SF March 2025": "NY & SF March 2025",
    "Wales April 2025": "Wales April 2025",
    "Boston & NY Apr 2025": "Boston & NY Apr 2025",
    "Tunis May 2025": "Tunis May 2025",
    "Paris July 2025": "Paris July 2025",
    "Tunis July 2025": "Tunis July 2025",
  },

  // Script settings
  dryRun: true, // Set to false to actually insert data
  batchSize: 20, // Process in batches
};

// ✅ Parse command line arguments to override dryRun
const args = process.argv.slice(2);
const dryRunArg = args.find((arg) => arg.startsWith("--dry-run="));
if (dryRunArg) {
  CONFIG.dryRun = dryRunArg.split("=")[1] === "true";
}

// ================================
// TYPES
// ================================
interface CSVRow {
  Date: string;
  Account: string;
  Name: string; // This is the description
  Category: string;
  "Pre-conversion Amount": string;
  "Amount (GBP)": string; // We'll ignore this
  "Subcategory (if any)": string; // Trip name
  Currency: string;
  "Exchange Rate": string; // We'll ignore this
  Encord: string; // TRUE/FALSE for encord_expensable
  Receipt: string; // We'll ignore this
}

interface ProcessedTransaction {
  date: string;
  description: string;
  amount: number;
  currency: string;
  amount_gbp: number;
  exchange_rate: number;
  transaction_type: string;
  category_id: string | null;
  account_id: string | null;
  trip_id: string | null;
  user_id: string;
  encord_expensable: boolean;
  family_member_id: null; // Always null for regular transactions
  notes: string | null;
}

interface DatabaseCache {
  accounts: Map<string, string>;
  categories: Map<string, string>;
  trips: Map<string, string>;
}

// ================================
// UTILITY FUNCTIONS
// ================================
const logger = {
  info: (message: string, data?: any) => {
    console.log(`ℹ️  ${message}`, data ? JSON.stringify(data, null, 2) : "");
  },
  success: (message: string, data?: any) => {
    console.log(`✅ ${message}`, data ? JSON.stringify(data, null, 2) : "");
  },
  warning: (message: string, data?: any) => {
    console.log(`⚠️  ${message}`, data ? JSON.stringify(data, null, 2) : "");
  },
  error: (message: string, error?: any) => {
    console.log(`❌ ${message}`, error ? JSON.stringify(error, null, 2) : "");
  },
};

function parseDate(dateString: string): string {
  try {
    // Handle DD-MMM-YY format like "30-Jun-25"
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date: ${dateString}`);
    }
    return date.toISOString().split("T")[0]; // Return YYYY-MM-DD
  } catch (error) {
    logger.error(`Failed to parse date: ${dateString}`, error);
    throw error;
  }
}

function parseAmount(amountString: string): number {
  try {
    // Clean the amount string - remove currency symbols and handle negative amounts
    let cleanAmount = amountString.trim();

    // Handle negative amounts
    const isNegative =
      cleanAmount.startsWith("-") || cleanAmount.startsWith("−");
    if (isNegative) {
      cleanAmount = cleanAmount.substring(1);
    }

    // Remove common currency symbols and clean up
    cleanAmount = cleanAmount
      .replace(/[£$€]/g, "")
      .replace(/[,\s]/g, "") // Remove commas and spaces
      .trim();

    const amount = parseFloat(cleanAmount);
    if (isNaN(amount)) {
      throw new Error(`Invalid amount: ${amountString} -> ${cleanAmount}`);
    }

    return isNegative ? -amount : amount;
  } catch (error) {
    logger.error(`Failed to parse amount: ${amountString}`, error);
    throw error;
  }
}

function parseBoolean(boolString: string): boolean {
  const cleaned = boolString.trim().toLowerCase();
  return cleaned === "true" || cleaned === "yes" || cleaned === "1";
}

// ================================
// DATABASE FUNCTIONS
// ================================
async function initializeDatabaseCache(
  supabase: any,
  userId: string,
): Promise<DatabaseCache> {
  logger.info("Initializing database cache...");

  const cache: DatabaseCache = {
    accounts: new Map(),
    categories: new Map(),
    trips: new Map(),
  };

  try {
    // Fetch accounts
    const { data: accounts, error: accountsError } = await supabase
      .from("accounts")
      .select("id, name")
      .eq("user_id", userId);

    if (accountsError) throw accountsError;

    accounts?.forEach((account: any) => {
      cache.accounts.set(account.name, account.id);
    });

    logger.success(`Loaded ${cache.accounts.size} accounts`);

    // Fetch categories
    const { data: categories, error: categoriesError } = await supabase
      .from("categories")
      .select("id, name")
      .eq("user_id", userId);

    if (categoriesError) throw categoriesError;

    categories?.forEach((category: any) => {
      cache.categories.set(category.name, category.id);
    });

    logger.success(`Loaded ${cache.categories.size} categories`);

    // Fetch trips
    const { data: trips, error: tripsError } = await supabase
      .from("trips")
      .select("id, name")
      .eq("user_id", userId);

    if (tripsError) throw tripsError;

    trips?.forEach((trip: any) => {
      cache.trips.set(trip.name, trip.id);
    });

    logger.success(`Loaded ${cache.trips.size} trips`);

    return cache;
  } catch (error) {
    logger.error("Failed to initialize database cache", error);
    throw error;
  }
}

function processTransaction(
  row: CSVRow,
  cache: DatabaseCache,
  userId: string,
): ProcessedTransaction {
  // Parse and validate data
  const date = parseDate(row.Date);
  const description = row.Name.trim();
  const originalAmount = parseAmount(row["Pre-conversion Amount"]);
  const currency = row.Currency.trim().toUpperCase();
  const encordExpensable = parseBoolean(row.Encord);

  // Get mapped names
  const accountName = CONFIG.accountMapping[row.Account];
  const categoryName = CONFIG.categoryMapping[row.Category];
  const tripName = row["Subcategory (if any)"]
    ? CONFIG.tripMapping[row["Subcategory (if any)"]]
    : null;

  if (!accountName) {
    throw new Error(`Unknown account: ${row.Account}`);
  }

  if (!categoryName) {
    throw new Error(`Unknown category: ${row.Category}`);
  }

  // Get IDs from cache
  const accountId = cache.accounts.get(accountName);
  const categoryId = cache.categories.get(categoryName);
  const tripId = tripName ? cache.trips.get(tripName) : null;

  if (!accountId) {
    throw new Error(`Account ID not found for: ${accountName}`);
  }

  if (!categoryId) {
    throw new Error(`Category ID not found for: ${categoryName}`);
  }

  if (tripName && !tripId) {
    throw new Error(`Trip ID not found for: ${tripName}`);
  }

  // Convert to GBP using fixed rate
  const amountGBP =
    Math.round(originalAmount * CONFIG.exchangeRate * 100) / 100;

  // Determine transaction type
  const transactionType = originalAmount >= 0 ? "income" : "expense";

  return {
    date,
    description,
    amount: originalAmount,
    currency,
    amount_gbp: amountGBP,
    exchange_rate: CONFIG.exchangeRate,
    transaction_type: transactionType,
    category_id: categoryId,
    account_id: accountId,
    trip_id: tripId!,
    user_id: userId,
    encord_expensable: encordExpensable,
    family_member_id: null,
    notes: null,
  };
}

// ================================
// MAIN IMPORT FUNCTION
// ================================
async function importHistoricTransactions() {
  logger.info("🚀 Starting Historic Transactions Import Script");
  logger.info("Configuration:", {
    csvFilePath: CONFIG.csvFilePath,
    dryRun: CONFIG.dryRun,
    exchangeRate: CONFIG.exchangeRate,
    batchSize: CONFIG.batchSize,
  });

  // Show if dry run was overridden
  if (process.argv.includes("--dry-run=false")) {
    logger.warning(
      "🔥 DRY RUN DISABLED via command line - Data WILL be inserted!",
    );
  }

  try {
    // Initial validation checks
    logger.info("🔧 Running initial validation checks...");

    // Check environment variables
    if (!CONFIG.supabaseUrl) {
      throw new Error(
        "VITE_SUPABASE_URL environment variable is missing. Check your .env file.",
      );
    }
    if (!CONFIG.supabaseKey) {
      throw new Error(
        "VITE_SUPABASE_SERVICE_ROLE_KEY environment variable is missing. Check your .env file.",
      );
    }
    logger.success("Environment variables found");

    // Declare userId early
    const userId = CONFIG.userId;
    if (!userId || userId === "YOUR_USER_ID_HERE") {
      throw new Error("Please update CONFIG.userId with your actual user ID");
    }
    logger.success(`Using user ID: ${userId}`);

    // Initialize Supabase
    const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);

    // Check if CSV file exists
    if (!fs.existsSync(CONFIG.csvFilePath)) {
      throw new Error(`CSV file not found: ${CONFIG.csvFilePath}`);
    }
    logger.success("CSV file found");

    // Read and parse CSV
    logger.info("📖 Reading CSV file...");
    const csvContent = fs.readFileSync(CONFIG.csvFilePath, "utf8");

    const parseResult = Papa.parse<CSVRow>(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });

    if (parseResult.errors.length > 0) {
      logger.error("CSV parsing errors:", parseResult.errors);
      throw new Error("Failed to parse CSV file");
    }

    const rows = parseResult.data;
    logger.success(`Loaded ${rows.length} rows from CSV`);

    // Log first few rows for debugging
    if (rows.length > 0) {
      logger.info("First few CSV rows:", rows.slice(0, 2));
    }

    // Initialize database cache
    const cache = await initializeDatabaseCache(supabase, userId);

    // Validate that we have required data
    if (cache.accounts.size === 0) {
      throw new Error(
        "No accounts found in database. Make sure you have accounts set up.",
      );
    }
    if (cache.categories.size === 0) {
      throw new Error(
        "No categories found in database. Make sure you have categories set up.",
      );
    }

    // Process transactions
    logger.info("🔄 Processing transactions...");
    const processedTransactions: ProcessedTransaction[] = [];
    const errors: Array<{ row: number; error: string; data: CSVRow }> = [];

    rows.forEach((row, index) => {
      try {
        const processed = processTransaction(row, cache, userId);
        processedTransactions.push(processed);
      } catch (error) {
        errors.push({
          row: index + 1,
          error: error instanceof Error ? error.message : String(error),
          data: row,
        });
      }
    });

    // Report processing results
    logger.success(
      `✅ Successfully processed: ${processedTransactions.length} transactions`,
    );

    if (errors.length > 0) {
      logger.error(`❌ Failed to process: ${errors.length} transactions`);
      errors.forEach(({ row, error, data }) => {
        logger.error(`Row ${row}: ${error}`, data);
      });
    }

    // Enhanced validation and preview
    if (processedTransactions.length > 0) {
      logger.info("📋 Preview of processed transactions:");

      // Show first 5 and last 5 transactions
      const previewCount = Math.min(5, processedTransactions.length);

      logger.info("🔹 First transactions:");
      processedTransactions.slice(0, previewCount).forEach((tx, i) => {
        logger.info(`Transaction ${i + 1}:`, {
          date: tx.date,
          description:
            tx.description.substring(0, 50) +
            (tx.description.length > 50 ? "..." : ""),
          amount: tx.amount,
          currency: tx.currency,
          amount_gbp: tx.amount_gbp,
          transaction_type: tx.transaction_type,
          encord_expensable: tx.encord_expensable,
          category: Object.entries(CONFIG.categoryMapping).find(
            ([k, v]) => cache.categories.get(v) === tx.category_id,
          )?.[0],
          account: Object.entries(CONFIG.accountMapping).find(
            ([k, v]) => cache.accounts.get(v) === tx.account_id,
          )?.[0],
          trip: tx.trip_id
            ? Object.entries(CONFIG.tripMapping).find(
                ([k, v]) => cache.trips.get(v) === tx.trip_id,
              )?.[0]
            : null,
        });
      });

      if (processedTransactions.length > 10) {
        logger.info("🔹 Last transactions:");
        processedTransactions.slice(-previewCount).forEach((tx, i) => {
          const actualIndex =
            processedTransactions.length - previewCount + i + 1;
          logger.info(`Transaction ${actualIndex}:`, {
            date: tx.date,
            description:
              tx.description.substring(0, 50) +
              (tx.description.length > 50 ? "..." : ""),
            amount: tx.amount,
            currency: tx.currency,
            amount_gbp: tx.amount_gbp,
            transaction_type: tx.transaction_type,
            encord_expensable: tx.encord_expensable,
            category: Object.entries(CONFIG.categoryMapping).find(
              ([k, v]) => cache.categories.get(v) === tx.category_id,
            )?.[0],
            account: Object.entries(CONFIG.accountMapping).find(
              ([k, v]) => cache.accounts.get(v) === tx.account_id,
            )?.[0],
            trip: tx.trip_id
              ? Object.entries(CONFIG.tripMapping).find(
                  ([k, v]) => cache.trips.get(v) === tx.trip_id,
                )?.[0]
              : null,
          });
        });
      }

      // Transaction validation summary
      logger.info("📊 Transaction Parsing Validation:");

      // Amount statistics
      const amounts = processedTransactions.map((tx) => tx.amount);
      const minAmount = Math.min(...amounts);
      const maxAmount = Math.max(...amounts);
      const totalAmount = amounts.reduce((sum, amt) => sum + amt, 0);

      logger.info("💰 Amount Statistics:", {
        min: minAmount,
        max: maxAmount,
        total: totalAmount,
        average: Math.round((totalAmount / amounts.length) * 100) / 100,
      });

      // Date range
      const dates = processedTransactions.map((tx) => tx.date).sort();
      logger.info("📅 Date Range:", {
        earliest: dates[0],
        latest: dates[dates.length - 1],
        unique_dates: [...new Set(dates)].length,
      });

      // Category breakdown
      const categoryCounts = {};
      processedTransactions.forEach((tx) => {
        const categoryName =
          Object.entries(CONFIG.categoryMapping).find(
            ([k, v]) => cache.categories.get(v) === tx.category_id,
          )?.[0] || "Unknown";
        categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
      });
      logger.info("📂 Category Breakdown:", categoryCounts);

      // Account breakdown
      const accountCounts = {};
      processedTransactions.forEach((tx) => {
        const accountName =
          Object.entries(CONFIG.accountMapping).find(
            ([k, v]) => cache.accounts.get(v) === tx.account_id,
          )?.[0] || "Unknown";
        accountCounts[accountName] = (accountCounts[accountName] || 0) + 1;
      });
      logger.info("🏦 Account Breakdown:", accountCounts);

      // Trip breakdown
      const tripCounts = {};
      processedTransactions.forEach((tx) => {
        if (tx.trip_id) {
          const tripName =
            Object.entries(CONFIG.tripMapping).find(
              ([k, v]) => cache.trips.get(v) === tx.trip_id,
            )?.[0] || "Unknown";
          tripCounts[tripName] = (tripCounts[tripName] || 0) + 1;
        }
      });
      const tripTransactionCount = Object.values(tripCounts).reduce(
        (sum: number, count) => sum + (count as number),
        0,
      );
      logger.info("✈️ Trip Breakdown:", tripCounts);
      logger.info(
        `📈 Trip Statistics: ${tripTransactionCount}/${processedTransactions.length} transactions have trips assigned`,
      );

      // Currency and Encord breakdown
      const currencyCounts = {};
      let encordCount = 0;
      processedTransactions.forEach((tx) => {
        currencyCounts[tx.currency] = (currencyCounts[tx.currency] || 0) + 1;
        if (tx.encord_expensable) encordCount++;
      });
      logger.info("💱 Currency Breakdown:", currencyCounts);
      logger.info(
        "🏢 Encord Expensable:",
        `${encordCount}/${processedTransactions.length} transactions`,
      );

      // Check for suspicious transactions
      const suspiciousTransactions = processedTransactions.filter(
        (tx) =>
          Math.abs(tx.amount) > 5000 ||
          isNaN(tx.amount) ||
          isNaN(tx.amount_gbp),
      );

      if (suspiciousTransactions.length > 0) {
        logger.warning("⚠️ Suspicious Transactions Found:");
        suspiciousTransactions.forEach((tx, i) => {
          logger.warning(`Suspicious ${i + 1}:`, {
            description: tx.description,
            amount: tx.amount,
            currency: tx.currency,
            amount_gbp: tx.amount_gbp,
            date: tx.date,
          });
        });
      } else {
        logger.success("✅ All transaction amounts look reasonable");
      }
    }

    // Insert transactions (if not dry run)
    if (CONFIG.dryRun) {
      logger.warning("🔍 DRY RUN MODE - No data will be inserted");
      logger.info(
        "Set CONFIG.dryRun = false or use npm run script:prod to actually insert the data",
      );
    } else {
      logger.info("💾 Inserting transactions into database...");

      // Insert in batches
      let insertedCount = 0;
      for (let i = 0; i < processedTransactions.length; i += CONFIG.batchSize) {
        const batch = processedTransactions.slice(i, i + CONFIG.batchSize);

        try {
          const { error } = await supabase.from("transactions").insert(batch);

          if (error) throw error;

          insertedCount += batch.length;
          logger.info(
            `Inserted batch ${Math.ceil((i + 1) / CONFIG.batchSize)} (${insertedCount}/${processedTransactions.length})`,
          );
        } catch (error) {
          logger.error(`Failed to insert batch starting at index ${i}:`, error);
          throw error;
        }
      }

      logger.success(
        `🎉 Successfully imported ${insertedCount} historic transactions!`,
      );
    }

    // Summary
    logger.info("📊 Import Summary:", {
      totalRows: rows.length,
      successfullyProcessed: processedTransactions.length,
      errors: errors.length,
      inserted: CONFIG.dryRun ? 0 : processedTransactions.length,
      dryRun: CONFIG.dryRun,
    });
  } catch (error) {
    logger.error("💥 Import failed:");
    if (error instanceof Error) {
      logger.error("Error message:", error.message);
      logger.error("Error stack:", error.stack);
    } else {
      logger.error("Unknown error:", error);
    }
    console.error("Raw error object:", error);
    process.exit(1);
  }
}

// ================================
// RUN SCRIPT
// ================================
if (require.main === module) {
  importHistoricTransactions()
    .then(() => {
      logger.success("✨ Script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      logger.error("💥 Script failed:");
      if (error instanceof Error) {
        logger.error("Error message:", error.message);
        logger.error("Error stack:", error.stack);
      } else {
        logger.error("Unknown error:", error);
      }
      console.error("Raw error object:", error);
      process.exit(1);
    });
}
