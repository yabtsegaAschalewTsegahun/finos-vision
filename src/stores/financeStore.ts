// src/stores/financeStore.ts
import { create } from 'zustand';
import { budgetApi, transactionApi, categoriesApi } from '@/services/api'; // Import your APIs

// Define types for your data
interface Budget {
  id: number;
  user: string;
  category: number; // Storing category ID here
  amount: number; // This is the budget limit
  spent: number; // You'll need to calculate this or have it from the backend
  month: string;
  due_date: string | null;
  transaction: number | null;
}

interface Transaction {
  id: number;
  user: string;
  category: number; // Storing category ID here
  amount: number;
  description: string;
  tx_ref: string;
  status: string;
  date: string;
  created_at: string;
  type: 'income' | 'expense'; // You might need to derive this from category type
  paymentMethod?: string; // Optional payment method field
}

interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  priority: string | null;
}

interface FinanceState {
  budgets: Budget[];
  transactions: Transaction[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  fetchInitialData: () => Promise<void>;
  fetchBudgets: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  // Add actions for adding new data, which would also trigger a refresh
  addTransaction: (data: Parameters<typeof transactionApi.createTransaction>[0]) => Promise<void>;
  createBudget: (data: Parameters<typeof budgetApi.createBudget>[0]) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  budgets: [],
  transactions: [],
  categories: [],
  loading: false,
  error: null,

  // Fetches all necessary data at once (e.g., on app load)
  fetchInitialData: async () => {
    set({ loading: true, error: null });
    try {
      await Promise.all([get().fetchBudgets(), get().fetchTransactions(), get().fetchCategories()]);
      set({ loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message || 'Failed to fetch initial data' });
    }
  },

  fetchBudgets: async () => {
    set({ loading: true, error: null });
    try {
      const response = await budgetApi.getBudgets();
      // Transform backend response to match Budget interface and calculate 'spent'
      // You might need a more sophisticated way to calculate 'spent' based on transactions
      // associated with each budget category. For now, let's mock it or assume backend provides it.
      const fetchedBudgets: Budget[] = response.data.map((b: any) => ({
        id: b.id,
        user: b.user,
        category: b.category,
        amount: parseFloat(b.amount), // 'amount' from backend is the budget limit
        spent: 0, // Placeholder: This needs to be calculated dynamically from transactions in a real app
        month: b.month,
        due_date: b.due_date,
        transaction: b.transaction,
        name: get().categories.find(c => c.id === b.category)?.name || `Category ${b.category}` // Add name for display
      }));

      // A basic way to calculate spent for demonstration.
      // In a real app, you'd likely filter transactions by month/budget period.
      const categories = get().categories;
      const transactions = get().transactions;

      const budgetsWithSpent = fetchedBudgets.map(budget => {
        const categoryType = categories.find(c => c.id === budget.category)?.type;
        let spent = 0;
        if (categoryType === 'expense') {
          spent = transactions
            .filter(t => t.category === budget.category && t.type === 'expense') // Assuming transaction has a 'type'
            .reduce((sum, t) => sum + t.amount, 0);
        }
        return { ...budget, spent };
      });


      set({ budgets: budgetsWithSpent, loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message || 'Failed to fetch budgets' });
    }
  },

  fetchTransactions: async () => {
    set({ loading: true, error: null });
    try {
      // Assuming you have an API endpoint to get all transactions for the current user.
      // The Postman collection doesn't explicitly show a GET for transactions,
      // so this is a placeholder. If not available, you might need to adjust your backend.
      // For now, let's assume `transactionApi.getTransactions()` exists.
      // If not, you might have to filter them from a general activity feed.
      const response = await transactionApi.getTransactions(); // Assuming this endpoint works for GET as well
      const categories = get().categories;
      const fetchedTransactions: Transaction[] = response.data.map((t: any) => {
        const category = categories.find(c => c.id === t.category);
        return {
          id: t.id,
          user: t.user,
          category: t.category,
          amount: parseFloat(t.amount),
          description: t.description,
          tx_ref: t.tx_ref,
          status: t.status,
          date: t.date,
          created_at: t.created_at,
          type: category ? category.type : 'expense', // Derive type from category
        };
      });
      set({ transactions: fetchedTransactions, loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message || 'Failed to fetch transactions' });
    }
  },

  fetchCategories: async () => {
    set({ loading: true, error: null });
    try {
      const response = await categoriesApi.getCategories();
      set({ categories: response.data, loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message || 'Failed to fetch categories' });
    }
  },

  addTransaction: async (data) => {
    set({ loading: true, error: null });
    try {
      await transactionApi.createTransaction(data);
      await get().fetchTransactions(); // Refresh transactions after adding
      set({ loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message || 'Failed to add transaction' });
      throw error; // Re-throw to allow component to handle alert
    }
  },

  createBudget: async (data) => {
    set({ loading: true, error: null });
    try {
      await budgetApi.createBudget(data);
      await get().fetchBudgets(); // Refresh budgets after creating
      set({ loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message || 'Failed to create budget' });
      throw error; // Re-throw to allow component to handle alert
    }
  },

  deleteTransaction: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await transactionApi.deleteTransaction(id);
      await get().fetchTransactions(); // Refresh transactions after deletion
      set({ loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message || 'Failed to delete transaction' });
      throw error;
    }
  },
}));
