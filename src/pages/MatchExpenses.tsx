import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatDate } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

interface MatchExpense {
  id: string;
  opponent: string;
  match_date: string;
  category: string;
  amount: number;
  notes: string;
}

export default function MatchExpenses() {
  const { role } = useAuth();
  const canCreate = role === 'admin' || role === 'finance';
  const canManageFinance = role === 'admin';
  const [expenses, setExpenses] = useState<MatchExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<MatchExpense | null>(null);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [formData, setFormData] = useState({
    opponent: '',
    match_date: new Date().toISOString().split('T')[0],
    category: '',
    amount: '',
    notes: '',
  });

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    setLoading(true);
    setErrorMessage('');
    const { data, error } = await supabase.from('match_expenses').select('*').order('match_date', { ascending: false });
    if (error) {
      setErrorMessage(error.message);
      setExpenses([]);
      setTotalExpenses(0);
      setLoading(false);
      return;
    }

    setExpenses(data || []);
    const total = data?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
    setTotalExpenses(total);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingExpense && !canManageFinance) {
      setErrorMessage('Only admins can update match expenses.');
      return;
    }
    if (!editingExpense && !canCreate) {
      setErrorMessage('You do not have permission to add match expenses.');
      return;
    }
    setErrorMessage('');

    const expenseData = {
      opponent: formData.opponent,
      match_date: formData.match_date,
      category: formData.category,
      amount: parseFloat(formData.amount),
      notes: formData.notes,
    };

    if (editingExpense) {
      const { error } = await supabase.from('match_expenses').update(expenseData).eq('id', editingExpense.id);
      if (error) {
        setErrorMessage(error.message);
        return;
      }
    } else {
      const { error } = await supabase.from('match_expenses').insert(expenseData);
      if (error) {
        setErrorMessage(error.message);
        return;
      }
    }

    setShowForm(false);
    setEditingExpense(null);
    setFormData({ opponent: '', match_date: new Date().toISOString().split('T')[0], category: '', amount: '', notes: '' });
    loadExpenses();
  };

  const handleEdit = (expense: MatchExpense) => {
    setEditingExpense(expense);
    setFormData({
      opponent: expense.opponent,
      match_date: expense.match_date,
      category: expense.category,
      amount: expense.amount.toString(),
      notes: expense.notes,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!canManageFinance) {
      setErrorMessage('Only admins can delete match expenses.');
      return;
    }

    if (confirm('Are you sure you want to delete this expense?')) {
      const { error } = await supabase.from('match_expenses').delete().eq('id', id);
      if (error) {
        setErrorMessage(error.message);
        return;
      }
      loadExpenses();
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Match Expenses</h2>
          <p className="text-sm text-gray-600 mt-1">Total: {formatCurrency(totalExpenses)}</p>
        </div>
        {canCreate && (
        <button
          onClick={() => {
            setEditingExpense(null);
            setFormData({ opponent: '', match_date: new Date().toISOString().split('T')[0], category: '', amount: '', notes: '' });
            setShowForm(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <Plus className="w-5 h-5" />
          <span>Add Expense</span>
        </button>
        )}
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Opponent</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
              {canManageFinance && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={canManageFinance ? 6 : 5} className="px-6 py-8 text-center text-gray-500">
                  No match expenses recorded
                </td>
              </tr>
            ) : (
              expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{formatDate(expense.match_date)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{expense.opponent}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{expense.category}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{expense.notes || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">{formatCurrency(expense.amount)}</td>
                  {canManageFinance && (
                  <td className="px-6 py-4 text-sm text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && canCreate && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingExpense ? 'Edit' : 'Add'} Match Expense
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opponent</label>
                <input
                  type="text"
                  value={formData.opponent}
                  onChange={(e) => setFormData({ ...formData, opponent: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Simba SC"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Match Date</label>
                <input
                  type="date"
                  value={formData.match_date}
                  onChange={(e) => setFormData({ ...formData, match_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Transport, Accommodation, Meals"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (TZS)</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
                >
                  {editingExpense ? 'Update' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingExpense(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
