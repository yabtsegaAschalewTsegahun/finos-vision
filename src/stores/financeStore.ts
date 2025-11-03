import { create } from 'zustand';

export interface Budget {
  id: string;
  name: string;
  category: string;
  limit: number;
  spent: number;
  period: 'monthly' | 'weekly';
  startDate: string;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  category: string;
  type: 'income' | 'expense';
  paymentMethod: string;
}

interface FinanceStore {
  budgets: Budget[];
  transactions: Transaction[];
  addBudget: (budget: Omit<Budget, 'id' | 'spent'>) => void;
  updateBudget: (id: string, budget: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
}

// Mock data
const mockBudgets: Budget[] = [
  { id: '1', name: 'Rent', category: 'Housing', limit: 1500, spent: 1500, period: 'monthly', startDate: '2025-11-01' },
  { id: '2', name: 'Groceries', category: 'Food', limit: 600, spent: 423, period: 'monthly', startDate: '2025-11-01' },
  { id: '3', name: 'Entertainment', category: 'Entertainment', limit: 200, spent: 156, period: 'monthly', startDate: '2025-11-01' },
  { id: '4', name: 'Transportation', category: 'Transport', limit: 300, spent: 187, period: 'monthly', startDate: '2025-11-01' },
  { id: '5', name: 'Utilities', category: 'Housing', limit: 200, spent: 145, period: 'monthly', startDate: '2025-11-01' },
];

const mockTransactions: Transaction[] = [
  { id: '1', amount: 1500, description: 'Monthly Rent', date: '2025-11-01', category: 'Housing', type: 'expense', paymentMethod: 'Bank Transfer' },
  { id: '2', amount: 3500, description: 'Salary', date: '2025-11-01', category: 'Income', type: 'income', paymentMethod: 'Direct Deposit' },
  { id: '3', amount: 125, description: 'Grocery Shopping', date: '2025-11-02', category: 'Food', type: 'expense', paymentMethod: 'Credit Card' },
  { id: '4', amount: 45, description: 'Gas Station', date: '2025-11-02', category: 'Transport', type: 'expense', paymentMethod: 'Debit Card' },
  { id: '5', amount: 89, description: 'Restaurant Dinner', date: '2025-11-03', category: 'Entertainment', type: 'expense', paymentMethod: 'Credit Card' },
  { id: '6', amount: 145, description: 'Electric Bill', date: '2025-11-03', category: 'Housing', type: 'expense', paymentMethod: 'Auto-pay' },
  { id: '7', amount: 67, description: 'Movie Tickets', date: '2025-11-04', category: 'Entertainment', type: 'expense', paymentMethod: 'Credit Card' },
  { id: '8', amount: 198, description: 'Grocery Shopping', date: '2025-11-05', category: 'Food', type: 'expense', paymentMethod: 'Debit Card' },
];

export const useFinanceStore = create<FinanceStore>((set) => ({
  budgets: mockBudgets,
  transactions: mockTransactions,
  
  addBudget: (budget) =>
    set((state) => ({
      budgets: [...state.budgets, { ...budget, id: Date.now().toString(), spent: 0 }],
    })),
  
  updateBudget: (id, budget) =>
    set((state) => ({
      budgets: state.budgets.map((b) => (b.id === id ? { ...b, ...budget } : b)),
    })),
  
  deleteBudget: (id) =>
    set((state) => ({
      budgets: state.budgets.filter((b) => b.id !== id),
    })),
  
  addTransaction: (transaction) =>
    set((state) => ({
      transactions: [...state.transactions, { ...transaction, id: Date.now().toString() }],
    })),
  
  updateTransaction: (id, transaction) =>
    set((state) => ({
      transactions: state.transactions.map((t) => (t.id === id ? { ...t, ...transaction } : t)),
    })),
  
  deleteTransaction: (id) =>
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    })),
}));
