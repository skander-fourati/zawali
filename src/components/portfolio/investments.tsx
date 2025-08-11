// Investment types for portfolio categorization
export const INVESTMENT_TYPES = [
  "Domestic Equity (US)",
  "International Markets",
  "Emerging Markets",
  "Real Estate Equity",
  "Treasuries (Bonds / Tips)",
  "High-Yield Savings",
  "Dividends Growth Equity",
  "Cash",
  "Commodities / Precious Metals",
  "Cryptocurrency",
] as const;

export type InvestmentType = (typeof INVESTMENT_TYPES)[number];

// Investment types to exclude from portfolio breakdown calculations
// (as specified by user: High-Yield Savings and Cash should be excluded)
export const EXCLUDED_FROM_PORTFOLIO_BREAKDOWN = [
  "High-Yield Savings",
  "Cash",
] as const;

// Helper function to check if investment type should be included in portfolio calculations
export const shouldIncludeInPortfolioBreakdown = (
  investmentType: string,
): boolean => {
  return !EXCLUDED_FROM_PORTFOLIO_BREAKDOWN.includes(investmentType as any);
};

// Colors for investment types (for charts and visual consistency)
export const INVESTMENT_TYPE_COLORS: Record<string, string> = {
  "Domestic Equity (US)": "hsl(220, 85%, 65%)", // Rich blue
  "International Markets": "hsl(15, 80%, 65%)", // Coral
  "Emerging Markets": "hsl(200, 75%, 65%)", // Teal blue
  "Real Estate Equity": "hsl(25, 75%, 65%)", // Orange
  "Treasuries (Bonds / Tips)": "hsl(190, 70%, 55%)", // Cyan
  "High-Yield Savings": "hsl(10, 70%, 60%)", // Red
  "Dividends Growth Equity": "hsl(35, 80%, 60%)", // Amber
  Cash: "hsl(160, 60%, 55%)", // Mint
  "Commodities / Precious Metals": "hsl(280, 60%, 65%)", // Magenta
  Cryptocurrency: "hsl(45, 85%, 60%)", // Golden
};
