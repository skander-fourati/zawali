import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tag, MapPin, Building, Users, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import CategoryManagement from "@/components/settings/CategoryManagement";
import TripManagement from "@/components/settings/TripManagement";
import AccountManagement from "@/components/settings/AccountManagement";
import FamilyMemberManagement from "@/components/settings/FamilyMemberManagement";

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
              <p className="text-muted-foreground">Manage categories, trips, accounts, and family members to better organize your transactions.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
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
          <TabsTrigger value="family" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Family
          </TabsTrigger>
        </TabsList>

        {/* Categories Tab */}
        <TabsContent value="categories" className="mt-6">
          <CategoryManagement />
        </TabsContent>

        {/* Trips Tab */}
        <TabsContent value="trips" className="mt-6">
          <TripManagement />
        </TabsContent>

        {/* Accounts Tab */}
        <TabsContent value="accounts" className="mt-6">
          <AccountManagement />
        </TabsContent>

        {/* Family Members Tab */}
        <TabsContent value="family" className="mt-6">
          <FamilyMemberManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ManageDataPage;