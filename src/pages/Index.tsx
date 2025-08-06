import React, { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MetricsCards } from "@/components/dashboard/MetricsCards";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { FamilyBalances } from "@/components/dashboard/FamilyBalances";
import { useToast } from "@/hooks/use-toast";

// Sample data - in real app this would come from backend
const sampleTransactions = [
  {
    id: '1',
    date: '2024-01-15',
    description: 'Grocery Store',
    amount: 85.50,
    category: 'Food',
    type: 'expense' as const,
  },
  {
    id: '2',
    date: '2024-01-14',
    description: 'Salary Deposit',
    amount: 3500.00,
    category: 'Income',
    type: 'income' as const,
  },
  {
    id: '3',
    date: '2024-01-13',
    description: 'Gas Station',
    amount: 45.20,
    category: 'Transportation',
    type: 'expense' as const,
  },
  {
    id: '4',
    date: '2024-01-12',
    description: 'Netflix Subscription',
    amount: 15.99,
    category: 'Entertainment',
    type: 'expense' as const,
  },
  {
    id: '5',
    date: '2024-01-11',
    description: 'Investment Transfer',
    amount: 500.00,
    category: 'Investment',
    type: 'expense' as const,
  },
];

const sampleFamilyBalances = [
  {
    id: '1',
    name: 'Mom',
    totalSent: 2500.00,
    lastTransaction: '2024-01-10',
    status: 'active' as const,
  },
  {
    id: '2',
    name: 'Dad',
    totalSent: 1800.00,
    lastTransaction: '2024-01-05',
    status: 'active' as const,
  },
];

const Index = () => {
  const { toast } = useToast();
  const [transactions] = useState(sampleTransactions);
  const [familyBalances] = useState(sampleFamilyBalances);

  // Calculate metrics from sample data
  const totalBalance = 15750.00;
  const monthlyIncome = 3500.00;
  const monthlyExpenses = 1647.69;
  const investments = 8500.00;

  const handleUploadClick = () => {
    toast({
      title: "Upload Feature",
      description: "Connect to Supabase to enable file uploads and data persistence. Click the green Supabase button in the top-right.",
      duration: 5000,
    });
  };

  const handleAddBalanceClick = () => {
    toast({
      title: "Add Balance Feature", 
      description: "Connect to Supabase to store and manage family balances. Click the green Supabase button in the top-right.",
      duration: 5000,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl">
        <DashboardHeader 
          onUploadClick={handleUploadClick}
          onAddBalanceClick={handleAddBalanceClick}
        />
        
        <MetricsCards 
          totalBalance={totalBalance}
          monthlyIncome={monthlyIncome}
          monthlyExpenses={monthlyExpenses}
          investments={investments}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RecentTransactions transactions={transactions} />
          <FamilyBalances 
            balances={familyBalances}
            onAddBalance={handleAddBalanceClick}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;