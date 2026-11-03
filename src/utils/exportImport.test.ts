import { describe, it, expect } from 'vitest';
import { exportToCSV, parseCSVToTransactions } from './exportImport';
import { Transaction } from './finance';

describe('FinanzArg - Exportación e Importación CSV', () => {
  const mockTransactions: Transaction[] = [
    { id: 'tx-1', amount: 120000, type: 'income', category: 'Sueldo' },
    { id: 'tx-2', amount: 25000, type: 'expense', category: 'Supermercado' },
  ];

  it('debe generar una cadena CSV válida', () => {
    const csv = exportToCSV(mockTransactions);
    expect(csv).toContain('id,amount,type,category');
    expect(csv).toContain('tx-1,120000,income,"Sueldo"');
    expect(csv).toContain('tx-2,25000,expense,"Supermercado"');
  });

  it('debe parsear un texto CSV a transacciones correctamente', () => {
    const csvData = `id,amount,type,category\ntx-1,120000,income,"Sueldo"\ntx-2,25000,expense,"Supermercado"`;
    const parsed = parseCSVToTransactions(csvData);

    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toEqual(mockTransactions[0]);
    expect(parsed[1]).toEqual(mockTransactions[1]);
  });

  it('debe ignorar filas inválidas o mal formateadas', () => {
    const invalidCSV = `id,amount,type,category\ninvalido\ntx-1,120000,income,"Sueldo"`;
    const parsed = parseCSVToTransactions(invalidCSV);

    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe('tx-1');
  });
});