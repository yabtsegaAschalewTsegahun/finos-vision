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
import { useMemo, useEffect, useState } from 'react';
import { transactionApi, budgetApi, categoriesApi, paymentApi } from '@/services/api';

// Form components
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Dashboard() {
  const {
    budgets,
    transactions,
    categories,
    loading,
    error,
    fetchInitialData,
    addTransaction,
    createBudget
  } = useFinanceStore();

  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [isCreatingBudget, setIsCreatingBudget] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Form states
  const [transactionForm, setTransactionForm] = useState({
    category: '',
    amount: '',
    description: '',
    tx_ref: '',
    status: 'Success'
  });

  const [budgetForm, setBudgetForm] = useState({
    category: '',
    amount: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Reset forms when dialogs close
  const resetTransactionForm = () => {
    setTransactionForm({
      category: '',
      amount: '',
      description: '',
      tx_ref: '',
      status: 'Success'
    });
  };

  const resetBudgetForm = () => {
    setBudgetForm({
      category: '',
      amount: ''
    });
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transactionForm.category || !transactionForm.amount || !transactionForm.description) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await addTransaction({
        category: parseInt(transactionForm.category),
        amount: parseFloat(transactionForm.amount),
        description: transactionForm.description,
        tx_ref: transactionForm.tx_ref,
        status: transactionForm.status
      });
      
      setIsAddingTransaction(false);
      resetTransactionForm();
      alert('Transaction added successfully!');
      
      // Refresh data to show the new transaction
      fetchInitialData();
    } catch (err) {
      alert('Failed to add transaction.');
    }
  };

  const handleBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!budgetForm.category || !budgetForm.amount) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await createBudget({
        category: parseInt(budgetForm.category),
        amount: parseFloat(budgetForm.amount)
      });
      
      setIsCreatingBudget(false);
      resetBudgetForm();
      alert('Budget created successfully!');
      
      // Refresh data to show the new budget
      fetchInitialData();
    } catch (err) {
      alert('Failed to create budget.');
    }
  };

  const handleMakePayment = async () => {
    setIsProcessingPayment(true);
    try {
      const response = await paymentApi.makePayment();
      const { checkout_url } = response.data;
      
      if (checkout_url) {
        // Open the payment URL in a new tab
        window.open(checkout_url, '_blank');
        
      } else {
        alert('Network error.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to initiate payment. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePayBill = async (billId: string, billName: string) => {
    setIsProcessingPayment(true);
    try {
      const response = await paymentApi.makePayment();
      const { checkout_url } = response.data;
      
      if (checkout_url) {
        // Open the payment URL in a new tab
        window.open(checkout_url, '_blank');
        alert(`Payment initiated for ${billName}! Please complete the payment in the new tab.`);
      } else {
        alert('Failed to get payment URL.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to initiate payment. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Derive financial stats dynamically from store data
  const financialStats = useMemo(() => {
    const totalBudgetLimit = budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);

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
  }, [budgets, transactions, categories]);

  const monthlyData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const aggregated = months.slice(-6).map(monthName => {
      const monthIndex = months.indexOf(monthName);
      let income = 0;
      let expenses = 0;

      transactions.forEach(t => {
        const transactionDate = new Date(t.date);
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

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--destructive))', 'hsl(var(--muted))', 'hsl(var(--info))', 'hsl(var(--warning))'];

  const upcomingBills = useMemo(() => {
    return budgets
      .filter(b => (b.spent / b.amount) * 100 > 80)
      .sort((a, b) => (b.spent / b.amount) - (a.spent / a.amount))
      .slice(0, 3)
      .map(budget => ({
        id: budget.id,
        name: categories.find(c => c.id === budget.category)?.name || `Category ${budget.category}`,
        spent: budget.spent,
        limit: budget.amount,
        percentageUsed: (budget.spent / budget.amount) * 100,
      }));
  }, [budgets, categories]);

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
                    label={(entry: any) => `${entry.name}: $${(entry.value as number).toFixed(2)}`}
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
                    formatter={(value, name, props) => [`$${(value as number).toFixed(2)}`, name]}
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
              {/* Add Transaction Dialog */}
              <Dialog open={isAddingTransaction} onOpenChange={(open) => {
                setIsAddingTransaction(open);
                if (!open) resetTransactionForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="w-full justify-start gap-2" size="lg">
                    <Plus className="h-4 w-4" />
                    Add Transaction
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Transaction</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleTransactionSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="transaction-category">Category *</Label>
                      <Select 
                        value={transactionForm.category} 
                        onValueChange={(value) => setTransactionForm({...transactionForm, category: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name} ({category.type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="transaction-amount">Amount *</Label>
                      <Input
                        id="transaction-amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={transactionForm.amount}
                        onChange={(e) => setTransactionForm({...transactionForm, amount: e.target.value})}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="transaction-description">Description *</Label>
                      <Input
                        id="transaction-description"
                        placeholder="Transaction description"
                        value={transactionForm.description}
                        onChange={(e) => setTransactionForm({...transactionForm, description: e.target.value})}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="transaction-reference">Transaction Reference</Label>
                      <Input
                        id="transaction-reference"
                        placeholder="Optional reference"
                        value={transactionForm.tx_ref}
                        onChange={(e) => setTransactionForm({...transactionForm, tx_ref: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="transaction-status">Status</Label>
                      <Select 
                        value={transactionForm.status} 
                        onValueChange={(value) => setTransactionForm({...transactionForm, status: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Success">Success</SelectItem>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Failed">Failed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsAddingTransaction(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        Add Transaction
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Create Budget Dialog */}
              <Dialog open={isCreatingBudget} onOpenChange={(open) => {
                setIsCreatingBudget(open);
                if (!open) resetBudgetForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="w-full justify-start gap-2" variant="secondary" size="lg">
                    <Plus className="h-4 w-4" />
                    Create Budget
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Budget</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleBudgetSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="budget-category">Category *</Label>
                      <Select 
                        value={budgetForm.category} 
                        onValueChange={(value) => setBudgetForm({...budgetForm, category: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.filter(cat => cat.type === 'expense').map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="budget-amount">Budget Amount *</Label>
                      <Input
                        id="budget-amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={budgetForm.amount}
                        onChange={(e) => setBudgetForm({...budgetForm, amount: e.target.value})}
                        required
                      />
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsCreatingBudget(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        Create Budget
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Pay Bill Button */}
              <Button 
                className="w-full justify-start gap-2" 
                variant="outline" 
                size="lg" 
                onClick={handleMakePayment}
                disabled={isProcessingPayment}
              >
                <DollarSign className="h-4 w-4" />
                {isProcessingPayment ? 'Processing...' : 'Pay Bill'}
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
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mt-1 w-full text-left justify-start"
                        onClick={() => handlePayBill(String(bill.id), bill.name)}
                        disabled={isProcessingPayment}
                      >
                        {isProcessingPayment ? 'Processing...' : 'Pay Now'}
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