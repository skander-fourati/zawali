import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Plus, Edit, Trash2, Search, Filter, X, Edit3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTransactions } from "@/hooks/useTransactions";
import { AddEditTransactionModal } from "@/components/transactions/AddEditTransactionModal";
import { BulkEditTransactionModal } from "@/components/transactions/BulkEditTransactionModal";
import { DeleteConfirmDialog } from "@/components/transactions/DeleteConfirmDialog";

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
    bulkUpdateTransactions
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
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);

  const ITEMS_PER_PAGE = 50;

  // Handle individual transaction selection
  const handleTransactionSelect = (transactionId: string, checked: boolean) => {
    setSelectedTransactionIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(transactionId);
      } else {
        newSet.delete(transactionId);
      }
      return newSet;
    });
  };

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
  };

  // Clear all selections
  const clearAllSelections = () => {
    setSelectedTransactionIds(new Set());
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
  };

  // Handle modal save
  const handleModalSave = () => {
    refetch();
    setIsAddModalOpen(false);
    setEditingTransaction(null);
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

  // Handle bulk edit save
  const handleBulkEditSave = async (property: string, value: any, additionalData?: any) => {
    if (selectedTransactionIds.size === 0) return;

    try {
      const selectedTransactionsData = transactions.filter(t => 
        selectedTransactionIds.has(t.id)
      );

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

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Clear all filters function
  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setAccountFilter('all');
    setTripFilter('all');
    setFamilyMemberFilter('all');
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-4">Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">All Transactions</h1>
        </div>
        <div className="flex items-center gap-2">
          {selectedTransactionIds.size > 0 && (
            <>
              <Button 
                variant="outline"
                onClick={handleBulkEdit}
                className="flex items-center gap-2"
              >
                <Edit3 className="h-4 w-4" />
                Bulk Edit ({selectedTransactionIds.size})
              </Button>
              <Button 
                variant="ghost"
                onClick={clearAllSelections}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <X className="h-4 w-4" />
                Clear Selection
              </Button>
            </>
          )}
          <Button 
            onClick={handleAddTransaction}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search transactions by description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {(categoryFilter !== 'all' || accountFilter !== 'all' || tripFilter !== 'all' || familyMemberFilter !== 'all') && (
                <Badge variant="secondary" className="ml-2">
                  {[categoryFilter !== 'all', accountFilter !== 'all', tripFilter !== 'all', familyMemberFilter !== 'all'].filter(Boolean).length}
                </Badge>
              )}
            </Button>
          </div>

          {showFilters && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 pt-4 border-t mt-4">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category: any) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={accountFilter} onValueChange={setAccountFilter}>
                  <SelectTrigger>
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
                  <SelectTrigger>
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
                  <SelectTrigger>
                    <SelectValue placeholder="All Family" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Family Members</SelectItem>
                    {familyMembers.map((member: any) => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full border"
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
                  onClick={clearFilters}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              </div>

              {(categoryFilter !== 'all' || accountFilter !== 'all' || tripFilter !== 'all' || familyMemberFilter !== 'all') && (
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  {categoryFilter !== 'all' && (
                    <Badge variant="outline" className="text-xs">
                      Category: {getCategoryName(categoryFilter)}
                    </Badge>
                  )}
                  {accountFilter !== 'all' && (
                    <Badge variant="outline" className="text-xs">
                      Account: {getAccountName(accountFilter)}
                    </Badge>
                  )}
                  {tripFilter !== 'all' && (
                    <Badge variant="outline" className="text-xs">
                      Trip: {getTripName(tripFilter)}
                    </Badge>
                  )}
                  {familyMemberFilter !== 'all' && (
                    <Badge variant="outline" className="text-xs">
                      Family: {getFamilyMemberName(familyMemberFilter)}
                    </Badge>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <div className="mb-4 text-sm text-gray-600 flex items-center justify-between">
        <div>
          Showing {paginatedTransactions.length} of {filteredAndSortedTransactions.length} transactions
          {filteredAndSortedTransactions.length !== transactions.length && (
            <span> (filtered from {transactions.length} total)</span>
          )}
        </div>
        {selectedTransactionIds.size > 0 && (
          <div className="text-blue-600 font-medium">
            {selectedTransactionIds.size} transaction{selectedTransactionIds.size !== 1 ? 's' : ''} selected
          </div>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {paginatedTransactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg">No transactions found</p>
              <p className="text-sm mt-2">
                {transactions.length === 0 
                  ? "Upload some CSV files from the dashboard to see transactions here."
                  : "Try adjusting your search or filters."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="text-left p-4 font-semibold">
                      <Checkbox
                        checked={allPageSelected}
                        indeterminate={somePageSelected && !allPageSelected}
                        onCheckedChange={handleSelectAllPage}
                      />
                    </th>
                    <th 
                      className="text-left p-4 font-semibold cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('date')}
                    >
                      Date {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="text-left p-4 font-semibold cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('description')}
                    >
                      Description {sortField === 'description' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-left p-4 font-semibold">Category</th>
                    <th className="text-left p-4 font-semibold">Account</th>
                    <th className="text-left p-4 font-semibold">Trip</th>
                    <th className="text-left p-4 font-semibold">Family</th>
                    <th className="text-left p-4 font-semibold">Encord</th>
                    <th 
                      className="text-right p-4 font-semibold cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('amount_gbp')}
                    >
                      Amount (GBP) {sortField === 'amount_gbp' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-center p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.map((transaction: any, index: number) => (
                    <tr 
                      key={transaction.id} 
                      className={`border-b hover:bg-gray-50 ${
                        selectedTransactionIds.has(transaction.id) 
                          ? 'bg-blue-50' 
                          : index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                      }`}
                    >
                      <td className="p-4">
                        <Checkbox
                          checked={selectedTransactionIds.has(transaction.id)}
                          onCheckedChange={(checked) => 
                            handleTransactionSelect(transaction.id, checked as boolean)
                          }
                        />
                      </td>
                      <td className="p-4 text-sm">
                        {new Date(transaction.date).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-sm">
                        <div className="max-w-64 truncate" title={transaction.description}>
                          {transaction.description || 'No description'}
                        </div>
                      </td>
                      <td className="p-4 text-sm">
                        <Badge variant="secondary">{getCategoryName(transaction.category_id)}</Badge>
                      </td>
                      <td className="p-4 text-sm">
                        {getAccountName(transaction.account_id)}
                      </td>
                      <td className="p-4 text-sm">
                        {getTripName(transaction.trip_id) ? (
                          <Badge variant="outline">{getTripName(transaction.trip_id)}</Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4 text-sm">
                        {getFamilyMemberName(transaction.family_member_id) ? (
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full border"
                              style={{ backgroundColor: transaction.family_member?.color || '#gray' }}
                            />
                            <span className="text-xs">{getFamilyMemberName(transaction.family_member_id)}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4 text-sm">
                        {transaction.encord_expensable ? (
                          <Badge className="bg-green-100 text-green-800">Yes</Badge>
                        ) : (
                          <Badge variant="secondary">No</Badge>
                        )}
                      </td>
                      <td className="p-4 text-sm text-right font-mono">
                        <span className={(transaction.amount_gbp || 0) >= 0 ? 'text-green-600' : 'text-red-600'}>
                          £{((transaction.amount_gbp || 0)).toFixed(2)}
                        </span>
                        {transaction.currency !== 'GBP' && transaction.amount && (
                          <div className="text-xs text-gray-500">
                            {transaction.currency} {transaction.amount.toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex gap-2 justify-center">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleEdit(transaction)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(transaction)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm">Page {currentPage} of {totalPages}</span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
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

      <DeleteConfirmDialog
        isOpen={!!deletingTransaction}
        onClose={() => setDeletingTransaction(null)}
        onConfirm={confirmDelete}
        transactionDescription={deletingTransaction?.description || ''}
      />
    </div>
  );
};

export default TransactionsPage;