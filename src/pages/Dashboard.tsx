// src/pages/Dashboard.tsx
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
import { useMemo, useEffect, useState } from 'react'; // Added useEffect and useState
import { transactionApi, budgetApi, categoriesApi } from '@/services/api'; // Ensure all needed APIs are imported

export default function Dashboard() {
  const {
    budgets,
    transactions,
    categories, // Access categories from the store
    loading,
    error,
    fetchInitialData, // Action to fetch all initial data
    addTransaction,   // Action to add transaction
    createBudget      // Action to create budget
  } = useFinanceStore();

  const [isAddingTransaction, setIsAddingTransaction] = useState(false); // State for modal/form visibility
  const [isCreatingBudget, setIsCreatingBudget] = useState(false); // State for modal/form visibility

  // Fetch initial data when the component mounts
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Derive financial stats dynamically from store data
  const financialStats = useMemo(() => {
    const totalBudgetLimit = budgets.reduce((sum, b) => sum + b.amount, 0); // 'amount' is the limit
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0); // 'spent' is calculated in store or backend

    const totalIncome = transactions
      .filter(t => {
        const category = categories.find(c => c.id === t.category);
        return category && category.type === 'income';
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter(t => {
        const category = categories.find(c => c.id === t.category);
        return category && category.type === 'expense';
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
    const budgetHealth = totalBudgetLimit > 0 ? ((totalBudgetLimit - totalSpent) / totalBudgetLimit) * 100 : 0;

    return {
      balance,
      totalIncome,
      totalExpenses,
      savingsRate,
      budgetHealth,
      totalBudgetLimit,
      totalSpent,
    };
  }, [budgets, transactions, categories]); // Depend on categories too

  // Prepare data for charts dynamically
  const monthlyData = useMemo(() => {
    // This is a more complex aggregation. For a real app, you'd likely group transactions by month.
    // For demonstration, let's keep the mock data for now or implement a basic aggregation.
    // A robust solution would involve a helper function to group and sum.
    // Example (simplified, assuming transactions have a 'date' field you can parse):
    const currentYear = new Date().getFullYear();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const aggregated = months.slice(-6).map(monthName => { // Last 6 months
      const monthIndex = months.indexOf(monthName);
      let income = 0;
      let expenses = 0;

      transactions.forEach(t => {
        const transactionDate = new Date(t.date); // Assuming t.date is ISO string
        if (transactionDate.getFullYear() === currentYear && transactionDate.getMonth() === monthIndex) {
          const category = categories.find(c => c.id === t.category);
          if (category) {
            if (category.type === 'income') {
              income += t.amount;
            } else if (category.type === 'expense') {
              expenses += t.amount;
            }
          }
        }
      });
      return { month: monthName, income, expenses };
    });
    // If no dynamic data, fall back to static or refine aggregation
    return aggregated.length > 0 ? aggregated : [
      { month: 'May', income: 3200, expenses: 2800 },
      { month: 'Jun', income: 3400, expenses: 2900 },
      { month: 'Jul', income: 3600, expenses: 3100 },
      { month: 'Aug', income: 3500, expenses: 2850 },
      { month: 'Sep', income: 3700, expenses: 3000 },
      { month: 'Oct', income: 3800, expenses: 3200 },
    ];
  }, [transactions, categories]);

  const categoryData = useMemo(() => {
    const expenseCategories = categories.filter(cat => cat.type === 'expense');
    const spendingMap = new Map<string, number>();

    transactions
      .filter(t => {
        const category = categories.find(c => c.id === t.category);
        return category && category.type === 'expense';
      })
      .forEach(t => {
        const categoryName = categories.find(c => c.id === t.category)?.name || `Unknown Category ${t.category}`;
        spendingMap.set(categoryName, (spendingMap.get(categoryName) || 0) + t.amount);
      });

    return Array.from(spendingMap.entries()).map(([name, value]) => ({ name, value }));
  }, [transactions, categories]);


  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--destructive))', 'hsl(var(--muted))', 'hsl(var(--info))', 'hsl(var(--warning))']; // Added more colors

  const upcomingBills = useMemo(() => {
    // Filter budgets that are near or over their limit (spent >= 80% of limit)
    // and sort them to show the most critical ones first.
    return budgets
      .filter(b => (b.spent / b.amount) * 100 > 80)
      .sort((a, b) => (b.spent / b.amount) - (a.spent / a.amount)) // Sort by highest percentage spent
      .slice(0, 3) // Show top 3
      .map(budget => ({
        id: budget.id,
        name: categories.find(c => c.id === budget.category)?.name || `Category ${budget.category}`,
        spent: budget.spent,
        limit: budget.amount,
        percentageUsed: (budget.spent / budget.amount) * 100,
      }));
  }, [budgets, categories]);

  const handleAddTransactionClick = async () => {
    // In a real app, this would open a modal with a form
    // For demonstration, let's use some mock data and the store action
    const mockTransactionData = {
      category: categories.find(c => c.name === 'Food')?.id || 4, // Example: Find Food category ID
      amount: Math.floor(Math.random() * 100) + 10, // Random amount
      description: 'Dynamic transaction',
      tx_ref: `DYN-TXN-${Date.now()}`,
      status: 'Success',
    };

    try {
      await addTransaction(mockTransactionData);
      alert('Transaction added successfully!');
    } catch (err) {
      alert('Failed to add transaction.');
    }
  };

  const handleCreateBudgetClick = async () => {
    // In a real app, this would open a modal with a form
    // For demonstration, let's use some mock data and the store action
    const mockBudgetData = {
      category: categories.find(c => c.name === 'Entertainment')?.id || 3, // Example: Find Entertainment category ID
      amount: Math.floor(Math.random() * 500) + 100, // Random budget limit
    };

    try {
      await createBudget(mockBudgetData);
      alert('Budget created successfully!');
    } catch (err) {
      alert('Failed to create budget.');
    }
  };

  // Display loading or error states
  if (loading) return <Layout><div className="text-center py-10">Loading financial data...</div></Layout>;
  if (error) return <Layout><div className="text-center py-10 text-destructive">Error: {error}</div></Layout>;

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
              <p className={`text-xs ${financialStats.balance >= 0 ? 'text-green-500' : 'text-red-500'} flex items-center gap-1 mt-1`}>
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
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">${financialStats.totalIncome.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">${financialStats.totalExpenses.toFixed(2)}</div>
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
                    label={(entry) => `${entry.name}: $${entry.value.toFixed(2)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value, name, props) => [`$${(value as number).toFixed(2)}`, name]} // Format tooltip
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
                {budgets.slice(0, 4).map((budget) => { // Displaying up to 4 budgets
                  const percentage = (budget.spent / budget.amount) * 100;
                  const isOverBudget = percentage > 100;
                  const isNearLimit = percentage > 80;
                  const categoryName = categories.find(c => c.id === budget.category)?.name || `Category ${budget.category}`;

                  return (
                    <div key={budget.id} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{categoryName}</span>
                          {isOverBudget && (
                            <AlertCircle className="h-3 w-3 text-destructive" />
                          )}
                        </div>
                        <span className="text-muted-foreground">
                          ${budget.spent.toFixed(0)} / ${budget.amount.toFixed(0)}
                        </span>
                      </div>
                      <Progress
                        value={Math.min(percentage, 100)}
                        className={isOverBudget ? 'bg-destructive/20' : isNearLimit ? 'bg-accent/20' : ''}
                      />
                    </div>
                  );
                })}
                 {budgets.length === 0 && (
                  <p className="text-muted-foreground text-sm">No budgets set. Create one to start tracking!</p>
                )}
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
              <Button className="w-full justify-start gap-2" size="lg" onClick={handleAddTransactionClick}>
                <Plus className="h-4 w-4" />
                Add Transaction
              </Button>
              <Button className="w-full justify-start gap-2" variant="secondary" size="lg" onClick={handleCreateBudgetClick}>
                <Plus className="h-4 w-4" />
                Create Budget
              </Button>
              <Button className="w-full justify-start gap-2" variant="outline" size="lg" onClick={() => paymentApi.makePayment().then(res => window.open(res.data.checkout_url, '_blank')).catch(console.error)}>
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
                          {bill.percentageUsed.toFixed(0)}% used
                        </span>
                      </div>
                       <Button variant="ghost" size="sm" className="mt-1 w-full text-left justify-start">
                        Pay Now
                      </Button>
                    </div>
                  ))}
                </div>
              )}
               {upcomingBills.length === 0 && (
                  <div className="mt-6 text-muted-foreground text-sm">No urgent bills. Good job!</div>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}