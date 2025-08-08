import { Button } from "@/components/ui/button";
import { Plus, Settings, LogOut, Database, User, CreditCard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { TransactionUploadButton } from "./TransactionUploadButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardHeaderProps {
  onAddTransactionClick: () => void;
  onTransactionsUploaded?: () => void;
}

export function DashboardHeader({ onAddTransactionClick, onTransactionsUploaded }: DashboardHeaderProps) {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
  };

  const handleManageData = () => {
    navigate('/manage-data');
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
          <TransactionUploadButton 
            onTransactionsUploaded={onTransactionsUploaded}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
          />
          
          <Button 
            variant="secondary"
            onClick={onAddTransactionClick}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>

          {/* Settings Dropdown - replaces the old Sign Out button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="secondary"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleManageData} className="cursor-pointer">
                <Database className="mr-2 h-4 w-4" />
                Manage Data
              </DropdownMenuItem>
              
              {/* Future features - grayed out */}
              <DropdownMenuItem disabled className="opacity-50">
                <User className="mr-2 h-4 w-4" />
                Account Settings
                <span className="ml-auto text-xs text-muted-foreground">Soon</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem disabled className="opacity-50">
                <CreditCard className="mr-2 h-4 w-4" />
                Billing
                <span className="ml-auto text-xs text-muted-foreground">Soon</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}