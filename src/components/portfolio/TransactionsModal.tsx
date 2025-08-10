import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  X,
  Edit3,
  Trash,
} from "lucide-react";

interface TransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  investmentTransactions: any[];
  categories: any[];
  accounts: any[];
  trips: any[];
  familyMembers: any[];
  onAddTransaction: () => void;
  onEditTransaction: (transaction: any) => void;
  onDeleteTransaction: (transaction: any) => void;
  onBulkEdit: (selectedIds: string[]) => void;
  onBulkDelete: (selectedIds: string[]) => void;
}

export function TransactionsModal({
  isOpen,
  onClose,
  investmentTransactions,
  categories,
  accounts,
  trips,
  familyMembers,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onBulkEdit,
  onBulkDelete,
}: TransactionsModalProps) {
  // Transaction tab states
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [accountFilter, setAccountFilter] = useState("all");
  const [tripFilter, setTripFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<
    Set<string>
  >(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number>(-1);

  // Keyboard state tracking
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);

  const ITEMS_PER_PAGE = 50;

  // Track keyboard state for bulk selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setIsShiftPressed(e.shiftKey);
      setIsCtrlPressed(e.ctrlKey || e.metaKey);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setIsShiftPressed(e.shiftKey);
      setIsCtrlPressed(e.ctrlKey || e.metaKey);
    };

    const handleWindowBlur = () => {
      setIsShiftPressed(false);
      setIsCtrlPressed(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, []);

  // Transaction filtering and sorting logic
  const filteredAndSortedInvestmentTransactions = useMemo(() => {
    let filtered = [...investmentTransactions];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((t: any) =>
        t.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Category filter
    if (categoryFilter && categoryFilter !== "all") {
      filtered = filtered.filter((t: any) => t.category_id === categoryFilter);
    }

    // Account filter
    if (accountFilter && accountFilter !== "all") {
      filtered = filtered.filter((t: any) => t.account_id === accountFilter);
    }

    // Trip filter
    if (tripFilter && tripFilter !== "all") {
      filtered = filtered.filter((t: any) => t.trip_id === tripFilter);
    }

    // Sort
    filtered.sort((a: any, b: any) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case "date":
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case "description":
          aValue = a.description?.toLowerCase() || "";
          bValue = b.description?.toLowerCase() || "";
          break;
        case "amount_gbp":
          aValue = a.amount_gbp || 0;
          bValue = b.amount_gbp || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [
    investmentTransactions,
    searchQuery,
    categoryFilter,
    accountFilter,
    tripFilter,
    sortField,
    sortDirection,
  ]);

  const paginatedInvestmentTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedInvestmentTransactions.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE,
    );
  }, [filteredAndSortedInvestmentTransactions, currentPage]);

  // Transaction management functions
  const handleTransactionSelect = useCallback(
    (transactionId: string, index: number) => {
      setSelectedTransactionIds((prev) => {
        const newSet = new Set(prev);

        if (isShiftPressed && lastSelectedIndex !== -1) {
          const startIndex = Math.min(lastSelectedIndex, index);
          const endIndex = Math.max(lastSelectedIndex, index);

          for (let i = startIndex; i <= endIndex; i++) {
            if (paginatedInvestmentTransactions[i]) {
              newSet.add(paginatedInvestmentTransactions[i].id);
            }
          }
        } else if (isCtrlPressed) {
          if (newSet.has(transactionId)) {
            newSet.delete(transactionId);
          } else {
            newSet.add(transactionId);
          }
        } else {
          if (newSet.has(transactionId)) {
            newSet.delete(transactionId);
          } else {
            newSet.add(transactionId);
          }
        }

        return newSet;
      });

      setLastSelectedIndex(index);
    },
    [
      lastSelectedIndex,
      paginatedInvestmentTransactions,
      isShiftPressed,
      isCtrlPressed,
    ],
  );

  const handleSelectAllPage = (checked: boolean) => {
    setSelectedTransactionIds((prev) => {
      const newSet = new Set(prev);

      paginatedInvestmentTransactions.forEach((transaction) => {
        if (checked) {
          newSet.add(transaction.id);
        } else {
          newSet.delete(transaction.id);
        }
      });

      return newSet;
    });

    setLastSelectedIndex(-1);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setAccountFilter("all");
    setTripFilter("all");
  };

  const clearAllSelections = () => {
    setSelectedTransactionIds(new Set());
    setLastSelectedIndex(-1);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Helper functions for display
  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "Uncategorized";
    const category = categories.find((c: any) => c.id === categoryId);
    return category?.name || "Unknown";
  };

  const getCategoryColor = (categoryId: string | null) => {
    if (!categoryId) return "#6b7280";
    const category = categories.find((c: any) => c.id === categoryId);
    return category?.color || "#6b7280";
  };

  const getAccountName = (accountId: string | null) => {
    if (!accountId) return "Unknown Account";
    const account = accounts.find((a: any) => a.id === accountId);
    return account?.name || "Unknown Account";
  };

  const getTripName = (tripId: string | null) => {
    if (!tripId) return null;
    const trip = trips.find((t: any) => t.id === tripId);
    return trip?.name || null;
  };

  const getFamilyMemberName = (familyMemberId: string | null) => {
    if (!familyMemberId) return null;
    const member = familyMembers.find((m: any) => m.id === familyMemberId);
    return member?.name || null;
  };

  const totalPages = Math.ceil(
    filteredAndSortedInvestmentTransactions.length / ITEMS_PER_PAGE,
  );

  const allPageSelected =
    paginatedInvestmentTransactions.length > 0 &&
    paginatedInvestmentTransactions.every((t) =>
      selectedTransactionIds.has(t.id),
    );

  const somePageSelected =
    paginatedInvestmentTransactions.some((t) =>
      selectedTransactionIds.has(t.id),
    ) && !allPageSelected;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle>Investment Transactions</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Showing {filteredAndSortedInvestmentTransactions.length} of{" "}
                {investmentTransactions.length} investment transactions
                {selectedTransactionIds.size > 0 && (
                  <span className="text-primary ml-2">
                    • {selectedTransactionIds.size} selected
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {selectedTransactionIds.size > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onBulkEdit(Array.from(selectedTransactionIds))
                    }
                    className="flex items-center gap-2"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit ({selectedTransactionIds.size})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onBulkDelete(Array.from(selectedTransactionIds))
                    }
                    className="flex items-center gap-2 text-destructive hover:text-destructive"
                  >
                    <Trash className="h-4 w-4" />
                    Delete ({selectedTransactionIds.size})
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllSelections}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Clear
                  </Button>
                </>
              )}
              <Button
                onClick={onAddTransaction}
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Transaction
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex items-center gap-3 mb-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {(categoryFilter !== "all" ||
                accountFilter !== "all" ||
                tripFilter !== "all") && (
                <Badge
                  variant="secondary"
                  className="ml-1 px-1.5 py-0.5 text-xs"
                >
                  {
                    [
                      categoryFilter !== "all",
                      accountFilter !== "all",
                      tripFilter !== "all",
                    ].filter(Boolean).length
                  }
                </Badge>
              )}
            </Button>
          </div>

          {showFilters && (
            <Card className="p-3">
              <CardContent className="p-0">
                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3 mb-3">
                  <Select
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category: any) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={accountFilter}
                    onValueChange={setAccountFilter}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All Accounts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Accounts</SelectItem>
                      {accounts.map((account: any) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={tripFilter} onValueChange={setTripFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All Trips" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Trips</SelectItem>
                      {trips.map((trip: any) => (
                        <SelectItem key={trip.id} value={trip.id}>
                          {trip.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="flex items-center gap-2 h-9"
                  >
                    <X className="h-4 w-4" />
                    Clear
                  </Button>
                </div>

                {/* Active filters indicators */}
                {(categoryFilter !== "all" ||
                  accountFilter !== "all" ||
                  tripFilter !== "all") && (
                  <div className="flex flex-wrap gap-1 pt-2 border-t">
                    {categoryFilter !== "all" && (
                      <Badge variant="outline" className="text-xs h-5 px-2">
                        Category: {getCategoryName(categoryFilter)}
                      </Badge>
                    )}
                    {accountFilter !== "all" && (
                      <Badge variant="outline" className="text-xs h-5 px-2">
                        Account: {getAccountName(accountFilter)}
                      </Badge>
                    )}
                    {tripFilter !== "all" && (
                      <Badge variant="outline" className="text-xs h-5 px-2">
                        Trip: {getTripName(tripFilter)}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Keyboard shortcuts info */}
          {selectedTransactionIds.size > 0 && (
            <div className="mb-3 p-2 bg-muted/50 border border-border rounded-md">
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Tips:</span>
                <span className="ml-2">
                  Hold{" "}
                  <kbd className="px-1 py-0.5 bg-background rounded text-xs border">
                    Shift
                  </kbd>{" "}
                  + click for ranges
                </span>
                <span className="ml-3">
                  Hold{" "}
                  <kbd className="px-1 py-0.5 bg-background rounded text-xs border">
                    Ctrl
                  </kbd>{" "}
                  + click for individual selection
                </span>
                {(isShiftPressed || isCtrlPressed) && (
                  <span className="ml-3 text-primary font-medium">
                    {isShiftPressed && "Shift"}{" "}
                    {isShiftPressed && isCtrlPressed && "+"}{" "}
                    {isCtrlPressed && "Ctrl"} active
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Transaction Table */}
          {paginatedInvestmentTransactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📊</div>
              <p className="text-lg font-medium">
                No investment transactions found
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {investmentTransactions.length === 0
                  ? 'Transactions with "Investment" category will appear here.'
                  : "Try adjusting your search or filters."}
              </p>
            </div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border sticky top-0 z-10">
                    <tr>
                      <th className="text-left p-3 font-medium">
                        <Checkbox
                          checked={allPageSelected}
                          indeterminate={somePageSelected && !allPageSelected}
                          onCheckedChange={handleSelectAllPage}
                        />
                      </th>
                      <th
                        className="text-left p-3 font-medium cursor-pointer hover:bg-muted/70 transition-colors"
                        onClick={() => handleSort("date")}
                      >
                        Date{" "}
                        {sortField === "date" &&
                          (sortDirection === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        className="text-left p-3 font-medium cursor-pointer hover:bg-muted/70 transition-colors"
                        onClick={() => handleSort("description")}
                      >
                        Description{" "}
                        {sortField === "description" &&
                          (sortDirection === "asc" ? "↑" : "↓")}
                      </th>
                      <th className="text-left p-3 font-medium">Category</th>
                      <th className="text-left p-3 font-medium">Account</th>
                      <th className="text-left p-3 font-medium">Trip</th>
                      <th className="text-left p-3 font-medium">Family</th>
                      <th className="text-left p-3 font-medium">Encord</th>
                      <th
                        className="text-right p-3 font-medium cursor-pointer hover:bg-muted/70 transition-colors"
                        onClick={() => handleSort("amount_gbp")}
                      >
                        Amount (GBP){" "}
                        {sortField === "amount_gbp" &&
                          (sortDirection === "asc" ? "↑" : "↓")}
                      </th>
                      <th className="text-center p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedInvestmentTransactions.map(
                      (transaction: any, index: number) => (
                        <tr
                          key={transaction.id}
                          className={`border-b border-border hover:bg-muted/30 cursor-pointer transition-colors ${
                            selectedTransactionIds.has(transaction.id)
                              ? "bg-primary/5 border-primary/20"
                              : ""
                          }`}
                          onClick={(e) => {
                            if (
                              !(e.target as HTMLElement).closest(
                                ".action-buttons",
                              )
                            ) {
                              handleTransactionSelect(transaction.id, index);
                            }
                          }}
                        >
                          <td
                            className="p-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Checkbox
                              checked={selectedTransactionIds.has(
                                transaction.id,
                              )}
                              onCheckedChange={() =>
                                handleTransactionSelect(transaction.id, index)
                              }
                            />
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {new Date(transaction.date).toLocaleDateString(
                              "en-GB",
                              {
                                day: "numeric",
                                month: "short",
                                year: "2-digit",
                              },
                            )}
                          </td>
                          <td className="p-3 text-sm">
                            <div
                              className="max-w-72 truncate font-medium"
                              title={transaction.description}
                            >
                              {transaction.description || "No description"}
                            </div>
                          </td>
                          <td className="p-3 text-sm">
                            <Badge
                              variant="secondary"
                              className="text-xs font-medium border"
                              style={{
                                backgroundColor: `${getCategoryColor(transaction.category_id)}20`,
                                borderColor: getCategoryColor(
                                  transaction.category_id,
                                ),
                                color: getCategoryColor(
                                  transaction.category_id,
                                ),
                              }}
                            >
                              {getCategoryName(transaction.category_id)}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {getAccountName(transaction.account_id)}
                          </td>
                          <td className="p-3 text-sm">
                            {getTripName(transaction.trip_id) ? (
                              <Badge variant="outline" className="text-xs">
                                {getTripName(transaction.trip_id)}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="p-3 text-sm">
                            {getFamilyMemberName(
                              transaction.family_member_id,
                            ) ? (
                              <div className="flex items-center gap-1.5">
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{
                                    backgroundColor:
                                      transaction.family_member?.color ||
                                      "#gray",
                                  }}
                                />
                                <span className="text-xs">
                                  {getFamilyMemberName(
                                    transaction.family_member_id,
                                  )}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="p-3 text-sm">
                            {transaction.encord_expensable ? (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-success/20 text-success border-success/40"
                              >
                                Yes
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                No
                              </Badge>
                            )}
                          </td>
                          <td className="p-3 text-sm text-right font-mono">
                            <span
                              className={`font-semibold ${(transaction.amount_gbp || 0) >= 0 ? "text-success" : "text-destructive"}`}
                            >
                              £{(transaction.amount_gbp || 0).toFixed(2)}
                            </span>
                            {transaction.currency !== "GBP" &&
                              transaction.amount && (
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {transaction.currency}{" "}
                                  {transaction.amount.toFixed(2)}
                                </div>
                              )}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex gap-1 justify-center action-buttons">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditTransaction(transaction);
                                }}
                                className="h-7 w-7 p-0 hover:bg-muted"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteTransaction(transaction);
                                }}
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Compact Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
