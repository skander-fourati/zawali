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
console.log("Resolved .env path:", path.resolve("../../.env"));
console.log("VITE_SUPABASE_URL exists:", !!process.env.VITE_SUPABASE_URL);
console.log(
  "VITE_SUPABASE_SERVICE_ROLE_KEY exists:",
  !!process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
); // ✅ Fixed: Check service key, not anon key
console.log(
  "VITE_SUPABASE_ANON_KEY exists:",
  !!process.env.VITE_SUPABASE_ANON_KEY,
); // Added for comparison
if (process.env.VITE_SUPABASE_URL) {
  console.log("VITE_SUPABASE_URL value:", process.env.VITE_SUPABASE_URL);
}

// ================================
// CONFIGURATION - EDIT THESE AS NEEDED
// ================================
const CONFIG = {
  // File settings
  csvFilePath: "/Users/skanderfourati/Downloads/Notion Fam Balances.csv", // Path to your CSV file

  // Database settings
  supabaseUrl: process.env.VITE_SUPABASE_URL!,
  supabaseKey: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!, // ✅ Make sure this is service key
  userId: "fba5f685-527b-4730-93d9-862eae988550", // Your actual user ID

  // Conversion settings
  exchangeRate: 0.79, // USD to GBP

  // Account mapping (CSV name → DB name)
  accountMapping: {
    "BofA Checkings": "BofA Checkings",
    "HSBC Checkings": "HSBC Checkings",
    "Amex Gold": "Amex Gold",
    "Amex UK": "Amex UK",
    "Global Money": "Global Money",
    "Cash Rewards": "Cash Rewards",
    "Capital One": "Capital One",
    "Citi AAdvantage": "Citi AAdvantage",
    "Dodl (LISA)": "Dodl (LISA)",
    Fidelity: "Fidelity",
    "Travel Rewards": "Travel Rewards",
    Vanguard: "Vanguard",
    Wealthfront: "Wealthfront",
  },

  // Family member mapping (CSV name → DB name)
  familyMemberMapping: {
    Myriam: "Myriam",
    Khaled: "Khaled",
  },

  // Script settings
  dryRun: false, // Set to false to actually insert data
  batchSize: 10, // Process in batches
};

// ✅ ADDED: Parse command line arguments to override dryRun
const args = process.argv.slice(2);
const dryRunArg = args.find((arg) => arg.startsWith("--dry-run="));
if (dryRunArg) {
  CONFIG.dryRun = dryRunArg.split("=")[1] === "true";
}

// ================================
// TYPES
// ================================
interface CSVRow {
  Description: string;
  "Family Member": string;
  Account: string;
  "Amount (USD)": string;
  "Transaction Date": string;
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
  family_member_id: string | null;
  user_id: string;
  encord_expensable: boolean;
}

interface DatabaseCache {
  accounts: Map<string, string>;
  familyMembers: Map<string, string>;
  familyTransferCategoryId: string | null;
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
    // Handle "December 24, 2024" format
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
    // Remove dollar sign and fix encoding corruption
    let cleanAmount = amountString
      .replace(/\$/g, "") // Remove dollar sign
      .replace(/Â₀/g, "0") // Fix corrupted zeros
      .replace(/â‚¬/g, "0") // Alternative corruption pattern
      .replace(/Â/g, "") // Remove stray Â characters
      .trim();

    // Detect format based on pattern
    if (cleanAmount.includes(",") && cleanAmount.includes(".")) {
      // Format like "1,234.56" or "1.234,56"
      const lastCommaIndex = cleanAmount.lastIndexOf(",");
      const lastDotIndex = cleanAmount.lastIndexOf(".");

      if (lastDotIndex > lastCommaIndex) {
        // US format: "1,234.56" - comma is thousands separator
        cleanAmount = cleanAmount.replace(/,/g, ""); // Remove commas
      } else {
        // European format: "1.234,56" - comma is decimal separator
        cleanAmount = cleanAmount.replace(/\./g, "").replace(",", "."); // Remove dots, convert comma to dot
      }
    } else if (cleanAmount.includes(",")) {
      // Only comma present
      const parts = cleanAmount.split(",");
      if (parts.length === 2 && parts[1].length <= 2) {
        // European decimal format: "800,00"
        cleanAmount = cleanAmount.replace(",", ".");
      } else {
        // Thousands separator: "1,234" or "1,234,567"
        cleanAmount = cleanAmount.replace(/,/g, "");
      }
    }
    // If only dots or no separators, use as-is

    const amount = parseFloat(cleanAmount);
    if (isNaN(amount)) {
      throw new Error(`Invalid amount: ${amountString} -> ${cleanAmount}`);
    }

    // Log parsing for debugging suspicious amounts
    if (
      Math.abs(amount) < 10 &&
      (amountString.includes("Â") || amountString.includes(","))
    ) {
      console.log(
        `⚠️  Amount parsing: "${amountString}" → "${cleanAmount}" → ${amount}`,
      );
    }

    return amount;
  } catch (error) {
    logger.error(`Failed to parse amount: ${amountString}`, error);
    throw error;
  }
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
    familyMembers: new Map(),
    familyTransferCategoryId: null,
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

    // Fetch family members
    const { data: familyMembers, error: familyMembersError } = await supabase
      .from("family_members")
      .select("id, name")
      .eq("user_id", userId);

    if (familyMembersError) throw familyMembersError;

    familyMembers?.forEach((member: any) => {
      cache.familyMembers.set(member.name, member.id);
    });

    logger.success(`Loaded ${cache.familyMembers.size} family members`);

    // Fetch Family Transfer category
    const { data: categories, error: categoriesError } = await supabase
      .from("categories")
      .select("id, name")
      .eq("user_id", userId)
      .eq("name", "Family Transfer");

    if (categoriesError) throw categoriesError;

    if (categories && categories.length > 0) {
      cache.familyTransferCategoryId = categories[0].id;
      logger.success(
        `Found Family Transfer category: ${cache.familyTransferCategoryId}`,
      );
    } else {
      logger.warning(
        "Family Transfer category not found! Make sure it exists.",
      );
    }

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
  const date = parseDate(row["Transaction Date"]);
  const description = row.Description.trim();
  const amountUSD = parseAmount(row["Amount (USD)"]);
  const familyMemberName = CONFIG.familyMemberMapping[row["Family Member"]];
  const accountName = CONFIG.accountMapping[row.Account];

  if (!familyMemberName) {
    throw new Error(`Unknown family member: ${row["Family Member"]}`);
  }

  if (!accountName) {
    throw new Error(`Unknown account: ${row.Account}`);
  }

  // Get IDs from cache
  const familyMemberId = cache.familyMembers.get(familyMemberName);
  const accountId = cache.accounts.get(accountName);

  if (!familyMemberId) {
    throw new Error(`Family member ID not found for: ${familyMemberName}`);
  }

  if (!accountId) {
    throw new Error(`Account ID not found for: ${accountName}`);
  }

  if (!cache.familyTransferCategoryId) {
    throw new Error("Family Transfer category not found in database");
  }

  // Convert to GBP
  const amountGBP = amountUSD * CONFIG.exchangeRate;

  return {
    date,
    description,
    amount: amountUSD,
    currency: "USD",
    amount_gbp: amountGBP,
    exchange_rate: CONFIG.exchangeRate,
    transaction_type: "transfer",
    category_id: cache.familyTransferCategoryId,
    account_id: accountId,
    family_member_id: familyMemberId,
    user_id: userId,
    encord_expensable: false,
  };
}

// ================================
// MAIN IMPORT FUNCTION
// ================================
async function importHistoricFamilyBalances() {
  logger.info("🚀 Starting Historic Family Balance Import Script");
  logger.info("Configuration:", {
    csvFilePath: CONFIG.csvFilePath,
    dryRun: CONFIG.dryRun,
    exchangeRate: CONFIG.exchangeRate,
    batchSize: CONFIG.batchSize,
  });

  // ✅ ADDED: Show if dry run was overridden
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

    // ✅ FIXED: Declare userId early, before any usage
    const userId = CONFIG.userId;
    if (!userId || userId === "YOUR_USER_ID_HERE") {
      throw new Error("Please update CONFIG.userId with your actual user ID");
    }
    logger.success(`Using user ID: ${userId}`);

    // Initialize Supabase
    const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);

    // DEBUG: Test database connection
    console.log("🔍 Testing database connection...");
    try {
      // Test basic connection
      const { data: testData, error: testError } = await supabase
        .from("accounts")
        .select("count", { count: "exact" });

      console.log("Total accounts in database:", testData);

      // Check if this user exists at all
      const { data: userData, error: userError } = await supabase
        .from("accounts")
        .select("user_id")
        .limit(5);

      console.log(
        "Sample user IDs in accounts table:",
        userData?.map((u) => u.user_id),
      );
      console.log("Looking for user ID:", userId); // ✅ Now userId is properly declared

      // ✅ ADDED: Test specific user query
      const { data: userAccounts, error: userAccountsError } = await supabase
        .from("accounts")
        .select("id, name, user_id")
        .eq("user_id", userId);

      console.log(`Accounts for user ${userId}:`, userAccounts);

      if (userAccountsError) {
        console.log("Error querying user accounts:", userAccountsError);
      }
    } catch (error) {
      console.log("Database connection test failed:", error);
    }

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

    // Validate that we have all required data
    if (cache.accounts.size === 0) {
      throw new Error(
        "No accounts found in database. Make sure you have accounts set up.",
      );
    }
    if (cache.familyMembers.size === 0) {
      throw new Error(
        "No family members found in database. Make sure you have family members set up.",
      );
    }
    if (!cache.familyTransferCategoryId) {
      throw new Error(
        "Family Transfer category not found in database. Make sure this category exists.",
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

    // Preview first few transactions
    if (processedTransactions.length > 0) {
      logger.info("📋 Preview of processed transactions:");

      // Show first 5 and last 5 transactions for validation
      const previewCount = Math.min(5, processedTransactions.length);

      logger.info("🔹 First transactions:");
      processedTransactions.slice(0, previewCount).forEach((tx, i) => {
        logger.info(`Transaction ${i + 1}:`, {
          date: tx.date,
          description:
            tx.description.substring(0, 50) +
            (tx.description.length > 50 ? "..." : ""),
          amount_usd: tx.amount,
          amount_gbp: tx.amount_gbp,
          family_member: Object.entries(CONFIG.familyMemberMapping).find(
            ([k, v]) => cache.familyMembers.get(v) === tx.family_member_id,
          )?.[0],
          account: Object.entries(CONFIG.accountMapping).find(
            ([k, v]) => cache.accounts.get(v) === tx.account_id,
          )?.[0],
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
            amount_usd: tx.amount,
            amount_gbp: tx.amount_gbp,
            family_member: Object.entries(CONFIG.familyMemberMapping).find(
              ([k, v]) => cache.familyMembers.get(v) === tx.family_member_id,
            )?.[0],
            account: Object.entries(CONFIG.accountMapping).find(
              ([k, v]) => cache.accounts.get(v) === tx.account_id,
            )?.[0],
          });
        });
      }

      // ✅ ADDED: Transaction validation summary
      logger.info("📊 Transaction Parsing Validation:");

      // Amount statistics
      const amounts = processedTransactions.map((tx) => tx.amount);
      const minAmount = Math.min(...amounts);
      const maxAmount = Math.max(...amounts);
      const totalAmount = amounts.reduce((sum, amt) => sum + amt, 0);

      logger.info("💰 Amount Statistics:", {
        min_usd: minAmount,
        max_usd: maxAmount,
        total_usd: totalAmount,
        average_usd: Math.round((totalAmount / amounts.length) * 100) / 100,
      });

      // Date range
      const dates = processedTransactions.map((tx) => tx.date).sort();
      logger.info("📅 Date Range:", {
        earliest: dates[0],
        latest: dates[dates.length - 1],
        unique_dates: [...new Set(dates)].length,
      });

      // Family member breakdown
      const familyMemberCounts = {};
      processedTransactions.forEach((tx) => {
        const memberName =
          Object.entries(CONFIG.familyMemberMapping).find(
            ([k, v]) => cache.familyMembers.get(v) === tx.family_member_id,
          )?.[0] || "Unknown";
        familyMemberCounts[memberName] =
          (familyMemberCounts[memberName] || 0) + 1;
      });
      logger.info("👥 Family Member Breakdown:", familyMemberCounts);

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

      // ✅ ADDED: Show any suspicious transactions
      const suspiciousTransactions = processedTransactions.filter(
        (tx) =>
          tx.amount > 10000 ||
          tx.amount < 0.01 ||
          isNaN(tx.amount) ||
          isNaN(tx.amount_gbp),
      );

      if (suspiciousTransactions.length > 0) {
        logger.warning("⚠️  Suspicious Transactions Found:");
        suspiciousTransactions.forEach((tx, i) => {
          logger.warning(`Suspicious ${i + 1}:`, {
            description: tx.description,
            amount_usd: tx.amount,
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
      logger.info("Set CONFIG.dryRun = false to actually insert the data");
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
        `🎉 Successfully imported ${insertedCount} historic family balance transactions!`,
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
  importHistoricFamilyBalances()
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
