import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useFinanceStore } from '@/stores/financeStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, TrendingUp, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Budgets() {
  const { budgets, addBudget, deleteBudget } = useFinanceStore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    limit: '',
    period: 'monthly' as 'monthly' | 'weekly',
    startDate: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || !formData.limit) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill in all required fields',
      });
      return;
    }

    addBudget({
      name: formData.name,
      category: formData.category,
      limit: parseFloat(formData.limit),
      period: formData.period,
      startDate: formData.startDate,
    });

    toast({
      title: 'Budget Created',
      description: `${formData.name} budget has been created successfully`,
    });

    setFormData({
      name: '',
      category: '',
      limit: '',
      period: 'monthly',
      startDate: new Date().toISOString().split('T')[0],
    });
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    deleteBudget(id);
    toast({
      title: 'Budget Deleted',
      description: `${name} has been removed`,
    });
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Budget Management</h1>
            <p className="text-muted-foreground mt-1">Track and manage your spending limits</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="h-4 w-4" />
                Create Budget
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Budget</DialogTitle>
                <DialogDescription>Set up a new spending limit for a category</DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Budget Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Groceries, Entertainment"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Housing">Housing</SelectItem>
                      <SelectItem value="Food">Food</SelectItem>
                      <SelectItem value="Transport">Transportation</SelectItem>
                      <SelectItem value="Entertainment">Entertainment</SelectItem>
                      <SelectItem value="Utilities">Utilities</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                      <SelectItem value="Shopping">Shopping</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="limit">Monthly Limit ($) *</Label>
                  <Input
                    id="limit"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="500.00"
                    value={formData.limit}
                    onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="period">Period</Label>
                  <Select
                    value={formData.period}
                    onValueChange={(value: 'monthly' | 'weekly') => setFormData({ ...formData, period: value })}
                  >
                    <SelectTrigger id="period">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Create Budget
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Overall Summary */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Overall Budget Summary</CardTitle>
            <CardDescription>Total spending across all budgets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-3xl font-bold">${totalSpent.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Budget</p>
                <p className="text-2xl font-semibold">${totalBudget.toFixed(2)}</p>
              </div>
            </div>
            <Progress value={overallPercentage} className="h-3" />
            <p className="text-sm text-muted-foreground">
              {overallPercentage.toFixed(1)}% of total budget used • ${(totalBudget - totalSpent).toFixed(2)} remaining
            </p>
          </CardContent>
        </Card>

        {/* Budget Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => {
            const percentage = (budget.spent / budget.limit) * 100;
            const isOverBudget = percentage > 100;
            const isNearLimit = percentage > 80 && percentage <= 100;
            const remaining = budget.limit - budget.spent;
            
            return (
              <Card 
                key={budget.id} 
                className={`shadow-md hover:shadow-lg transition-all ${
                  isOverBudget ? 'border-destructive' : isNearLimit ? 'border-accent' : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{budget.name}</CardTitle>
                      <CardDescription>{budget.category}</CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(budget.id, budget.name)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Spent</span>
                      <span className={`font-semibold ${isOverBudget ? 'text-destructive' : ''}`}>
                        ${budget.spent.toFixed(2)}
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(percentage, 100)} 
                      className={`h-2 ${
                        isOverBudget ? 'bg-destructive/20' : 
                        isNearLimit ? 'bg-accent/20' : ''
                      }`}
                    />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {percentage.toFixed(0)}% used
                      </span>
                      <span className="font-medium">
                        ${budget.limit.toFixed(2)} limit
                      </span>
                    </div>
                  </div>

                  <div className={`rounded-lg p-3 text-sm ${
                    isOverBudget ? 'bg-destructive/10 text-destructive' :
                    isNearLimit ? 'bg-accent/10 text-accent' :
                    'bg-success/10 text-success'
                  }`}>
                    <div className="flex items-center gap-2">
                      {isOverBudget ? (
                        <>
                          <AlertCircle className="h-4 w-4" />
                          <span className="font-medium">Over by ${Math.abs(remaining).toFixed(2)}</span>
                        </>
                      ) : isNearLimit ? (
                        <>
                          <AlertCircle className="h-4 w-4" />
                          <span className="font-medium">${remaining.toFixed(2)} remaining</span>
                        </>
                      ) : (
                        <>
                          <TrendingUp className="h-4 w-4" />
                          <span className="font-medium">${remaining.toFixed(2)} remaining</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                    <span className="capitalize">{budget.period}</span>
                    <span>Since {new Date(budget.startDate).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
