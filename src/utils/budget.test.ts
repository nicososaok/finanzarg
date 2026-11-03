import { describe, it, expect } from 'vitest';
import { calculateExpensesByCategory, calculateBudgetProgress, Transaction } from './budget';

describe('FinanzArg - Lógica de Presupuestos', () => {
  const mockTransactions: Transaction[] = [
    { id: '1', amount: 30000, type: 'expense', category: 'Supermercado' },
    { id: '2', amount: 15000, type: 'expense', category: 'Servicios' },
    { id: '3', amount: 10000, type: 'expense', category: 'Supermercado' },
    { id: '4', amount: 100000, type: 'income', category: 'Sueldo' },
  ];

  it('debe agrupar y sumar los gastos correctamente por categoría', () => {
    const expenses = calculateExpensesByCategory(mockTransactions);
    expect(expenses['Supermercado']).toBe(40000);
    expect(expenses['Servicios']).toBe(15000);
  });

  it('debe calcular correctamente el porcentaje de progreso del presupuesto', () => {
    expect(calculateBudgetProgress(40000, 50000)).toBe(80);
    expect(calculateBudgetProgress(60000, 50000)).toBe(100); // Tope máximo 100%
  });
});