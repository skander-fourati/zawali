import { Button } from "@/components/ui/button";
import { Plus, LogOut } from "lucide-react"; // Removed Upload since we don't need it
import { useAuth } from "@/hooks/useAuth";
import { TransactionUploadButton } from "./TransactionUploadButton";

interface DashboardHeaderProps {
  onAddBalanceClick: () => void;
  onTransactionsUploaded?: () => void; // Optional callback for data refresh
}

export function DashboardHeader({ onAddBalanceClick, onTransactionsUploaded }: DashboardHeaderProps) {
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="bg-gradient-primary text-primary-foreground p-8 rounded-lg shadow-medium mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Financial Dashboard</h1>
          <p className="text-primary-foreground/80 text-lg">
            Welcome back, {user?.user_metadata?.display_name || user?.email}
          </p>
        </div>
        
        <div className="flex gap-3">
          {/* Replace the old upload button with the new component */}
          <TransactionUploadButton 
            onTransactionsUploaded={onTransactionsUploaded}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
          />
          
          <Button 
            variant="secondary"
            onClick={onAddBalanceClick}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Balance
          </Button>

          <Button 
            variant="secondary"
            onClick={handleSignOut}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}