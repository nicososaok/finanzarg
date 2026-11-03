import { describe, it, expect } from 'vitest';
import { calculateTotalIncome, calculateTotalExpenses, calculateBalance, Transaction } from './finance';

describe('FinanzArg - Cálculos Financieros', () => {
  const mockTransactions: Transaction[] = [
    { id: '1', amount: 150000, type: 'income', category: 'Sueldo' },
    { id: '2', amount: 35000, type: 'expense', category: 'Supermercado' },
    { id: '3', amount: 15000, type: 'expense', category: 'Servicios' },
  ];

  it('debe calcular correctamente el total de ingresos', () => {
    expect(calculateTotalIncome(mockTransactions)).toBe(150000);
  });

  it('debe calcular correctamente el total de gastos', () => {
    expect(calculateTotalExpenses(mockTransactions)).toBe(50000);
  });

  it('debe calcular correctamente el balance neto', () => {
    expect(calculateBalance(mockTransactions)).toBe(100000);
  });

  it('debe retornar 0 en el balance si la lista de transacciones está vacía', () => {
    expect(calculateBalance([])).toBe(0);
  });
});