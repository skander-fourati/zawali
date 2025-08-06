import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, TrendingUp } from "lucide-react";

interface FamilyBalance {
  id: string;
  name: string;
  totalSent: number;
  lastTransaction: string;
  status: 'active' | 'inactive';
}

interface FamilyBalancesProps {
  balances: FamilyBalance[];
  onAddBalance: () => void;
}

export function FamilyBalances({ balances, onAddBalance }: FamilyBalancesProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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
          onClick={onAddBalance}
          className="hover:bg-primary hover:text-primary-foreground"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {balances.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No family balances tracked yet.</p>
            <p className="text-sm">Start tracking money sent from family members.</p>
          </div>
        ) : (
          balances.map((balance) => (
            <div key={balance.id} className="flex items-center justify-between p-4 rounded-lg bg-background/50 hover:bg-background/80 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold">
                  {balance.name.charAt(0).toUpperCase()}
                </div>
                
                <div>
                  <p className="font-medium">{balance.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      Last: {formatDate(balance.lastTransaction)}
                    </span>
                    <Badge 
                      variant={balance.status === 'active' ? 'default' : 'secondary'}
                      className={balance.status === 'active' ? 'bg-success text-success-foreground' : ''}
                    >
                      {balance.status}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-semibold text-success flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  {formatCurrency(balance.totalSent)}
                </div>
                <p className="text-xs text-muted-foreground">Total sent</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}