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
  X
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

const CATEGORIES = {
  expense: [
    { id: 'comida', name: 'Comida', color: '#ef4444' },
    { id: 'transporte', name: 'Transporte', color: '#f97316' },
    { id: 'servicios', name: 'Servicios', color: '#3b82f6' },
    { id: 'ocio', name: 'Ocio y Salidas', color: '#8b5cf6' },
    { id: 'salud', name: 'Salud', color: '#10b981' },
    { id: 'compras', name: 'Compras', color: '#ec4899' },
    { id: 'otros', name: 'Otros Egresos', color: '#6b7280' },
  ],
  income: [
    { id: 'sueldo', name: 'Sueldo / Salario', color: '#10b981' },
    { id: 'freelance', name: 'Freelance', color: '#06b6d4' },
    { id: 'ventas', name: 'Ventas', color: '#8b5cf6' },
    { id: 'inversiones', name: 'Inversiones', color: '#f59e0b' },
    { id: 'otros_ingresos', name: 'Otros Ingresos', color: '#64748b' },
  ]
};

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('finanzarg_theme') === 'dark';
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('finanzarg_transactions');
    return saved ? JSON.parse(saved) : [
      { id: '1', type: 'income', amount: 350000, category: 'Sueldo / Salario', description: 'Cobro de haberes', date: '2026-10-01' },
      { id: '2', type: 'expense', amount: 45000, category: 'Comida', description: 'Supermercado semanal', date: '2026-10-05' },
      { id: '3', type: 'expense', amount: 12000, category: 'Transporte', description: 'Carga SUBE y Nafta', date: '2026-10-10' },
    ];
  });

  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    category: 'Comida',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Persistencia
  useEffect(() => {
    localStorage.setItem('finanzarg_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('finanzarg_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('finanzarg_theme', 'light');
    }
  }, [darkMode]);

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

  // Abrir Modal
  const openModalForNew = () => {
    setEditingId(null);
    setFormData({
      type: 'expense',
      amount: '',
      category: CATEGORIES.expense[0].name,
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

  // Filtrar
  const filteredTransactions = transactions.filter(t => {
    if (filterType === 'income') return t.type === 'income';
    if (filterType === 'expense') return t.type === 'expense';
    return true;
  });

  // Datos para el desglose de Gastos
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  const expensesByCategory = CATEGORIES.expense.map(cat => {
    const total = expenseTransactions
      .filter(t => t.category === cat.name)
      .reduce((sum, t) => sum + t.amount, 0);
    return { ...cat, total };
  }).filter(cat => cat.total > 0);

  // Generar gradiente en grados (deg) para la torta
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
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>

      {/* Header */}
      <header className={`border-b sticky top-0 z-10 backdrop-blur-md ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'}`}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-500 text-white p-2 rounded-xl shadow-md">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">FinanzArg</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Control de Gastos Personales</p>
            </div>
          </div>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-lg border transition ${darkMode ? 'border-slate-700 bg-slate-800 text-amber-400 hover:bg-slate-700' : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            title="Cambiar Modo"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Resumen de Tarjetas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-5 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Balance Total</span>
              <Wallet className={`w-5 h-5 ${totalBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`} />
            </div>
            <p className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              $ {totalBalance.toLocaleString('es-AR')}
            </p>
          </div>

          <div className={`p-5 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Ingresos</span>
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              $ {totalIncome.toLocaleString('es-AR')}
            </p>
          </div>

          <div className={`p-5 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'}`}>
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
        <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-lg font-semibold">Historial de Transacciones</h2>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Filtros */}
              <div className={`p-1 rounded-xl border flex gap-1 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${filterType === 'all' ? 'bg-emerald-500 text-white' : 'text-slate-500'}`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilterType('income')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${filterType === 'income' ? 'bg-emerald-500 text-white' : 'text-slate-500'}`}
                >
                  Ingresos
                </button>
                <button
                  onClick={() => setFilterType('expense')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${filterType === 'expense' ? 'bg-emerald-500 text-white' : 'text-slate-500'}`}
                >
                  Egresos
                </button>
              </div>

              {/* Botón Agregar */}
              <button
                onClick={openModalForNew}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition shadow-sm ml-auto"
              >
                <PlusCircle className="w-4 h-4" />
                Agregar
              </button>
            </div>
          </div>

          {/* Lista de Transacciones */}
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              No hay movimientos registrados.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map(t => (
                <div
                  key={t.id}
                  className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition ${darkMode ? 'border-slate-700 bg-slate-800/40 hover:bg-slate-800' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100/50'}`}
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
                        className="p-1.5 text-slate-400 hover:text-emerald-500 rounded-lg hover:bg-emerald-500/10 transition"
                        title="Editar monto / transacción"
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

        {/* Sección Torta de Gastos por Categoría (DEBAJO) */}
        <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-2 mb-6">
            <PieIcon className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-semibold">Gastos por Categoría</h2>
          </div>

          {expensesByCategory.length === 0 ? (
            <p className="text-center py-6 text-slate-400 text-sm">No hay egresos registrados para mostrar el desglose.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Gráfico Torta Visual */}
              <div className="flex justify-center items-center relative py-4">
                <div
                  className="w-48 h-48 rounded-full shadow-inner flex items-center justify-center"
                  style={{ background: getConicGradient() }}
                >
                  <div className={`w-28 h-28 rounded-full flex flex-col items-center justify-center shadow-md ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
                    <span className="text-xs text-slate-400">Total</span>
                    <span className="text-sm font-bold text-rose-500">${totalExpense.toLocaleString('es-AR')}</span>
                  </div>
                </div>
              </div>

              {/* Leyenda de Categorías */}
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

      </main>

      {/* Modal para Agregar / Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-xl ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}>
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
              {/* Tipo */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      type: 'expense',
                      category: CATEGORIES.expense[0].name
                    });
                  }}
                  className={`py-2 rounded-lg text-sm font-medium transition ${formData.type === 'expense' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500'}`}
                >
                  Egreso
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      type: 'income',
                      category: CATEGORIES.income[0].name
                    });
                  }}
                  className={`py-2 rounded-lg text-sm font-medium transition ${formData.type === 'income' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500'}`}
                >
                  Ingreso
                </button>
              </div>

              {/* Monto */}
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
                    className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
                  />
                </div>
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Categoría</label>
                <div className="relative">
                  <Tag className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
                  >
                    {CATEGORIES[formData.type].map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fecha */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Fecha</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
                  />
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Descripción / Nota</label>
                <div className="relative">
                  <FileText className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Ej. Compras supermercado"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
                  />
                </div>
              </div>

              {/* Botón Guardar */}
              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition shadow-md mt-2"
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