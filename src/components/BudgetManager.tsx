import React, { useState, useEffect } from 'react';
import { calculateExpensesByCategory, calculateBudgetProgress, Transaction, BudgetLimit } from '../utils/budget';

interface BudgetManagerProps {
  transactions: Transaction[];
  categories: string[];
}

export const BudgetManager: React.FC<BudgetManagerProps> = ({ transactions, categories }) => {
  const [budgets, setBudgets] = useState<BudgetLimit[]>(() => {
    const saved = localStorage.getItem('finanzarg_budgets');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedCategory, setSelectedCategory] = useState(categories[0] || '');
  const [limitInput, setLimitInput] = useState('');

  useEffect(() => {
    localStorage.setItem('finanzarg_budgets', JSON.stringify(budgets));
  }, [budgets]);

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const limitNum = parseFloat(limitInput);
    if (!selectedCategory || isNaN(limitNum) || limitNum <= 0) return;

    setBudgets((prev) => {
      const existingIndex = prev.findIndex((b) => b.category === selectedCategory);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].limit = limitNum;
        return updated;
      }
      return [...prev, { category: selectedCategory, limit: limitNum }];
    });

    setLimitInput('');
  };

  const expensesByCategory = calculateExpensesByCategory(transactions);

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md my-4">
      <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Presupuestos por Categoría</h3>

      {/* Formulario para asignar límite */}
      <form onSubmit={handleSaveBudget} className="flex gap-2 mb-6">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="p-2 border rounded dark:bg-gray-700 dark:text-white"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Límite máximo ($)"
          value={limitInput}
          onChange={(e) => setLimitInput(e.target.value)}
          className="p-2 border rounded flex-1 dark:bg-gray-700 dark:text-white"
        />

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Definir
        </button>
      </form>

      {/* Listado de Presupuestos y Barras de Progreso */}
      <div className="space-y-4">
        {budgets.length === 0 ? (
          <p className="text-gray-500 text-sm">No hay presupuestos definidos todavía.</p>
        ) : (
          budgets.map((b) => {
            const spent = expensesByCategory[b.category] || 0;
            const progress = calculateBudgetProgress(spent, b.limit);
            const isExceeded = spent > b.limit;

            return (
              <div key={b.category} className="border-b pb-3 dark:border-gray-700">
                <div className="flex justify-between text-sm mb-1 text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">{b.category}</span>
                  <span>${spent.toLocaleString()} / ${b.limit.toLocaleString()} ({progress}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div
                    className={`h-2.5 rounded-full ${isExceeded ? 'bg-red-500' : progress > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                {isExceeded && (
                  <span className="text-xs text-red-500 font-medium mt-1 inline-block">¡Has superado el presupuesto de esta categoría!</span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};