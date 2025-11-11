import { Layout } from '@/components/Layout';
import { useFinanceStore } from '@/stores/financeStore';
import { useEffect } from 'react';

export default function Budgets() {
  const { budgets, categories, fetchInitialData, loading } = useFinanceStore();

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  if (loading) {
    return <Layout><div className="text-center py-10">Loading budgets...</div></Layout>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Budgets</h1>
          <p className="text-muted-foreground mt-1">Manage your spending limits</p>
        </div>
        
        <div className="grid gap-4">
          {budgets.map((budget) => {
            const category = categories.find(c => c.id === budget.category);
            const percentage = (budget.spent / budget.amount) * 100;
            
            return (
              <div key={budget.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">{category?.name || 'Unknown Category'}</h3>
                  <span>${budget.spent} / ${budget.amount}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2 mt-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  ></div>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {percentage.toFixed(1)}% used
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}