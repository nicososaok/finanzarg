import React, { useRef } from 'react';
import { Transaction } from '../utils/finance';
import { exportToCSV, parseCSVToTransactions } from '../utils/exportImport';

interface DataBackupProps {
  transactions: Transaction[];
  onImportTransactions: (imported: Transaction[]) => void;
}

export const DataBackup: React.FC<DataBackupProps> = ({ transactions, onImportTransactions }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manejador de descarga de archivo CSV
  const handleExport = () => {
    if (transactions.length === 0) {
      alert('No hay transacciones para exportar.');
      return;
    }
    const csvContent = exportToCSV(transactions);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `finanzarg_backup_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Manejador de lectura de archivo subido
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const imported = parseCSVToTransactions(content);
        if (imported.length > 0) {
          onImportTransactions(imported);
          alert(`¡Se importaron ${imported.length} transacciones exitosamente!`);
        } else {
          alert('No se pudieron encontrar transacciones válidas en el archivo subido.');
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md my-4 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Copia de Seguridad (Backup)</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Exportá tus datos para abrirlos en Excel o importá un archivo respaldado previamente.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleExport}
          className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          📊 Exportar a Excel/CSV
        </button>

        <input
          type="file"
          accept=".csv"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-gray-600 hover:bg-gray-700 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          📂 Importar Backup
        </button>
      </div>
    </div>
  );
};