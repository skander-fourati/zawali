import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Tag, Shield } from "lucide-react";
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

const CategoryManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Category state
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [reassignToCategoryId, setReassignToCategoryId] = useState<string | null>(null);

  // Protected categories that cannot be edited or deleted
  const protectedCategories = ['Income', 'Investment', 'Family Transfer'];
  
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
  const onDeleteCategory = async () => {
    if (!deletingCategory) return;

    try {
      // If reassigning, update all transactions first
      if (reassignToCategoryId && reassignToCategoryId !== 'null') {
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
      setReassignToCategoryId(null);
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
    setReassignToCategoryId(null);
    setIsDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="ml-4 text-foreground">Loading categories...</p>
      </div>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Tag className="h-5 w-5" />
          Transaction Categories ({categories.length})
        </CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Add New Category</DialogTitle>
            </DialogHeader>
            <Form {...addForm}>
              <form onSubmit={addForm.handleSubmit(onAddCategory)} className="space-y-4">
                <FormField
                  control={addForm.control}
                  name="name"
                  rules={{ required: "Category name is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Category Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Groceries, Entertainment" {...field} className="bg-input border-border" />
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
                      <FormLabel className="text-foreground">Color</FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          <div className="flex items-center gap-4">
                            <Input 
                              type="color" 
                              {...field} 
                              className="w-20 h-12 border-2 border-border rounded-lg cursor-pointer hover:border-primary transition-colors" 
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground">Click to choose a color</p>
                              <p className="text-xs text-muted-foreground">Selected: {field.value}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-muted border border-border rounded-lg">
                            <div 
                              className="w-8 h-8 rounded-full border-2 border-background shadow-sm"
                              style={{ backgroundColor: field.value }}
                            />
                            <div>
                              <p className="text-sm font-medium text-foreground">Preview</p>
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
                  <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">Add Category</Button>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-border hover:bg-muted">
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
              <div key={category.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-border"
                    style={{ backgroundColor: category.color || '#gray' }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{category.name}</span>
                      {isProtectedCategory(category.name) && (
                        <Badge variant="secondary" className="text-xs bg-secondary/20 text-secondary">
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
                    className="hover:bg-muted"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openDeleteDialog(category)}
                    disabled={isProtectedCategory(category.name)}
                    className="text-destructive hover:text-destructive hover:bg-muted"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Category</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditCategory)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                rules={{ required: "Category name is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Category Name</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-input border-border" />
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
                    <FormLabel className="text-foreground">Color</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        <div className="flex items-center gap-4">
                          <Input 
                            type="color" 
                            {...field} 
                            className="w-20 h-12 border-2 border-border rounded-lg cursor-pointer hover:border-primary transition-colors" 
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">Click to choose a color</p>
                            <p className="text-xs text-muted-foreground">Selected: {field.value}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-muted border border-border rounded-lg">
                          <div 
                            className="w-8 h-8 rounded-full border-2 border-background shadow-sm"
                            style={{ backgroundColor: field.value }}
                          />
                          <div>
                            <p className="text-sm font-medium text-foreground">Preview</p>
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
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">Update Category</Button>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-border hover:bg-muted">
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Delete Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-foreground">
              Are you sure you want to delete the category <strong>"{deletingCategory?.name}"</strong>?
            </p>
            {deletingCategory && deletingCategory.transaction_count > 0 && (
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                <p className="text-sm text-warning">
                  <strong>Warning:</strong> This category is used by {deletingCategory.transaction_count} transactions.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  You can either reassign these transactions to another category or leave them uncategorized.
                </p>
                <div className="mt-3">
                  <Select value={reassignToCategoryId || 'null'} onValueChange={setReassignToCategoryId}>
                    <SelectTrigger className="bg-input border-border">
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
                onClick={onDeleteCategory}
                className="flex-1 bg-destructive hover:bg-destructive/90"
              >
                Delete Category
              </Button>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="border-border hover:bg-muted">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default CategoryManagement;