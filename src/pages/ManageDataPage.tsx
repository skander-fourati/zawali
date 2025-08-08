import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Edit, Trash2, Tag, MapPin, Building, Palette, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";

// Types
interface Category {
  id: string;
  name: string;
  color: string | null;
  category_type: string;
  transaction_count?: number;
}

interface CategoryFormData {
  name: string;
  color: string;
}

const ManageDataPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("categories");
  
  // Category state
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);


  // Protected categories that cannot be edited or deleted
  const protectedCategories = ['Income', 'Investment'];
  
  const isProtectedCategory = (categoryName: string) => {
    return protectedCategories.includes(categoryName);
  };

  // Forms
  const addForm = useForm<CategoryFormData>({
    defaultValues: { name: '', color: '#3b82f6' }
  });
  
  const editForm = useForm<CategoryFormData>({
    defaultValues: { name: '', color: '#3b82f6' }
  });

  // Fetch categories with transaction counts
  const fetchCategories = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (categoriesError) throw categoriesError;

      // Get transaction counts for each category
      const categoriesWithCounts = await Promise.all(
        (categoriesData || []).map(async (category) => {
          const { count, error: countError } = await supabase
            .from('transactions')
            .select('id', { count: 'exact' })
            .eq('category_id', category.id);

          if (countError) {
            console.error('Error counting transactions:', countError);
            return { ...category, transaction_count: 0 };
          }

          return { ...category, transaction_count: count || 0 };
        })
      );

      setCategories(categoriesWithCounts);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [user]);

  // Add new category
  const onAddCategory = async (data: CategoryFormData) => {
    if (!user) return;

    try {
      // Check for duplicate names
      const existing = categories.find(c => c.name.toLowerCase() === data.name.toLowerCase());
      if (existing) {
        addForm.setError('name', { message: 'A category with this name already exists' });
        return;
      }

      const { error } = await supabase
        .from('categories')
        .insert([{
          user_id: user.id,
          name: data.name,
          color: data.color,
          category_type: 'expense' // Default type, though we're not using this concept
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Category "${data.name}" created successfully`,
      });

      setIsAddDialogOpen(false);
      addForm.reset();
      fetchCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      });
    }
  };

  // Edit category
  const onEditCategory = async (data: CategoryFormData) => {
    if (!editingCategory || !user) return;

    try {
      // Check for duplicate names (excluding current category)
      const existing = categories.find(c => 
        c.name.toLowerCase() === data.name.toLowerCase() && c.id !== editingCategory.id
      );
      if (existing) {
        editForm.setError('name', { message: 'A category with this name already exists' });
        return;
      }

      const { error } = await supabase
        .from('categories')
        .update({
          name: data.name,
          color: data.color,
        })
        .eq('id', editingCategory.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Category "${data.name}" updated successfully`,
      });

      setIsEditDialogOpen(false);
      setEditingCategory(null);
      editForm.reset();
      fetchCategories();
    } catch (error) {
      console.error('Error editing category:', error);
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      });
    }
  };

  // Delete category
  const onDeleteCategory = async (reassignToCategoryId: string | null = null) => {
    if (!deletingCategory) return;

    try {
      // If reassigning, update all transactions first
      if (reassignToCategoryId) {
        const { error: updateError } = await supabase
          .from('transactions')
          .update({ category_id: reassignToCategoryId })
          .eq('category_id', deletingCategory.id);

        if (updateError) throw updateError;
      } else {
        // Set transactions to null (uncategorized)
        const { error: updateError } = await supabase
          .from('transactions')
          .update({ category_id: null })
          .eq('category_id', deletingCategory.id);

        if (updateError) throw updateError;
      }

      // Now delete the category
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', deletingCategory.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Category "${deletingCategory.name}" deleted successfully`,
      });

      setIsDeleteDialogOpen(false);
      setDeletingCategory(null);
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    }
  };

  // Open edit dialog
  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    editForm.reset({
      name: category.name,
      color: category.color || '#3b82f6'
    });
    setIsEditDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (category: Category) => {
    setDeletingCategory(category);
    setIsDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-4">Loading categories...</p>
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
          <h1 className="text-3xl font-bold">Manage Data</h1>
        </div>
      </div>

      {/* Welcome Card */}
      <Card className="mb-6 bg-gradient-card shadow-soft border-0">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold">
              {user?.user_metadata?.display_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold">Organize Your Financial Data</h2>
              <p className="text-muted-foreground">Manage categories, trips, and accounts to better organize your transactions.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="trips" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Trips
          </TabsTrigger>
          <TabsTrigger value="accounts" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Accounts
          </TabsTrigger>
        </TabsList>

        {/* Categories Tab */}
        <TabsContent value="categories" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Transaction Categories ({categories.length})
              </CardTitle>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Category</DialogTitle>
                  </DialogHeader>
                  <Form {...addForm}>
                    <form onSubmit={addForm.handleSubmit(onAddCategory)} className="space-y-4">
                      <FormField
                        control={addForm.control}
                        name="name"
                        rules={{ required: "Category name is required" }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Groceries, Entertainment" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    <FormField
                        control={addForm.control}
                        name="color"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Color</FormLabel>
                            <FormControl>
                                <div className="space-y-3">
                                {/* Color picker input */}
                                <div className="flex items-center gap-4">
                                    <Input 
                                    type="color" 
                                    {...field} 
                                    className="w-20 h-12 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors" 
                                    />
                                    <div className="flex-1">
                                    <p className="text-sm font-medium">Click to choose a color</p>
                                    <p className="text-xs text-muted-foreground">Selected: {field.value}</p>
                                    </div>
                                </div>
                                
                                {/* Color preview */}
                                <div className="flex items-center gap-3 p-3 bg-gray-50 border rounded-lg">
                                    <div 
                                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                                    style={{ backgroundColor: field.value }}
                                    />
                                    <div>
                                    <p className="text-sm font-medium">Preview</p>
                                    <p className="text-xs text-muted-foreground">How your category will appear</p>
                                    </div>
                                </div>
                                </div>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                      <div className="flex gap-2">
                        <Button type="submit" className="flex-1">Add Category</Button>
                        <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Tag className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>No categories found. Add your first category to get started!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-6 h-6 rounded-full border-2 border-gray-200"
                          style={{ backgroundColor: category.color || '#gray' }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{category.name}</span>
                            {isProtectedCategory(category.name) && (
                              <Badge variant="secondary" className="text-xs">
                                <Shield className="w-3 h-3 mr-1" />
                                Protected
                              </Badge>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            Used in {category.transaction_count || 0} transactions
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditDialog(category)}
                          disabled={isProtectedCategory(category.name)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDeleteDialog(category)}
                          disabled={isProtectedCategory(category.name)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs remain the same... */}
        <TabsContent value="trips" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Travel & Trips
              </CardTitle>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Trip
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <MapPin className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Trip Management</h3>
                <p className="mb-4">Track expenses for business trips, vacations, and special events.</p>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-sm text-purple-700">
                  <p><strong>Coming Soon:</strong></p>
                  <p>• Create trips with date ranges</p>
                  <p>• Assign transactions to trips automatically</p>
                  <p>• Generate trip expense reports</p>
                  <p>• Track business vs personal travel</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accounts" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Financial Accounts
              </CardTitle>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Account
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Building className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Account Management</h3>
                <p className="mb-4">Manage your bank accounts, credit cards, and investment accounts.</p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-700">
                  <p><strong>Coming Soon:</strong></p>
                  <p>• Add and edit account details</p>
                  <p>• Set account types (Checking, Credit, Investment)</p>
                  <p>• View account balances and transaction history</p>
                  <p>• Archive closed accounts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditCategory)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                rules={{ required: "Category name is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
            control={editForm.control}
            name="color"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Color</FormLabel>
                <FormControl>
                    <div className="space-y-3">
                    {/* Color picker input */}
                    <div className="flex items-center gap-4">
                        <Input 
                        type="color" 
                        {...field} 
                        className="w-20 h-12 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors" 
                        />
                        <div className="flex-1">
                        <p className="text-sm font-medium">Click to choose a color</p>
                        <p className="text-xs text-muted-foreground">Selected: {field.value}</p>
                        </div>
                    </div>
                    
                    {/* Color preview */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 border rounded-lg">
                        <div 
                        className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: field.value }}
                        />
                        <div>
                        <p className="text-sm font-medium">Preview</p>
                        <p className="text-xs text-muted-foreground">How your category will appear</p>
                        </div>
                    </div>
                    </div>
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">Update Category</Button>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Are you sure you want to delete the category <strong>"{deletingCategory?.name}"</strong>?
            </p>
            {deletingCategory && deletingCategory.transaction_count > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Warning:</strong> This category is used by {deletingCategory.transaction_count} transactions.
                </p>
                <p className="text-sm text-yellow-700 mt-2">
                  You can either reassign these transactions to another category or leave them uncategorized.
                </p>
                <div className="mt-3">
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Reassign transactions to..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="null">Leave uncategorized</SelectItem>
                      {categories
                        .filter(c => c.id !== deletingCategory.id)
                        .map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <Button 
                variant="destructive" 
                onClick={() => onDeleteCategory(null)}
                className="flex-1"
              >
                Delete Category
              </Button>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageDataPage;