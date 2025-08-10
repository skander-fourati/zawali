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
  account: {
    name: string;
  };
}

interface FamilyBalancesProps {
  balances: FamilyBalance[];
  recentTransactions: RecentTransaction[];
}

export function FamilyBalances({ balances, recentTransactions }: FamilyBalancesProps) {
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
    <Card className="bg-gradient-card shadow-soft border-0 h-fit">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Family Balances
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Family Member Balances */}
        {balances.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No family members found.</p>
            <p className="text-sm">Add family members in Settings → Manage Data → Family.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {balances.map((member) => {
              const balanceInfo = getBalanceDisplay(member.balance);
              const BalanceIcon = balanceInfo.icon;
              
              return (
                <div key={member.id} className="flex items-center justify-between p-4 rounded-lg bg-background/50 hover:bg-background/80 transition-colors border border-transparent hover:border-gray-200">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold border-2 border-white shadow-sm"
                      style={{ backgroundColor: member.color }}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    
                    <div>
                      <p className="font-medium text-base">{member.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge className={getStatusColor(member.status)}>
                          {member.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Last: {formatDate(member.lastTransaction)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {member.transactionCount} transactions
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`font-semibold text-base flex items-center gap-2 ${balanceInfo.color}`}>
                      <BalanceIcon className="h-5 w-5" />
                      {balanceInfo.text}
                    </div>
                    {member.balance !== 0 && (
                      <div className="text-sm text-muted-foreground mt-2 space-y-1">
                        <p>Received: {formatCurrency(member.totalReceived)}</p>
                        <p>Spent: {formatCurrency(member.totalGiven)}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Recent Family Transactions */}
        {recentTransactions.length > 0 && (
          <div className="border-t pt-6">
            <h4 className="font-semibold text-base text-foreground flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5" />
              Recent Family Transactions
            </h4>
            
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 rounded-md bg-background/40 hover:bg-background/60 transition-colors border border-transparent hover:border-gray-200">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                      style={{ backgroundColor: transaction.family_member.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{transaction.description}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="font-medium">{transaction.family_member.name}</span>
                        <span>•</span>
                        <span>{formatDate(transaction.date)}</span>
                        <span>•</span>
                        <span className="truncate">{transaction.account?.name || 'Unknown Account'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`text-sm font-semibold flex-shrink-0 ${
                    transaction.amount_gbp > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.amount_gbp > 0 ? '+' : ''}{formatCurrency(transaction.amount_gbp)}
                  </div>
                </div>
              ))}
            </div>
            
            {recentTransactions.length > 0 && (
              <div className="mt-4 pt-3 border-t text-center">
                <p className="text-sm text-muted-foreground">
                  Showing {recentTransactions.length} recent family transactions
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}