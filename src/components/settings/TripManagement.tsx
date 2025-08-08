import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";

// Types
interface Trip {
  id: string;
  user_id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  transaction_count?: number;
}

interface TripFormData {
  name: string;
  start_date: string;
  end_date: string;
}

const TripManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Trip state
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [deletingTrip, setDeletingTrip] = useState<Trip | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [reassignToTripId, setReassignToTripId] = useState<string | null>(null);

  // Forms
  const addForm = useForm<TripFormData>({
    defaultValues: { 
      name: '', 
      start_date: '', 
      end_date: '' 
    }
  });
  
  const editForm = useForm<TripFormData>({
    defaultValues: { 
      name: '', 
      start_date: '', 
      end_date: '' 
    }
  });

  // Custom validation for date range
  const validateDateRange = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return true; // Allow empty dates
    return new Date(startDate) <= new Date(endDate);
  };

  // Fetch trips with transaction counts
  const fetchTrips = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get trips
      const { data: tripsData, error: tripsError } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (tripsError) throw tripsError;

      // Get transaction counts for each trip
      const tripsWithCounts = await Promise.all(
        (tripsData || []).map(async (trip) => {
          const { count, error: countError } = await supabase
            .from('transactions')
            .select('id', { count: 'exact' })
            .eq('trip_id', trip.id);

          if (countError) {
            console.error('Error counting transactions:', countError);
            return { ...trip, transaction_count: 0 };
          }

          return { ...trip, transaction_count: count || 0 };
        })
      );

      setTrips(tripsWithCounts);
    } catch (error) {
      console.error('Error fetching trips:', error);
      toast({
        title: "Error",
        description: "Failed to load trips",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [user]);

  // Add new trip
  const onAddTrip = async (data: TripFormData) => {
    if (!user) return;

    try {
      // Check for duplicate names
      const existing = trips.find(t => t.name.toLowerCase() === data.name.toLowerCase());
      if (existing) {
        addForm.setError('name', { message: 'A trip with this name already exists' });
        return;
      }

      // Validate date range
      if (!validateDateRange(data.start_date, data.end_date)) {
        addForm.setError('end_date', { message: 'End date must be after or equal to start date' });
        return;
      }

      const { error } = await supabase
        .from('trips')
        .insert([{
          user_id: user.id,
          name: data.name,
          start_date: data.start_date || null,
          end_date: data.end_date || null,
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Trip "${data.name}" created successfully`,
      });

      setIsAddDialogOpen(false);
      addForm.reset();
      fetchTrips();
    } catch (error) {
      console.error('Error adding trip:', error);
      toast({
        title: "Error",
        description: "Failed to create trip",
        variant: "destructive",
      });
    }
  };

  // Edit trip
  const onEditTrip = async (data: TripFormData) => {
    if (!editingTrip || !user) return;

    try {
      // Check for duplicate names (excluding current trip)
      const existing = trips.find(t => 
        t.name.toLowerCase() === data.name.toLowerCase() && t.id !== editingTrip.id
      );
      if (existing) {
        editForm.setError('name', { message: 'A trip with this name already exists' });
        return;
      }

      // Validate date range
      if (!validateDateRange(data.start_date, data.end_date)) {
        editForm.setError('end_date', { message: 'End date must be after or equal to start date' });
        return;
      }

      const { error } = await supabase
        .from('trips')
        .update({
          name: data.name,
          start_date: data.start_date || null,
          end_date: data.end_date || null,
        })
        .eq('id', editingTrip.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Trip "${data.name}" updated successfully`,
      });

      setIsEditDialogOpen(false);
      setEditingTrip(null);
      editForm.reset();
      fetchTrips();
    } catch (error) {
      console.error('Error editing trip:', error);
      toast({
        title: "Error",
        description: "Failed to update trip",
        variant: "destructive",
      });
    }
  };

  // Delete trip
  const onDeleteTrip = async () => {
    if (!deletingTrip) return;

    try {
      // If reassigning, update all transactions first
      if (reassignToTripId && reassignToTripId !== 'null') {
        const { error: updateError } = await supabase
          .from('transactions')
          .update({ trip_id: reassignToTripId })
          .eq('trip_id', deletingTrip.id);

        if (updateError) throw updateError;
      } else {
        // Set transactions to null (no trip)
        const { error: updateError } = await supabase
          .from('transactions')
          .update({ trip_id: null })
          .eq('trip_id', deletingTrip.id);

        if (updateError) throw updateError;
      }

      // Now delete the trip
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', deletingTrip.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Trip "${deletingTrip.name}" deleted successfully`,
      });

      setIsDeleteDialogOpen(false);
      setDeletingTrip(null);
      setReassignToTripId(null);
      fetchTrips();
    } catch (error) {
      console.error('Error deleting trip:', error);
      toast({
        title: "Error",
        description: "Failed to delete trip",
        variant: "destructive",
      });
    }
  };

  // Open edit dialog
  const openEditDialog = (trip: Trip) => {
    setEditingTrip(trip);
    editForm.reset({
      name: trip.name,
      start_date: trip.start_date || '',
      end_date: trip.end_date || ''
    });
    setIsEditDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (trip: Trip) => {
    setDeletingTrip(trip);
    setReassignToTripId(null);
    setIsDeleteDialogOpen(true);
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Format date range for display
  const formatDateRange = (startDate: string | null, endDate: string | null) => {
    if (!startDate && !endDate) return 'No dates set';
    if (!startDate) return `Until ${formatDate(endDate)}`;
    if (!endDate) return `From ${formatDate(startDate)}`;
    if (startDate === endDate) return formatDate(startDate);
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-4">Loading trips...</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Travel & Trips ({trips.length})
        </CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Trip
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Trip</DialogTitle>
            </DialogHeader>
            <Form {...addForm}>
              <form onSubmit={addForm.handleSubmit(onAddTrip)} className="space-y-4">
                <FormField
                  control={addForm.control}
                  name="name"
                  rules={{ required: "Trip name is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trip Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Summer Vacation, Business Trip" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={addForm.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addForm.control}
                    name="end_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">Add Trip</Button>
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
        {trips.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MapPin className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>No trips found. Add your first trip to get started!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {trips.map((trip) => (
              <div key={trip.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <MapPin className="w-3 h-3 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{trip.name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>{formatDateRange(trip.start_date, trip.end_date)}</div>
                      <div>Used in {trip.transaction_count || 0} transactions</div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditDialog(trip)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openDeleteDialog(trip)}
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

      {/* Edit Trip Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Trip</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditTrip)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                rules={{ required: "Trip name is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trip Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">Update Trip</Button>
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
            <DialogTitle>Delete Trip</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Are you sure you want to delete the trip <strong>"{deletingTrip?.name}"</strong>?
            </p>
            {deletingTrip && deletingTrip.transaction_count > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Warning:</strong> This trip is used by {deletingTrip.transaction_count} transactions.
                </p>
                <p className="text-sm text-yellow-700 mt-2">
                  You can either reassign these transactions to another trip or leave them without a trip.
                </p>
                <div className="mt-3">
                  <Select value={reassignToTripId || 'null'} onValueChange={setReassignToTripId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Reassign transactions to..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="null">Leave without trip</SelectItem>
                      {trips
                        .filter(t => t.id !== deletingTrip.id)
                        .map(trip => (
                          <SelectItem key={trip.id} value={trip.id}>
                            {trip.name}
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
                onClick={onDeleteTrip}
                className="flex-1"
              >
                Delete Trip
              </Button>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default TripManagement;