import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownLeft, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const navigate = useNavigate();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Food': 'bg-orange-100 text-orange-800',
      'Transportation': 'bg-blue-100 text-blue-800',
      'Entertainment': 'bg-purple-100 text-purple-800',
      'Utilities': 'bg-yellow-100 text-yellow-800',
      'Shopping': 'bg-pink-100 text-pink-800',
      'Health': 'bg-green-100 text-green-800',
      'Income': 'bg-emerald-100 text-emerald-800',
      'Investment': 'bg-indigo-100 text-indigo-800',
      'Groceries': 'bg-lime-100 text-lime-800',
      'Dining': 'bg-red-100 text-red-800',
      'Bills': 'bg-slate-100 text-slate-800',
      'Extras': 'bg-violet-100 text-violet-800',
      'Personal Care': 'bg-cyan-100 text-cyan-800',
      'Commute': 'bg-teal-100 text-teal-800',
    };
    
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const handleViewAll = () => {
    navigate('/transactions');
  };

  return (
    <Card className="bg-gradient-card shadow-soft border-0 h-fit">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Recent Transactions</CardTitle>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleViewAll}
          className="flex items-center gap-2"
        >
          <Eye className="h-4 w-4" />
          View All
        </Button>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ArrowUpRight className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No transactions yet. Upload your transaction file to get started!</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors border border-transparent hover:border-gray-200">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${transaction.type === 'income' ? 'bg-success/10' : 'bg-destructive/10'}`}>
                    {transaction.type === 'income' ? (
                      <ArrowUpRight className="h-4 w-4 text-success" />
                    ) : (
                      <ArrowDownLeft className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{transaction.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(transaction.date)}
                      </span>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getCategoryColor(transaction.category)}`}
                      >
                        {transaction.category}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className={`font-semibold text-sm ${transaction.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                  {transaction.type === 'income' ? '+' : ''}{formatCurrency(transaction.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {transactions.length > 0 && (
          <div className="mt-4 pt-4 border-t text-center">
            <p className="text-sm text-muted-foreground">
              Showing {transactions.length} recent transactions
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}