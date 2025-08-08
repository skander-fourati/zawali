import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, TrendingUp, TrendingDown, Calendar, ArrowRight } from "lucide-react";

interface FamilyBalance {
  id: string;
  name: string;
  color: string;
  status: 'active' | 'settled' | 'archived';
  balance: number;
  totalReceived: number;
  totalGiven: number;
  lastTransaction: string | null;
  transactionCount: number;
}

interface RecentTransaction {
  id: string;
  date: string;
  description: string;
  amount_gbp: number;
  family_member: {
    name: string;
    color: string;
  };
}

interface FamilyBalancesProps {
  balances: FamilyBalance[];
  recentTransactions: RecentTransaction[];
  onAddTransaction: () => void;
}

export function FamilyBalances({ balances, recentTransactions, onAddTransaction }: FamilyBalancesProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-GB', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getBalanceDisplay = (balance: number) => {
    if (balance > 0) {
      return {
        text: `You owe ${formatCurrency(balance)}`,
        color: 'text-red-600',
        icon: TrendingDown,
        bgColor: 'bg-red-50'
      };
    } else if (balance < 0) {
      return {
        text: `They owe ${formatCurrency(balance)}`,
        color: 'text-green-600',
        icon: TrendingUp,
        bgColor: 'bg-green-50'
      };
    } else {
      return {
        text: 'Settled',
        color: 'text-gray-600',
        icon: Calendar,
        bgColor: 'bg-gray-50'
      };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'settled': return 'bg-blue-100 text-blue-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="bg-gradient-card shadow-soft border-0">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Family Balances
        </CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onAddTransaction}
          className="hover:bg-primary hover:text-primary-foreground"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Transaction
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Family Member Balances */}
        {balances.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No family members found.</p>
            <p className="text-sm">Add family members in Settings → Manage Data → Family.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {balances.map((member) => {
              const balanceInfo = getBalanceDisplay(member.balance);
              const BalanceIcon = balanceInfo.icon;
              
              return (
                <div key={member.id} className="flex items-center justify-between p-4 rounded-lg bg-background/50 hover:bg-background/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold border-2 border-white shadow-sm"
                      style={{ backgroundColor: member.color }}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{member.name}</p>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getStatusColor(member.status)}`}
                        >
                          {member.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          Last: {formatDate(member.lastTransaction)}
                        </span>
                        {member.transactionCount > 0 && (
                          <span className="text-xs text-muted-foreground">
                            • {member.transactionCount} transactions
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`font-semibold flex items-center gap-1 ${balanceInfo.color}`}>
                      <BalanceIcon className="h-4 w-4" />
                      {balanceInfo.text}
                    </div>
                    {member.balance !== 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Received: {formatCurrency(member.totalReceived)} | Given: {formatCurrency(member.totalGiven)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Recent Family Transactions */}
        {recentTransactions.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Recent Family Transactions
              </h4>
              <Button variant="ghost" size="sm" className="text-xs">
                View All
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
            
            <div className="space-y-2">
              {recentTransactions.slice(0, 3).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 rounded-md bg-background/30 hover:bg-background/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: transaction.family_member.color }}
                    />
                    <div>
                      <p className="text-sm font-medium">{transaction.description}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {transaction.family_member.name}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(transaction.date)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`text-sm font-medium ${
                    transaction.amount_gbp > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.amount_gbp > 0 ? '+' : ''}{formatCurrency(transaction.amount_gbp)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}