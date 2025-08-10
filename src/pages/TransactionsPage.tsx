import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Plus, Edit, Trash2, Search, Filter, X, Edit3, Trash } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTransactions } from "@/hooks/useTransactions";
import { AddEditTransactionModal } from "@/components/transactions/AddEditTransactionModal";
import { BulkEditTransactionModal } from "@/components/transactions/BulkEditTransactionModal";
import { DeleteConfirmDialog } from "@/components/transactions/DeleteConfirmDialog";
import { BulkDeleteConfirmDialog } from "@/components/transactions/BulkDeleteConfirmDialog";

// Zawali Toast Component
const ZawaliToast = ({ message, onDismiss }: { message: string; onDismiss: () => void }) => (
  <div className="fixed top-4 right-4 bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-lg z-50 max-w-sm zawali-slide-up">
    <div className="flex items-start gap-3">
      <span className="text-xl">😅</span>
      <div className="flex-1">
        <p className="text-gray-200 text-sm">{message}</p>
      </div>
      <button onClick={onDismiss} className="text-gray-400 hover:text-gray-200 text-sm">✕</button>
    </div>
  </div>
);

const TransactionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Use the transactions hook
  const {
    transactions,
    categories,
    accounts,
    trips,
    familyMembers,
    loading,
    refetch,
    bulkUpdateTransactions,
    bulkDeleteTransactions
  } = useTransactions();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter states
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [tripFilter, setTripFilter] = useState('all');
  const [familyMemberFilter, setFamilyMemberFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Modal states for edit/add/delete
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Bulk selection states
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number>(-1);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  // Zawali personality
  const [zawaliMessage, setZawaliMessage] = useState<string | null>(null);

  // Keyboard state tracking
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);

  const ITEMS_PER_PAGE = 50;

  // Show zawali message occasionally
  const showZawaliMessage = (message: string) => {
    setZawaliMessage(message);
    setTimeout(() => setZawaliMessage(null), 4000);
  };

  // Track keyboard state
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

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, []);

  // Clear all filters function
  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setAccountFilter('all');
    setTripFilter('all');
    setFamilyMemberFilter('all');
    
    if (Math.random() < 0.2) {
      showZawaliMessage("Filters cleared! Starting fresh with all your financial adventures 📊");
    }
  };

  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((t: any) => 
        t.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter((t: any) => t.category_id === categoryFilter);
    }

    // Account filter  
    if (accountFilter && accountFilter !== 'all') {
      filtered = filtered.filter((t: any) => t.account_id === accountFilter);
    }

    // Trip filter
    if (tripFilter && tripFilter !== 'all') {
      filtered = filtered.filter((t: any) => t.trip_id === tripFilter);
    }

    // Family member filter
    if (familyMemberFilter && familyMemberFilter !== 'all') {
      const familyTransferCategory = categories.find(cat => cat.name === 'Family Transfer');
      filtered = filtered.filter((t: any) => 
        t.family_member_id === familyMemberFilter && 
        t.category_id === familyTransferCategory?.id
      );
    }

    // Sort
    filtered.sort((a: any, b: any) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case 'date':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 'description':
          aValue = a.description?.toLowerCase() || '';
          bValue = b.description?.toLowerCase() || '';
          break;
        case 'amount_gbp':
          aValue = a.amount_gbp || 0;
          bValue = b.amount_gbp || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [transactions, searchQuery, categoryFilter, accountFilter, tripFilter, familyMemberFilter, sortField, sortDirection, categories]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAndSortedTransactions, currentPage]);

  // Handle individual transaction selection with keyboard modifiers
  const handleTransactionSelect = useCallback((transactionId: string, index: number) => {
    setSelectedTransactionIds(prev => {
      const newSet = new Set(prev);
      
      if (isShiftPressed && lastSelectedIndex !== -1) {
        // Range selection: select all items between last selected and current
        const startIndex = Math.min(lastSelectedIndex, index);
        const endIndex = Math.max(lastSelectedIndex, index);
        
        for (let i = startIndex; i <= endIndex; i++) {
          if (paginatedTransactions[i]) {
            newSet.add(paginatedTransactions[i].id);
          }
        }
      } else if (isCtrlPressed) {
        // Individual toggle: add/remove without affecting others
        if (newSet.has(transactionId)) {
          newSet.delete(transactionId);
        } else {
          newSet.add(transactionId);
        }
      } else {
        // Normal click: toggle this item only
        if (newSet.has(transactionId)) {
          newSet.delete(transactionId);
        } else {
          newSet.add(transactionId);
        }
      }
      
      return newSet;
    });

    // Update last selected index for range selection
    setLastSelectedIndex(index);
  }, [lastSelectedIndex, paginatedTransactions, isShiftPressed, isCtrlPressed]);

  // Handle select all on current page
  const handleSelectAllPage = (checked: boolean) => {
    setSelectedTransactionIds(prev => {
      const newSet = new Set(prev);
      
      paginatedTransactions.forEach(transaction => {
        if (checked) {
          newSet.add(transaction.id);
        } else {
          newSet.delete(transaction.id);
        }
      });
      
      return newSet;
    });
    
    // Reset last selected index
    setLastSelectedIndex(-1);
    
    if (checked && Math.random() < 0.3) {
      showZawaliMessage("Selected all transactions! Mass financial analysis mode activated 📊");
    }
  };

  // Clear all selections
  const clearAllSelections = () => {
    setSelectedTransactionIds(new Set());
    setLastSelectedIndex(-1);
  };

  // Handle edit transaction
  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction);
  };

  // Handle delete with confirmation modal
  const handleDelete = (transaction: any) => {
    setDeletingTransaction(transaction);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!deletingTransaction) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', deletingTransaction.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Transaction deleted.",
      });

      // Zawali humor occasionally
      if (Math.random() < 0.25) {
        showZawaliMessage("Transaction deleted! One less financial mystery to solve 🕵️");
      }

      refetch();
      setDeletingTransaction(null);
      
      // Remove from selections if it was selected
      setSelectedTransactionIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(deletingTransaction.id);
        return newSet;
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Error", 
        description: "Failed to delete transaction.",
        variant: "destructive",
      });
    }
  };

  // Handle add transaction
  const handleAddTransaction = () => {
    setIsAddModalOpen(true);
    
    if (Math.random() < 0.2) {
      showZawaliMessage("Adding a new transaction! Your financial story continues... 📖");
    }
  };

  // Handle modal save
  const handleModalSave = () => {
    refetch();
    setIsAddModalOpen(false);
    setEditingTransaction(null);
    
    if (Math.random() < 0.3) {
      showZawaliMessage("Transaction saved! Another chapter in the book of your finances 💼");
    }
  };

  // Handle bulk edit
  const handleBulkEdit = () => {
    if (selectedTransactionIds.size === 0) {
      toast({
        title: "No transactions selected",
        description: "Please select transactions to bulk edit.",
        variant: "destructive",
      });
      return;
    }
    setIsBulkEditModalOpen(true);
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedTransactionIds.size === 0) {
      toast({
        title: "No transactions selected",
        description: "Please select transactions to bulk delete.",
        variant: "destructive",
      });
      return;
    }
    setIsBulkDeleteModalOpen(true);
  };

  // Handle bulk edit save
  const handleBulkEditSave = async (property: string, value: any, additionalData?: any) => {
    if (selectedTransactionIds.size === 0) return;

    try {
      const result = await bulkUpdateTransactions(
        Array.from(selectedTransactionIds), 
        property, 
        value,
        additionalData
      );

      if (result.successCount > 0) {
        toast({
          title: "Bulk Update Completed",
          description: `Successfully updated ${result.successCount} transaction${result.successCount !== 1 ? 's' : ''}.${result.failures.length > 0 ? ` ${result.failures.length} transaction${result.failures.length !== 1 ? 's' : ''} failed.` : ''}`,
        });
        
        if (Math.random() < 0.4) {
          showZawaliMessage(`${result.successCount} transactions updated! Efficiency level: zawali pro 🚀`);
        }
      }

      if (result.failures.length > 0) {
        const failedDescriptions = result.failures.map(f => 
          `${f.description} (${new Date(f.date).toLocaleDateString()})`
        ).slice(0, 3); // Show only first 3

        toast({
          title: "Some updates failed",
          description: `Failed to update: ${failedDescriptions.join(', ')}${result.failures.length > 3 ? ` and ${result.failures.length - 3} more...` : ''}`,
          variant: "destructive",
        });
      }

      // Refetch data and clear selections
      await refetch();
      clearAllSelections();
      setIsBulkEditModalOpen(false);

    } catch (error) {
      console.error('Bulk edit error:', error);
      toast({
        title: "Error",
        description: "Failed to perform bulk edit.",
        variant: "destructive",
      });
    }
  };

  // Handle bulk delete confirm
  const handleBulkDeleteConfirm = async () => {
    if (selectedTransactionIds.size === 0) return;

    setBulkDeleteLoading(true);
    
    try {
      const result = await bulkDeleteTransactions(Array.from(selectedTransactionIds));

      if (result.successCount > 0) {
        toast({
          title: "Bulk Delete Completed",
          description: `Successfully deleted ${result.successCount} transaction${result.successCount !== 1 ? 's' : ''}.${result.failures.length > 0 ? ` ${result.failures.length} transaction${result.failures.length !== 1 ? 's' : ''} failed.` : ''}`,
        });
        
        if (Math.random() < 0.4) {
          showZawaliMessage(`${result.successCount} transactions deleted! Spring cleaning, zawali style 🧹`);
        }
      }

      if (result.failures.length > 0) {
        const failedDescriptions = result.failures.map(f => 
          `${f.description} (${new Date(f.date).toLocaleDateString()})`
        ).slice(0, 3);

        toast({
          title: "Some deletions failed",
          description: `Failed to delete: ${failedDescriptions.join(', ')}${result.failures.length > 3 ? ` and ${result.failures.length - 3} more...` : ''}`,
          variant: "destructive",
        });
      }

      // Refetch data and clear selections
      await refetch();
      clearAllSelections();
      setIsBulkDeleteModalOpen(false);

    } catch (error) {
      console.error('Bulk delete error:', error);
      toast({
        title: "Error",
        description: "Failed to perform bulk delete.",
        variant: "destructive",
      });
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const totalPages = Math.ceil(filteredAndSortedTransactions.length / ITEMS_PER_PAGE);

  // Check if all transactions on current page are selected
  const allPageSelected = paginatedTransactions.length > 0 && 
    paginatedTransactions.every(t => selectedTransactionIds.has(t.id));
  
  // Check if some (but not all) transactions on current page are selected
  const somePageSelected = paginatedTransactions.some(t => selectedTransactionIds.has(t.id)) && !allPageSelected;

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'Uncategorized';
    const category = categories.find((c: any) => c.id === categoryId);
    return category?.name || 'Unknown';
  };

  const getCategoryColor = (categoryId: string | null) => {
    if (!categoryId) return '#6b7280';
    const category = categories.find((c: any) => c.id === categoryId);
    return category?.color || '#6b7280';
  };

  const getAccountName = (accountId: string | null) => {
    if (!accountId) return 'Unknown Account';
    const account = accounts.find((a: any) => a.id === accountId);
    return account?.name || 'Unknown Account';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your financial adventures...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pl-4 pr-4 py-6">
      <div className="max-w-[calc(100vw-280px)] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold">All Transactions</h1>
              <p className="text-sm text-muted-foreground">
                Showing {filteredAndSortedTransactions.length} of {transactions.length} transactions
                {selectedTransactionIds.size > 0 && (
                  <span className="text-primary ml-2">• {selectedTransactionIds.size} selected</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedTransactionIds.size > 0 && (
              <>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleBulkEdit}
                  className="flex items-center gap-2"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit ({selectedTransactionIds.size})
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDelete}
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
              onClick={handleAddTransaction}
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Transaction
            </Button>
          </div>
        </div>

        {/* Compact Search and Filters */}
        <div className="mb-4">
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
              {(categoryFilter !== 'all' || accountFilter !== 'all' || tripFilter !== 'all' || familyMemberFilter !== 'all') && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                  {[categoryFilter !== 'all', accountFilter !== 'all', tripFilter !== 'all', familyMemberFilter !== 'all'].filter(Boolean).length}
                </Badge>
              )}
            </Button>
          </div>

          {showFilters && (
            <Card className="p-3">
              <CardContent className="p-0">
                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3 mb-3">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
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

                  <Select value={accountFilter} onValueChange={setAccountFilter}>
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

                  <Select value={familyMemberFilter} onValueChange={setFamilyMemberFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All Family" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Family Members</SelectItem>
                      {familyMembers.map((member: any) => (
                        <SelectItem key={member.id} value={member.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: member.color }}
                            />
                            {member.name}
                          </div>
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
                {(categoryFilter !== 'all' || accountFilter !== 'all' || tripFilter !== 'all' || familyMemberFilter !== 'all') && (
                  <div className="flex flex-wrap gap-1 pt-2 border-t">
                    {categoryFilter !== 'all' && (
                      <Badge variant="outline" className="text-xs h-5 px-2">
                        Category: {getCategoryName(categoryFilter)}
                      </Badge>
                    )}
                    {accountFilter !== 'all' && (
                      <Badge variant="outline" className="text-xs h-5 px-2">
                        Account: {getAccountName(accountFilter)}
                      </Badge>
                    )}
                    {tripFilter !== 'all' && (
                      <Badge variant="outline" className="text-xs h-5 px-2">
                        Trip: {getTripName(tripFilter)}
                      </Badge>
                    )}
                    {familyMemberFilter !== 'all' && (
                      <Badge variant="outline" className="text-xs h-5 px-2">
                        Family: {getFamilyMemberName(familyMemberFilter)}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Keyboard shortcuts info */}
        {selectedTransactionIds.size > 0 && (
          <div className="mb-3 p-2 bg-muted/50 border border-border rounded-md">
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Tips:</span>
              <span className="ml-2">Hold <kbd className="px-1 py-0.5 bg-background rounded text-xs border">Shift</kbd> + click for ranges</span>
              <span className="ml-3">Hold <kbd className="px-1 py-0.5 bg-background rounded text-xs border">Ctrl</kbd> + click for individual selection</span>
              {(isShiftPressed || isCtrlPressed) && (
                <span className="ml-3 text-primary font-medium">
                  {isShiftPressed && "Shift"} {isShiftPressed && isCtrlPressed && "+"} {isCtrlPressed && "Ctrl"} active
                </span>
              )}
            </div>
          </div>
        )}

        {/* Streamlined Table */}
        {paginatedTransactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📊</div>
            <p className="text-lg font-medium">No transactions found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {transactions.length === 0 
                ? "Upload some CSV files from the dashboard to see transactions here."
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
                      onClick={() => handleSort('date')}
                    >
                      Date {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="text-left p-3 font-medium cursor-pointer hover:bg-muted/70 transition-colors"
                      onClick={() => handleSort('description')}
                    >
                      Description {sortField === 'description' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-left p-3 font-medium">Category</th>
                    <th className="text-left p-3 font-medium">Account</th>
                    <th className="text-left p-3 font-medium">Trip</th>
                    <th className="text-left p-3 font-medium">Family</th>
                    <th className="text-left p-3 font-medium">Encord</th>
                    <th 
                      className="text-right p-3 font-medium cursor-pointer hover:bg-muted/70 transition-colors"
                      onClick={() => handleSort('amount_gbp')}
                    >
                      Amount (GBP) {sortField === 'amount_gbp' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-center p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.map((transaction: any, index: number) => (
                    <tr 
                      key={transaction.id} 
                      className={`border-b border-border hover:bg-muted/30 cursor-pointer transition-colors ${
                        selectedTransactionIds.has(transaction.id) 
                          ? 'bg-primary/5 border-primary/20' 
                          : ''
                      }`}
                      onClick={(e) => {
                        if (!(e.target as HTMLElement).closest('.action-buttons')) {
                          handleTransactionSelect(transaction.id, index);
                        }
                      }}
                    >
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedTransactionIds.has(transaction.id)}
                          onCheckedChange={() => 
                            handleTransactionSelect(transaction.id, index)
                          }
                        />
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {new Date(transaction.date).toLocaleDateString('en-GB', { 
                          day: 'numeric', 
                          month: 'short',
                          year: '2-digit'
                        })}
                      </td>
                      <td className="p-3 text-sm">
                        <div className="max-w-72 truncate font-medium" title={transaction.description}>
                          {transaction.description || 'No description'}
                        </div>
                      </td>
                      <td className="p-3 text-sm">
                        <Badge 
                          variant="secondary" 
                          className="text-xs font-medium border"
                          style={{
                            backgroundColor: `${getCategoryColor(transaction.category_id)}20`,
                            borderColor: getCategoryColor(transaction.category_id),
                            color: getCategoryColor(transaction.category_id)
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
                        {getFamilyMemberName(transaction.family_member_id) ? (
                          <div className="flex items-center gap-1.5">
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: transaction.family_member?.color || '#gray' }}
                            />
                            <span className="text-xs">{getFamilyMemberName(transaction.family_member_id)}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-3 text-sm">
                        {transaction.encord_expensable ? (
                          <Badge variant="secondary" className="text-xs bg-success/20 text-success border-success/40">
                            Yes
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">No</Badge>
                        )}
                      </td>
                      <td className="p-3 text-sm text-right font-mono">
                        <span className={`font-semibold ${(transaction.amount_gbp || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                          £{((transaction.amount_gbp || 0)).toFixed(2)}
                        </span>
                        {transaction.currency !== 'GBP' && transaction.amount && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {transaction.currency} {transaction.amount.toFixed(2)}
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
                              handleEdit(transaction);
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
                              handleDelete(transaction);
                            }}
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Modals */}
        <AddEditTransactionModal
          isOpen={isAddModalOpen || !!editingTransaction}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingTransaction(null);
          }}
          transaction={editingTransaction}
          onSave={handleModalSave}
          categories={categories}
          accounts={accounts}
          trips={trips}
        />

        <BulkEditTransactionModal
          isOpen={isBulkEditModalOpen}
          onClose={() => setIsBulkEditModalOpen(false)}
          onSave={handleBulkEditSave}
          selectedTransactions={transactions.filter(t => selectedTransactionIds.has(t.id))}
          categories={categories}
          accounts={accounts}
          trips={trips}
          familyMembers={familyMembers}
        />

        <BulkDeleteConfirmDialog
          isOpen={isBulkDeleteModalOpen}
          onClose={() => setIsBulkDeleteModalOpen(false)}
          onConfirm={handleBulkDeleteConfirm}
          selectedTransactions={transactions.filter(t => selectedTransactionIds.has(t.id))}
          loading={bulkDeleteLoading}
        />

        <DeleteConfirmDialog
          isOpen={!!deletingTransaction}
          onClose={() => setDeletingTransaction(null)}
          onConfirm={confirmDelete}
          transactionDescription={deletingTransaction?.description || ''}
        />

        {/* Zawali Toast Message */}
        {zawaliMessage && (
          <ZawaliToast 
            message={zawaliMessage}
            onDismiss={() => setZawaliMessage(null)}
          />
        )}
      </div>
    </div>
  );
};

export default TransactionsPage;