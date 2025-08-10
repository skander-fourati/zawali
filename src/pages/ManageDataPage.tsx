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

// Zawali Header Component
const ZawaliManageHeader = ({ user }: { user: any }) => (
  <div className="mb-6">
    <div className="flex items-center gap-4 mb-4">
      <div className="text-4xl zawali-float">⚙️</div>
      <div>
        <h1 className="text-3xl font-bold text-zawali-gradient">
          Organize Your Financial Chaos
        </h1>
        <p className="text-muted-foreground">
          Because even broke people need organization
        </p>
      </div>
    </div>
  </div>
);

const ZawaliWelcomeCard = ({ user }: { user: any }) => (
  <Card className="mb-6 bg-card border-border">
    <CardContent className="p-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white font-semibold text-lg zawali-bounce">
          {user?.user_metadata?.display_name?.charAt(0)?.toUpperCase() ||
            user?.email?.charAt(0)?.toUpperCase() ||
            "Z"}
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-foreground">
            Welcome to Data Management Central
          </h2>
          <p className="text-muted-foreground text-sm">
            Manage categories, trips, accounts, and family members to better
            organize your transactions.
            <span className="block text-xs italic mt-1">
              "A place for everything, and everything in its place" - said no
              zawali user ever 😅
            </span>
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Zawali Tab Icons and Labels
const getTabConfig = (tabId: string) => {
  const configs = {
    categories: {
      icon: Tag,
      emoji: "🏷️",
      label: "Categories",
      description: "Where money goes to get labeled",
    },
    trips: {
      icon: MapPin,
      emoji: "✈️",
      label: "Trips",
      description: "Adventures that cost money",
    },
    accounts: {
      icon: Building,
      emoji: "🏦",
      label: "Accounts",
      description: "The containers of your wealth (or debt)",
    },
    family: {
      icon: Users,
      emoji: "👨‍👩‍👧‍👦",
      label: "Family",
      description: "The people who share your financial struggles",
    },
  };
  return configs[tabId as keyof typeof configs];
};

const ManageDataPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("categories");

  // Zawali loading state
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 zawali-float">⚙️</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            Loading your organizational tools...
          </p>
        </div>
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
            onClick={() => navigate("/")}
            className="flex items-center gap-2 hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Zawali Header */}
      <ZawaliManageHeader user={user} />

      {/* Welcome Card */}
      <ZawaliWelcomeCard user={user} />

      {/* Enhanced Tabs with personality */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 bg-card h-auto">
          {["categories", "trips", "accounts", "family"].map((tabId) => {
            const config = getTabConfig(tabId);
            const IconComponent = config.icon;

            return (
              <TabsTrigger
                key={tabId}
                value={tabId}
                className="flex flex-col items-center gap-2 p-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-2">
                  <IconComponent className="h-4 w-4" />
                  <span className="text-xl">{config.emoji}</span>
                </div>
                <div className="text-center">
                  <div className="font-medium text-sm">{config.label}</div>
                  <div className="text-xs opacity-70 hidden sm:block">
                    {config.description}
                  </div>
                </div>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Tab Content with enhanced styling */}
        <div className="mt-6">
          {/* Categories Tab */}
          <TabsContent value="categories" className="mt-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
                <span>🏷️</span>
                <span>Transaction Categories</span>
              </h2>
              <p className="text-muted-foreground text-sm">
                Organize your transactions by category. Because "miscellaneous"
                isn't a financial strategy.
              </p>
            </div>
            <CategoryManagement />
          </TabsContent>

          {/* Trips Tab */}
          <TabsContent value="trips" className="mt-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
                <span>✈️</span>
                <span>Trip Management</span>
              </h2>
              <p className="text-muted-foreground text-sm">
                Track expenses by trip. Perfect for seeing exactly how much that
                "quick weekend getaway" actually cost.
              </p>
            </div>
            <TripManagement />
          </TabsContent>

          {/* Accounts Tab */}
          <TabsContent value="accounts" className="mt-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
                <span>🏦</span>
                <span>Account Management</span>
              </h2>
              <p className="text-muted-foreground text-sm">
                Manage your financial accounts. From checking to savings to
                "that credit card I forgot about."
              </p>
            </div>
            <AccountManagement />
          </TabsContent>

          {/* Family Members Tab */}
          <TabsContent value="family" className="mt-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
                <span>👨‍👩‍👧‍👦</span>
                <span>Family Member Management</span>
              </h2>
              <p className="text-muted-foreground text-sm">
                Track family member transactions. Because sharing financial
                responsibility is what family is all about.
              </p>
            </div>
            <FamilyMemberManagement />
          </TabsContent>
        </div>
      </Tabs>

      {/* Zawali Tips Section */}
      <Card className="mt-8 bg-card border-border">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <span>💡</span>
            <span>Zawali Organization Tips</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-lg">🏷️</span>
                <div>
                  <h4 className="font-medium text-foreground">
                    Category Colors
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Use colors to make your charts more visually appealing.
                    Because if you're going to be broke, at least make it look
                    pretty.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">✈️</span>
                <div>
                  <h4 className="font-medium text-foreground">Trip Tracking</h4>
                  <p className="text-sm text-muted-foreground">
                    Create trips to track vacation expenses. Great for realizing
                    you spent more on coffee than accommodation.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-lg">🏦</span>
                <div>
                  <h4 className="font-medium text-foreground">Account Types</h4>
                  <p className="text-sm text-muted-foreground">
                    Organize by account type: checking, savings, credit,
                    investment. Yes, that empty savings account counts.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">👨‍👩‍👧‍👦</span>
                <div>
                  <h4 className="font-medium text-foreground">Family Colors</h4>
                  <p className="text-sm text-muted-foreground">
                    Assign colors to family members for easy identification.
                    Perfect for tracking who spent what on "essential" items.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Zawali Footer Quote */}
      <div className="text-center py-6 mt-6">
        <div className="text-3xl mb-2 zawali-float">📊</div>
        <p className="text-muted-foreground italic text-sm">
          "Organization is the key to financial success... or at least to
          understanding your financial failures." 💭
        </p>
      </div>
    </div>
  );
};

export default ManageDataPage;
