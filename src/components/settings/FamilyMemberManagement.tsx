import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";

// Types
interface FamilyMember {
  id: string;
  name: string;
  color: string | null;
  status: "active" | "settled" | "archived";
  transaction_count?: number;
}

interface FamilyMemberFormData {
  name: string;
  color: string;
}

const FamilyMemberManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Family member state
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [deletingMember, setDeletingMember] = useState<FamilyMember | null>(
    null,
  );
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [reassignToMemberId, setReassignToMemberId] = useState<string | null>(
    null,
  );

  // Forms
  const addForm = useForm<FamilyMemberFormData>({
    defaultValues: { name: "", color: "#3b82f6" },
  });

  const editForm = useForm<FamilyMemberFormData>({
    defaultValues: { name: "", color: "#3b82f6" },
  });

  // Fetch family members with transaction counts
  const fetchFamilyMembers = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get family members
      const { data: familyMembersData, error: familyMembersError } =
        await supabase
          .from("family_members")
          .select("*")
          .eq("user_id", user.id)
          .order("name");

      if (familyMembersError) throw familyMembersError;

      // Get transaction counts for each family member
      const membersWithCounts = await Promise.all(
        (familyMembersData || []).map(async (member) => {
          const { count, error: countError } = await supabase
            .from("transactions")
            .select("id", { count: "exact" })
            .eq("family_member_id", member.id);

          if (countError) {
            console.error("Error counting transactions:", countError);
            return { ...member, transaction_count: 0 };
          }

          return { ...member, transaction_count: count || 0 };
        }),
      );

      setFamilyMembers(membersWithCounts as unknown as FamilyMember[]);
    } catch (error) {
      console.error("Error fetching family members:", error);
      toast({
        title: "Error",
        description: "Failed to load family members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFamilyMembers();
  }, [user]);

  // Add new family member
  const onAddFamilyMember = async (data: FamilyMemberFormData) => {
    if (!user) return;

    try {
      // Check for duplicate names
      const existing = familyMembers.find(
        (m) => m.name.toLowerCase() === data.name.toLowerCase(),
      );
      if (existing) {
        addForm.setError("name", {
          message: "A family member with this name already exists",
        });
        return;
      }

      const { error } = await supabase.from("family_members").insert([
        {
          user_id: user.id,
          name: data.name,
          color: data.color,
          status: "active", // Default to active
        },
      ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Family member "${data.name}" added successfully`,
      });

      setIsAddDialogOpen(false);
      addForm.reset();
      fetchFamilyMembers();
    } catch (error) {
      console.error("Error adding family member:", error);
      toast({
        title: "Error",
        description: "Failed to add family member",
        variant: "destructive",
      });
    }
  };

  // Edit family member
  const onEditFamilyMember = async (data: FamilyMemberFormData) => {
    if (!editingMember || !user) return;

    try {
      // Check for duplicate names (excluding current member)
      const existing = familyMembers.find(
        (m) =>
          m.name.toLowerCase() === data.name.toLowerCase() &&
          m.id !== editingMember.id,
      );
      if (existing) {
        editForm.setError("name", {
          message: "A family member with this name already exists",
        });
        return;
      }

      const { error } = await supabase
        .from("family_members")
        .update({
          name: data.name,
          color: data.color,
        })
        .eq("id", editingMember.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Family member "${data.name}" updated successfully`,
      });

      setIsEditDialogOpen(false);
      setEditingMember(null);
      editForm.reset();
      fetchFamilyMembers();
    } catch (error) {
      console.error("Error editing family member:", error);
      toast({
        title: "Error",
        description: "Failed to update family member",
        variant: "destructive",
      });
    }
  };

  // Delete family member
  const onDeleteFamilyMember = async () => {
    if (!deletingMember) return;

    try {
      // If reassigning, update all transactions first
      if (reassignToMemberId && reassignToMemberId !== "null") {
        const { error: updateError } = await supabase
          .from("transactions")
          .update({ family_member_id: reassignToMemberId })
          .eq("family_member_id", deletingMember.id);

        if (updateError) throw updateError;
      } else {
        // Set transactions to null (no family member)
        const { error: updateError } = await supabase
          .from("transactions")
          .update({ family_member_id: null })
          .eq("family_member_id", deletingMember.id);

        if (updateError) throw updateError;
      }

      // Now delete the family member
      const { error } = await supabase
        .from("family_members")
        .delete()
        .eq("id", deletingMember.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Family member "${deletingMember.name}" deleted successfully`,
      });

      setIsDeleteDialogOpen(false);
      setDeletingMember(null);
      setReassignToMemberId(null);
      fetchFamilyMembers();
    } catch (error) {
      console.error("Error deleting family member:", error);
      toast({
        title: "Error",
        description: "Failed to delete family member",
        variant: "destructive",
      });
    }
  };

  // Open edit dialog
  const openEditDialog = (member: FamilyMember) => {
    setEditingMember(member);
    editForm.reset({
      name: member.name,
      color: member.color || "#3b82f6",
    });
    setIsEditDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (member: FamilyMember) => {
    setDeletingMember(member);
    setReassignToMemberId(null);
    setIsDeleteDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-success/20 text-success";
      case "settled":
        return "bg-accent/20 text-accent";
      case "archived":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="ml-4 text-foreground">Loading family members...</p>
      </div>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Users className="h-5 w-5" />
          Family Members ({familyMembers.length})
        </CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              Add Family Member
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                Add New Family Member
              </DialogTitle>
            </DialogHeader>
            <Form {...addForm}>
              <form
                onSubmit={addForm.handleSubmit(onAddFamilyMember)}
                className="space-y-4"
              >
                <FormField
                  control={addForm.control}
                  name="name"
                  rules={{ required: "Family member name is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Dad, Mom, Sister"
                          {...field}
                          className="bg-input border-border"
                        />
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
                              <p className="text-sm font-medium text-foreground">
                                Click to choose a color
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Selected: {field.value}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-muted border border-border rounded-lg">
                            <div
                              className="w-8 h-8 rounded-full border-2 border-background shadow-sm"
                              style={{ backgroundColor: field.value }}
                            />
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                Preview
                              </p>
                              <p className="text-xs text-muted-foreground">
                                How your family member will appear
                              </p>
                            </div>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    Add Family Member
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    className="border-border hover:bg-muted"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {familyMembers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>
              No family members found. Add your first family member to get
              started!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {familyMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-border"
                    style={{ backgroundColor: member.color || "#gray" }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {member.name}
                      </span>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${getStatusColor(member.status)}`}
                      >
                        {member.status}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Used in {member.transaction_count || 0} transactions
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditDialog(member)}
                    className="hover:bg-muted"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openDeleteDialog(member)}
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

      {/* Edit Family Member Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Edit Family Member
            </DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(onEditFamilyMember)}
              className="space-y-4"
            >
              <FormField
                control={editForm.control}
                name="name"
                rules={{ required: "Family member name is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Name</FormLabel>
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
                            <p className="text-sm font-medium text-foreground">
                              Click to choose a color
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Selected: {field.value}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-muted border border-border rounded-lg">
                          <div
                            className="w-8 h-8 rounded-full border-2 border-background shadow-sm"
                            style={{ backgroundColor: field.value }}
                          />
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              Preview
                            </p>
                            <p className="text-xs text-muted-foreground">
                              How your family member will appear
                            </p>
                          </div>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  Update Family Member
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="border-border hover:bg-muted"
                >
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
            <DialogTitle className="text-foreground">
              Delete Family Member
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-foreground">
              Are you sure you want to delete the family member{" "}
              <strong>"{deletingMember?.name}"</strong>?
            </p>
            {deletingMember && deletingMember.transaction_count > 0 && (
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                <p className="text-sm text-warning">
                  <strong>Warning:</strong> This family member is used by{" "}
                  {deletingMember.transaction_count} transactions.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  You can either reassign these transactions to another family
                  member or remove the family member association.
                </p>
                <div className="mt-3">
                  <Select
                    value={reassignToMemberId || "null"}
                    onValueChange={setReassignToMemberId}
                  >
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder="Reassign transactions to..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="null">
                        Remove family member association
                      </SelectItem>
                      {familyMembers
                        .filter((m) => m.id !== deletingMember.id)
                        .map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={onDeleteFamilyMember}
                className="flex-1 bg-destructive hover:bg-destructive/90"
              >
                Delete Family Member
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                className="border-border hover:bg-muted"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default FamilyMemberManagement;
