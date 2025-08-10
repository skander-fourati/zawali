import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { TransactionUploadButton } from "./TransactionUploadButton";

interface DashboardHeaderProps {
  onAddTransactionClick: () => void;
  onTransactionsUploaded?: () => void;
}

export function DashboardHeader({ onAddTransactionClick, onTransactionsUploaded }: DashboardHeaderProps) {
  const { user } = useAuth();

  const getZawaliGreeting = () => {
    const greetings = [
      "Welcome back to the broke life",
      "Your zawali kingdom awaits",
      "Ready to count those zeros?",
      "Welcome to your financial reality check",
      "Broke but not broken (yet)",
      "Time for another poverty inspection",
      "Your wallet's worst nightmare is here",
      "Breaking: Local person still broke",
      "Welcome to the struggle bus terminal",
      "Certified brokie reporting for duty",
      "Your empty bank account awaits",
      "Professional pauper at your service",
      "Where dreams go to die (financially)",
      "Welcome to the no-money zone",
      "Your financial disaster starts here",
      "Broke and proud (sort of)",
      "Time to face your spending sins",
      "Welcome to poverty headquarters",
      "Your overdraft's favorite place",
      "Where savings go to disappear",
      "Captain of the broke ship reporting",
      "Welcome to the zero-balance club",
      "Your debt's favorite hangout spot",
      "Professional money-waster dashboard",
      "Where financial hopes come to cry",
      "Welcome to the struggle academy",
      "Your bank account's villain origin story",
      "Broke but make it aesthetic",
      "Welcome to the penny-pinching palace",
      "Your financial chaos command center"
    ];
    
    // Truly random selection on every render for maximum surprise
    return greetings[Math.floor(Math.random() * greetings.length)];
  };

  return (
    <div className="bg-gradient-primary text-primary-foreground p-8 rounded-lg shadow-medium mb-8 zawali-slide-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          <div>
            <h1 className="text-4xl font-bold mb-2 zawali-bounce">
              <span className="text-zawali-gradient">The Zawali's</span> Dashboard
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-2xl zawali-float">💸</span>
              <p className="text-primary-foreground/90 text-lg italic">
                {getZawaliGreeting()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 min-w-fit">
          <TransactionUploadButton 
            onTransactionsUploaded={onTransactionsUploaded}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 transition-all duration-200 hover:scale-105"
          />
          
          <Button 
            variant="secondary"
            onClick={onAddTransactionClick}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 transition-all duration-200 hover:scale-105 zawali-bounce"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </div>
      </div>
    </div>
  );
}