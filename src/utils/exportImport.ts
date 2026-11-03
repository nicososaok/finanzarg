import { Transaction } from './finance';

// Convierte un array de transacciones a una cadena en formato CSV
export const exportToCSV = (transactions: Transaction[]): string => {
  const headers = ['id', 'amount', 'type', 'category'];
  const rows = transactions.map((t) => [t.id, t.amount, t.type, `"${t.category}"`].join(','));
  return [headers.join(','), ...rows].join('\n');
};

// Convierte un texto en formato CSV a un array de transacciones
export const parseCSVToTransactions = (csvText: string): Transaction[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length <= 1) return [];

  const transactions: Transaction[] = [];

  // Salta el header (índice 0)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Split por coma respetando comillas básicas
    const parts = line.split(',');
    if (parts.length < 4) continue;

    const id = parts[0].trim();
    const amount = parseFloat(parts[1].trim());
    const type = parts[2].trim() as 'income' | 'expense';
    const category = parts[3].trim().replace(/^"|"$/g, '');

    if (id && !isNaN(amount) && (type === 'income' || type === 'expense')) {
      transactions.push({ id, amount, type, category });
    }
  }

  return transactions;
};