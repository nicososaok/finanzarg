export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
}

export interface BudgetLimit {
  category: string;
  limit: number;
}

// Calcula el total gastado agrupado por categoría
export const calculateExpensesByCategory = (transactions: Transaction[]): Record<string, number> => {
  return transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
};

// Calcula el porcentaje consumido del presupuesto
export const calculateBudgetProgress = (spent: number, limit: number): number => {
  if (limit <= 0) return 0;
  return Math.min(Math.round((spent / limit) * 100), 100);
};