import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  TrendingUp,
  TrendingDown,
  Wallet,
  Trash2,
  Edit2,
  Sun,
  Moon,
  PieChart as PieIcon,
  Tag,
  DollarSign,
  Calendar,
  FileText,
  X,
  Download,
  Upload,
  Target
} from 'lucide-react';

// Interfaces
export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
}

export interface BudgetLimit {
  category: string;
  limit: number;
}

const DEFAULT_EXPENSE_CATEGORIES = [
  { id: 'comida', name: 'Comida', color: '#ef4444' },
  { id: 'transporte', name: 'Transporte', color: '#f97316' },
  { id: 'servicios', name: 'Servicios', color: '#3b82f6' },
  { id: 'ocio', name: 'Ocio y Salidas', color: '#8b5cf6' },
  { id: 'salud', name: 'Salud', color: '#10b981' },
  { id: 'compras', name: 'Compras', color: '#ec4899' },
  { id: 'otros', name: 'Otros Egresos', color: '#6b7280' },
];

const DEFAULT_INCOME_CATEGORIES = [
  { id: 'sueldo', name: 'Sueldo / Salario', color: '#10b981' },
  { id: 'freelance', name: 'Freelance', color: '#06b6d4' },
  { id: 'ventas', name: 'Ventas', color: '#8b5cf6' },
  { id: 'inversiones', name: 'Inversiones', color: '#f59e0b' },
  { id: 'otros_ingresos', name: 'Otros Ingresos', color: '#64748b' },
];

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('finanzarg_theme') === 'dark';
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('finanzarg_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  // Estado para Presupuestos
  const [budgets, setBudgets] = useState<BudgetLimit[]>(() => {
    const saved = localStorage.getItem('finanzarg_budgets');
    return saved ? JSON.parse(saved) : [];
  });

  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State para Transacciones
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    category: 'Comida',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Form State para Presupuestos
  const [budgetCategoryInput, setBudgetCategoryInput] = useState('');
  const [budgetLimitInput, setBudgetLimitInput] = useState('');

  // Persistencia
  useEffect(() => {
    localStorage.setItem('finanzarg_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('finanzarg_budgets', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('finanzarg_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('finanzarg_theme', 'light');
    }
  }, [darkMode]);

  // Lista unificada de categorías de egresos (predefinidas + las creadas en presupuestos/transacciones)
  const availableExpenseCategories = Array.from(new Set([
    ...DEFAULT_EXPENSE_CATEGORIES.map(c => c.name),
    ...budgets.map(b => b.category),
    ...transactions.filter(t => t.type === 'expense').map(t => t.category)
  ]));

  // Cálculos de Totales
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBalance = totalIncome - totalExpense;

  // Formato dd/mm/yy
  const formatDateDDMMYY = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    if (!year || !month || !day) return dateStr;
    return `${day}/${month}/${year.slice(2)}`;
  };

  // Abrir Modal Transacción
  const openModalForNew = () => {
    setEditingId(null);
    setFormData({
      type: 'expense',
      amount: '',
      category: availableExpenseCategories[0] || 'Comida',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const openModalForEdit = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      category: transaction.category,
      description: transaction.description,
      date: transaction.date
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) return;

    if (editingId) {
      setTransactions(prev => prev.map(t => t.id === editingId ? {
        ...t,
        type: formData.type,
        amount: Number(formData.amount),
        category: formData.category,
        description: formData.description,
        date: formData.date
      } : t));
    } else {
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: formData.type,
        amount: Number(formData.amount),
        category: formData.category,
        description: formData.description,
        date: formData.date
      };
      setTransactions(prev => [newTransaction, ...prev]);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar esta transacción?')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  // Guardar / Actualizar Presupuesto (Permite nuevas categorías)
  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const catName = budgetCategoryInput.trim();
    const limitNum = Number(budgetLimitInput);
    if (!catName || isNaN(limitNum) || limitNum <= 0) return;

    setBudgets(prev => {
      const existing = prev.findIndex(b => b.category.toLowerCase() === catName.toLowerCase());
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing].limit = limitNum;
        return updated;
      }
      return [...prev, { category: catName, limit: limitNum }];
    });
    setBudgetCategoryInput('');
    setBudgetLimitInput('');
  };

  // Eliminar Presupuesto
  const handleDeleteBudget = (categoryName: string) => {
    if (confirm(`¿Eliminar el presupuesto para ${categoryName}?`)) {
      setBudgets(prev => prev.filter(b => b.category !== categoryName));
    }
  };

  // Exportar Backup CSV
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      alert('No hay transacciones para exportar.');
      return;
    }
    const headers = ['id', 'amount', 'type', 'category', 'description', 'date'];
    const rows = transactions.map(t => [t.id, t.amount, t.type, `"${t.category}"`, `"${t.description}"`, t.date].join(','));
    const csvContent = [headers.join(','), ...rows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finanzarg_backup_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Importar Backup CSV
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;
      const lines = content.trim().split('\n');
      if (lines.length <= 1) return;

      const imported: Transaction[] = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',');
        if (parts.length >= 6) {
          imported.push({
            id: parts[0].trim(),
            amount: parseFloat(parts[1].trim()),
            type: parts[2].trim() as 'income' | 'expense',
            category: parts[3].trim().replace(/^"|"$/g, ''),
            description: parts[4].trim().replace(/^"|"$/g, ''),
            date: parts[5].trim()
          });
        }
      }

      if (imported.length > 0) {
        setTransactions(imported);
        alert(`¡Se importaron ${imported.length} transacciones con éxito!`);
      } else {
        alert('Formato de archivo inválido.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Filtrar Transacciones
  const filteredTransactions = transactions.filter(t => {
    if (filterType === 'income') return t.type === 'income';
    if (filterType === 'expense') return t.type === 'expense';
    return true;
  });

  // Gastos por Categoría para Torta y Presupuestos
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  const expensesByCategory = availableExpenseCategories.map((catName, index) => {
    const total = expenseTransactions
      .filter(t => t.category === catName)
      .reduce((sum, t) => sum + t.amount, 0);
    const defaultColor = DEFAULT_EXPENSE_CATEGORIES[index % DEFAULT_EXPENSE_CATEGORIES.length].color;
    return { id: catName, name: catName, color: defaultColor, total };
  }).filter(cat => cat.total > 0);

  // Gastos totales por nombre de categoría (para presupuestos)
  const expenseMap = expenseTransactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  // Gradiente Torta
  const getConicGradient = () => {
    if (totalExpense === 0 || expensesByCategory.length === 0) return 'transparent';
    let currentAngle = 0;
    const stops = expensesByCategory.map(cat => {
      const proportion = cat.total / totalExpense;
      const startAngle = currentAngle;
      currentAngle += proportion * 360;
      return `${cat.color} ${startAngle}deg ${currentAngle}deg`;
    });
    return `conic-gradient(${stops.join(', ')})`;
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${darkMode ? 'bg-black text-slate-100' : 'bg-slate-50 text-slate-900'}`}>

      {/* Header */}
      <header className={`border-b sticky top-0 z-10 backdrop-blur-md ${darkMode ? 'bg-black/90 border-neutral-800' : 'bg-white/90 border-slate-200'}`}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-black dark:bg-white text-white dark:text-black p-2 rounded-xl shadow-md">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">FinanzArg</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Control de Gastos Personales</p>
            </div>
          </div>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-lg border transition ${darkMode ? 'border-neutral-800 bg-neutral-900 text-amber-400 hover:bg-neutral-800' : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            title="Cambiar Modo"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <main className="max-w-5xl w-full mx-auto px-4 py-8 space-y-8 flex-1">

        {/* Resumen de Tarjetas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-5 rounded-2xl border shadow-sm ${darkMode ? 'bg-neutral-900/80 border-neutral-800' : 'bg-white border-slate-200'}`}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Balance Total</span>
              <Wallet className={`w-5 h-5 ${totalBalance >= 0 ? 'text-black dark:text-white' : 'text-rose-500'}`} />
            </div>
            <p className="text-2xl font-bold">
              $ {totalBalance.toLocaleString('es-AR')}
            </p>
          </div>

          <div className={`p-5 rounded-2xl border shadow-sm ${darkMode ? 'bg-neutral-900/80 border-neutral-800' : 'bg-white border-slate-200'}`}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Ingresos</span>
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              $ {totalIncome.toLocaleString('es-AR')}
            </p>
          </div>

          <div className={`p-5 rounded-2xl border shadow-sm ${darkMode ? 'bg-neutral-900/80 border-neutral-800' : 'bg-white border-slate-200'}`}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Egresos</span>
              <TrendingDown className="w-5 h-5 text-rose-500" />
            </div>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              $ {totalExpense.toLocaleString('es-AR')}
            </p>
          </div>
        </div>

        {/* Acciones e Historial */}
        <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-neutral-900/80 border-neutral-800' : 'bg-white border-slate-200'}`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-lg font-semibold">Historial de Transacciones</h2>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className={`p-1 rounded-xl border flex gap-1 ${darkMode ? 'bg-black border-neutral-800' : 'bg-slate-100 border-slate-200'}`}>
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${filterType === 'all' ? 'bg-black dark:bg-white text-white dark:text-black' : 'text-slate-500'}`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilterType('income')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${filterType === 'income' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-emerald-500'}`}
                >
                  Ingresos
                </button>
                <button
                  onClick={() => setFilterType('expense')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${filterType === 'expense' ? 'bg-rose-600 text-white' : 'text-slate-500 hover:text-rose-500'}`}
                >
                  Egresos
                </button>
              </div>

              <button
                onClick={openModalForNew}
                className="flex items-center gap-2 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-black px-4 py-2 rounded-xl text-sm font-medium transition shadow-sm ml-auto"
              >
                <PlusCircle className="w-4 h-4" />
                Agregar
              </button>
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              No hay movimientos registrados.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map(t => (
                <div
                  key={t.id}
                  className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition ${darkMode ? 'border-neutral-800 bg-neutral-900/40 hover:bg-neutral-900' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100/50'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                      {t.type === 'income' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{t.description || t.category}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span>{t.category}</span>
                        <span>•</span>
                        <span>{formatDateDDMMYY(t.date)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`font-bold text-sm ${t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {t.type === 'income' ? '+' : '-'} $ {t.amount.toLocaleString('es-AR')}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openModalForEdit(t)}
                        className="p-1.5 text-slate-400 hover:text-black dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sección Torta de Gastos por Categoría */}
        <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-neutral-900/80 border-neutral-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-2 mb-6">
            <PieIcon className="w-5 h-5 text-black dark:text-white" />
            <h2 className="text-lg font-semibold">Gastos por Categoría</h2>
          </div>

          {expensesByCategory.length === 0 ? (
            <p className="text-center py-6 text-slate-400 text-sm">No hay egresos registrados para mostrar el desglose.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="flex justify-center items-center relative py-4">
                <div
                  className="w-48 h-48 rounded-full shadow-inner flex items-center justify-center"
                  style={{ background: getConicGradient() }}
                >
                  <div className={`w-28 h-28 rounded-full flex flex-col items-center justify-center shadow-md ${darkMode ? 'bg-neutral-900' : 'bg-white'}`}>
                    <span className="text-xs text-slate-400">Total</span>
                    <span className="text-sm font-bold text-rose-500">${totalExpense.toLocaleString('es-AR')}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {expensesByCategory.map(cat => {
                  const percentage = ((cat.total / totalExpense) * 100).toFixed(1);
                  return (
                    <div key={cat.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span>{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 text-xs">{percentage}%</span>
                        <span className="font-semibold">$ {cat.total.toLocaleString('es-AR')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sección Presupuestos por Categoría */}
        <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-neutral-900/80 border-neutral-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-2 mb-6">
            <Target className="w-5 h-5 text-black dark:text-white" />
            <h2 className="text-lg font-semibold">Presupuestos por Categoría</h2>
          </div>

          <form onSubmit={handleSaveBudget} className="flex flex-col sm:flex-row gap-3 mb-6">
            <input
              type="text"
              list="categories-list"
              placeholder="Categoría (ej. Gimnasio, Ropa...)"
              value={budgetCategoryInput}
              onChange={e => setBudgetCategoryInput(e.target.value)}
              className={`p-2.5 rounded-xl border text-sm flex-1 ${darkMode ? 'bg-black border-neutral-800 text-slate-100 placeholder-neutral-500' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
            />
            <datalist id="categories-list">
              {availableExpenseCategories.map(c => (
                <option key={c} value={c} />
              ))}
            </datalist>

            <input
              type="number"
              placeholder="Límite máximo ($)"
              value={budgetLimitInput}
              onChange={e => setBudgetLimitInput(e.target.value)}
              min="1"
              className={`p-2.5 rounded-xl border text-sm flex-1 ${darkMode ? 'bg-black border-neutral-800 text-slate-100 placeholder-neutral-500' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-black rounded-xl text-sm font-semibold transition shadow-sm"
            >
              Agregar / Definir
            </button>
          </form>

          <div className="space-y-4">
            {budgets.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-2">No hay presupuestos definidos todavía.</p>
            ) : (
              budgets.map(b => {
                const spent = expenseMap[b.category] || 0;
                const progress = Math.min(Math.round((spent / b.limit) * 100), 100);
                const isExceeded = spent > b.limit;

                return (
                  <div key={b.category} className={`p-4 rounded-xl border ${darkMode ? 'border-neutral-800 bg-neutral-900/40' : 'border-slate-100 bg-slate-50/50'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-sm">{b.category}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">${spent.toLocaleString('es-AR')} / ${b.limit.toLocaleString('es-AR')} ({progress}%)</span>
                        <button
                          onClick={() => handleDeleteBudget(b.category)}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition"
                          title="Eliminar Presupuesto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className={`w-full rounded-full h-2.5 ${darkMode ? 'bg-neutral-800' : 'bg-slate-200'}`}>
                      <div
                        className={`h-2.5 rounded-full ${isExceeded ? 'bg-rose-500' : progress > 80 ? 'bg-amber-500' : 'bg-black dark:bg-white'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    {isExceeded && (
                      <span className="text-xs text-rose-500 font-medium mt-1 inline-block">¡Has superado el presupuesto de esta categoría!</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Barra de Herramientas de Respaldo / Backup */}
        <div className={`p-4 rounded-2xl border shadow-sm flex flex-wrap items-center justify-between gap-4 ${darkMode ? 'bg-neutral-900/80 border-neutral-800' : 'bg-white border-slate-200'}`}>
          <div>
            <h3 className="text-sm font-semibold">Copia de Seguridad (Backup)</h3>
            <p className="text-xs text-slate-400">Exportá o importá tus transacciones en formato CSV.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-black rounded-xl text-xs font-medium transition shadow-sm"
            >
              <Download className="w-4 h-4" /> Exportar CSV
            </button>
            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-700 hover:bg-neutral-800 text-white rounded-xl text-xs font-medium transition shadow-sm cursor-pointer">
              <Upload className="w-4 h-4" /> Importar CSV
              <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
            </label>
          </div>
        </div>

      </main>

      {/* Footer Único Integrado */}
      <footer className={`text-center py-6 border-t text-xs mt-auto ${darkMode ? 'border-neutral-800 text-neutral-500 bg-black' : 'border-slate-200 text-slate-400 bg-white'}`}>
        <p className="mt-1">© {new Date().getFullYear()} FinanzArg. Todos los derechos reservados.</p>
      </footer>

      {/* Modal para Agregar / Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-xl ${darkMode ? 'bg-neutral-900 border-neutral-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{editingId ? 'Editar Movimiento' : 'Nuevo Movimiento'}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-black rounded-xl border border-transparent dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      type: 'expense',
                      category: availableExpenseCategories[0] || 'Comida'
                    });
                  }}
                  className={`py-2 rounded-lg text-sm font-medium transition ${formData.type === 'expense' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-500 hover:text-rose-500'}`}
                >
                  Egreso
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      type: 'income',
                      category: DEFAULT_INCOME_CATEGORIES[0].name
                    });
                  }}
                  className={`py-2 rounded-lg text-sm font-medium transition ${formData.type === 'income' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-emerald-500'}`}
                >
                  Ingreso
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Monto ($)</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="0"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white ${darkMode ? 'bg-black border-neutral-800' : 'bg-white border-slate-200'}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Categoría</label>
                <div className="relative">
                  <Tag className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    list="form-categories-list"
                    required
                    placeholder="Seleccioná o escribí una categoría"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white ${darkMode ? 'bg-black border-neutral-800' : 'bg-white border-slate-200'}`}
                  />
                  <datalist id="form-categories-list">
                    {(formData.type === 'expense' ? availableExpenseCategories : DEFAULT_INCOME_CATEGORIES.map(c => c.name)).map(c => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Fecha</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white ${darkMode ? 'bg-black border-neutral-800' : 'bg-white border-slate-200'}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Descripción / Nota</label>
                <div className="relative">
                  <FileText className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Ej. Compras supermercado"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white ${darkMode ? 'bg-black border-neutral-800' : 'bg-white border-slate-200'}`}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-black rounded-xl text-sm font-semibold transition shadow-md mt-2"
              >
                {editingId ? 'Guardar Cambios' : 'Registrar'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}