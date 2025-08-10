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
  category: {
    id: string;
    name: string;
    color: string;
  } | null;
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

  const getCategoryName = (category: Transaction['category']) => {
    return category?.name || 'Uncategorized';
  };

  const getCategoryColor = (category: Transaction['category']) => {
    return category?.color || '#6b7280';
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
              <div key={transaction.id} className="flex items-center gap-3 p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors border border-transparent hover:border-border/50">
                <div className={`p-2 rounded-full flex-shrink-0 border ${
                  transaction.type === 'income' 
                    ? 'bg-success/20 border-success/40' 
                    : 'bg-destructive/20 border-destructive/40'
                }`}>
                  {transaction.type === 'income' ? (
                    <ArrowUpRight className="h-4 w-4 text-success" />
                  ) : (
                    <ArrowDownLeft className="h-4 w-4 text-destructive" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="font-medium text-sm truncate" title={transaction.description}>
                    {transaction.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1 overflow-hidden">
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatDate(transaction.date)}
                    </span>
                    <Badge 
                      variant="secondary" 
                      className="text-xs flex-shrink-0 border font-medium"
                      style={{
                        backgroundColor: `${getCategoryColor(transaction.category)}20`,
                        borderColor: getCategoryColor(transaction.category),
                        color: getCategoryColor(transaction.category)
                      }}
                    >
                      {getCategoryName(transaction.category)}
                    </Badge>
                  </div>
                </div>
                
                <div className={`font-semibold text-sm text-right flex-shrink-0 min-w-[80px] ${transaction.type === 'income' ? 'text-success' : 'text-destructive'}`}>
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