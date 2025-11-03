import { Layout } from '@/components/Layout';
import { useFinanceStore } from '@/stores/financeStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Wallet, 
  AlertCircle,
  Plus
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useMemo } from 'react';

export default function Dashboard() {
  const { budgets, transactions } = useFinanceStore();

  const financialStats = useMemo(() => {
    const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
    const budgetHealth = totalBudget > 0 ? ((totalBudget - totalSpent) / totalBudget) * 100 : 0;
    
    return {
      balance,
      totalIncome,
      totalExpenses,
      savingsRate,
      budgetHealth,
      totalBudget,
      totalSpent,
    };
  }, [budgets, transactions]);

  // Chart data
  const monthlyData = [
    { month: 'May', income: 3200, expenses: 2800 },
    { month: 'Jun', income: 3400, expenses: 2900 },
    { month: 'Jul', income: 3600, expenses: 3100 },
    { month: 'Aug', income: 3500, expenses: 2850 },
    { month: 'Sep', income: 3700, expenses: 3000 },
    { month: 'Oct', income: 3800, expenses: 3200 },
  ];

  const categoryData = budgets.map(b => ({
    name: b.category,
    value: b.spent,
  }));

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--destructive))', 'hsl(var(--muted))'];

  const upcomingBills = budgets
    .filter(b => b.spent >= b.limit * 0.8)
    .slice(0, 3);

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financial Dashboard</h1>
          <p className="text-muted-foreground mt-1">Track your spending, budgets, and financial health</p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${financialStats.balance.toFixed(2)}</div>
              <p className={`text-xs ${financialStats.balance >= 0 ? 'text-success' : 'text-destructive'} flex items-center gap-1 mt-1`}>
                {financialStats.balance >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {financialStats.savingsRate.toFixed(1)}% savings rate
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">${financialStats.totalIncome.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">${financialStats.totalExpenses.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget Health</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.max(0, financialStats.budgetHealth).toFixed(0)}%</div>
              <Progress value={Math.max(0, financialStats.budgetHealth)} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Income vs Expenses Trend */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Income vs Expenses</CardTitle>
              <CardDescription>Last 6 months trend</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="income" 
                    stroke="hsl(var(--success))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--success))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke="hsl(var(--destructive))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--destructive))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Spending by Category */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
              <CardDescription>Current month breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: $${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Budget Overview & Quick Actions */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Budget Progress */}
          <Card className="lg:col-span-2 shadow-md">
            <CardHeader>
              <CardTitle>Budget Overview</CardTitle>
              <CardDescription>Your spending limits and current usage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {budgets.slice(0, 4).map((budget) => {
                  const percentage = (budget.spent / budget.limit) * 100;
                  const isOverBudget = percentage > 100;
                  const isNearLimit = percentage > 80;
                  
                  return (
                    <div key={budget.id} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{budget.name}</span>
                          {isOverBudget && (
                            <AlertCircle className="h-3 w-3 text-destructive" />
                          )}
                        </div>
                        <span className="text-muted-foreground">
                          ${budget.spent.toFixed(0)} / ${budget.limit.toFixed(0)}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(percentage, 100)} 
                        className={isOverBudget ? 'bg-destructive/20' : isNearLimit ? 'bg-accent/20' : ''}
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your finances</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start gap-2" size="lg">
                <Plus className="h-4 w-4" />
                Add Transaction
              </Button>
              <Button className="w-full justify-start gap-2" variant="secondary" size="lg">
                <Plus className="h-4 w-4" />
                Create Budget
              </Button>
              <Button className="w-full justify-start gap-2" variant="outline" size="lg">
                <DollarSign className="h-4 w-4" />
                Pay Bill
              </Button>
              
              {upcomingBills.length > 0 && (
                <div className="mt-6 space-y-2">
                  <h4 className="text-sm font-medium">Attention Needed</h4>
                  {upcomingBills.map((bill) => (
                    <div key={bill.id} className="rounded-lg bg-accent/10 p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{bill.name}</span>
                        <span className="text-xs text-accent">
                          {((bill.spent / bill.limit) * 100).toFixed(0)}% used
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
