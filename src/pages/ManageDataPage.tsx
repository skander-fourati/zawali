import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Edit, Trash2, Tag, MapPin, Building } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const ManageDataPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("categories");

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

      {/* Tabs for different data types */}
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
                Transaction Categories
              </CardTitle>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Category
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Tag className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Category Management</h3>
                <p className="mb-4">Create and organize categories to better track your spending.</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                  <p><strong>Coming Soon:</strong></p>
                  <p>• Create custom categories (Food, Transport, Entertainment, etc.)</p>
                  <p>• Set category colors and icons</p>
                  <p>• View spending by category</p>
                  <p>• Merge or delete unused categories</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trips Tab */}
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

        {/* Accounts Tab */}
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
    </div>
  );
};

export default ManageDataPage;