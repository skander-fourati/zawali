import { Button } from "@/components/ui/button";
import { Plus, Upload, BarChart3 } from "lucide-react";

interface DashboardHeaderProps {
  onUploadClick: () => void;
  onAddBalanceClick: () => void;
}

export function DashboardHeader({ onUploadClick, onAddBalanceClick }: DashboardHeaderProps) {
  return (
    <div className="bg-gradient-primary text-primary-foreground p-8 rounded-lg shadow-medium mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Financial Dashboard</h1>
          <p className="text-primary-foreground/80 text-lg">
            Track your expenses, revenue, and family balances
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="secondary" 
            onClick={onUploadClick}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Transactions
          </Button>
          
          <Button 
            variant="secondary"
            onClick={onAddBalanceClick}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Balance
          </Button>
        </div>
      </div>
    </div>
  );
}