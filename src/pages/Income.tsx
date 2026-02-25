import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatDate } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

interface IncomeRecord {
  id: string;
  source: string;
  amount: number;
  income_date: string;
  notes: string;
}

export default function Income() {
  const { role } = useAuth();
  const canCreate = role === 'admin' || role === 'finance';
  const canManageFinance = role === 'admin';
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<IncomeRecord | null>(null);
  const [totalIncome, setTotalIncome] = useState(0);
  const [formData, setFormData] = useState({
    source: '',
    amount: '',
    income_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    loadIncome();
  }, []);

  const loadIncome = async () => {
    setLoading(true);
    setErrorMessage('');
    const { data, error } = await supabase.from('club_income').select('*').order('income_date', { ascending: false });
    if (error) {
      setErrorMessage(error.message);
      setIncomeRecords([]);
      setTotalIncome(0);
      setLoading(false);
      return;
    }

    setIncomeRecords(data || []);
    const total = data?.reduce((sum, record) => sum + Number(record.amount), 0) || 0;
    setTotalIncome(total);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRecord && !canManageFinance) {
      setErrorMessage('Only admins can update income records.');
      return;
    }
    if (!editingRecord && !canCreate) {
      setErrorMessage('You do not have permission to add income records.');
      return;
    }
    setErrorMessage('');

    const incomeData = {
      source: formData.source,
      amount: parseFloat(formData.amount),
      income_date: formData.income_date,
      notes: formData.notes,
    };

    if (editingRecord) {
      const { error } = await supabase.from('club_income').update(incomeData).eq('id', editingRecord.id);
      if (error) {
        setErrorMessage(error.message);
        return;
      }
    } else {
      const { error } = await supabase.from('club_income').insert(incomeData);
      if (error) {
        setErrorMessage(error.message);
        return;
      }
    }

    setShowForm(false);
    setEditingRecord(null);
    setFormData({ source: '', amount: '', income_date: new Date().toISOString().split('T')[0], notes: '' });
    loadIncome();
  };

  const handleEdit = (record: IncomeRecord) => {
    setEditingRecord(record);
    setFormData({
      source: record.source,
      amount: record.amount.toString(),
      income_date: record.income_date,
      notes: record.notes,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!canManageFinance) {
      setErrorMessage('Only admins can delete income records.');
      return;
    }

    if (confirm('Are you sure you want to delete this income record?')) {
      const { error } = await supabase.from('club_income').delete().eq('id', id);
      if (error) {
        setErrorMessage(error.message);
        return;
      }
      loadIncome();
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Income Management</h2>
          <p className="text-sm text-gray-600 mt-1">Total Income: {formatCurrency(totalIncome)}</p>
        </div>
        {canCreate && (
        <button
          onClick={() => {
            setEditingRecord(null);
            setFormData({ source: '', amount: '', income_date: new Date().toISOString().split('T')[0], notes: '' });
            setShowForm(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <Plus className="w-5 h-5" />
          <span>Add Income</span>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
              {canManageFinance && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {incomeRecords.length === 0 ? (
              <tr>
                <td colSpan={canManageFinance ? 5 : 4} className="px-6 py-8 text-center text-gray-500">
                  No income records found
                </td>
              </tr>
            ) : (
              incomeRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{formatDate(record.income_date)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{record.source}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{record.notes || '-'}</td>
                  <td className="px-6 py-4 text-sm text-green-600 font-medium text-right">
                    {formatCurrency(record.amount)}
                  </td>
                  {canManageFinance && (
                  <td className="px-6 py-4 text-sm text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(record)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(record.id)}
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
              {editingRecord ? 'Edit' : 'Add'} Income Record
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                <input
                  type="text"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Sponsorship, Ticket Sales, Donations"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={formData.income_date}
                  onChange={(e) => setFormData({ ...formData, income_date: e.target.value })}
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
                  {editingRecord ? 'Update' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingRecord(null);
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
