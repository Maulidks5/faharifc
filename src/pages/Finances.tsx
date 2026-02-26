import { useEffect, useState } from 'react';
import { Plus, DollarSign, TrendingUp, CreditCard, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatDate } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

interface Member {
  id: string;
  full_name: string;
  monthly_salary: number;
}

export default function Finances() {
  const { role } = useAuth();
  const canCreate = role === 'admin' || role === 'finance';
  const [activeTab, setActiveTab] = useState<'salary' | 'extra' | 'income'>('salary');
  const [members, setMembers] = useState<Member[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    member_id: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    month: '',
    category: '',
    source: '',
    notes: '',
  });

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setErrorMessage('');
    const { data, error } = await supabase.from('members').select('id, full_name, monthly_salary').order('full_name');
    if (error) {
      setErrorMessage(error.message);
      setMembers([]);
      return;
    }
    setMembers(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) {
      setErrorMessage('You do not have permission to record financial transactions.');
      return;
    }
    setErrorMessage('');

    let error: { message: string } | null = null;

    if (activeTab === 'salary') {
      ({ error } = await supabase.from('salary_payments').insert({
        member_id: formData.member_id,
        amount: parseFloat(formData.amount),
        payment_date: formData.payment_date,
        month: formData.month,
        notes: formData.notes,
      }));
    } else if (activeTab === 'extra') {
      ({ error } = await supabase.from('extra_payments').insert({
        member_id: formData.member_id,
        amount: parseFloat(formData.amount),
        payment_date: formData.payment_date,
        category: formData.category,
        notes: formData.notes,
      }));
    } else if (activeTab === 'income') {
      ({ error } = await supabase.from('club_income').insert({
        amount: parseFloat(formData.amount),
        income_date: formData.payment_date,
        source: formData.source,
        notes: formData.notes,
      }));
    }

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setShowForm(false);
    setFormData({
      member_id: '',
      amount: '',
      payment_date: new Date().toISOString().split('T')[0],
      month: '',
      category: '',
      source: '',
      notes: '',
    });
  };

  const tabs = [
    { id: 'salary' as const, label: 'Salary Payments', icon: DollarSign },
    { id: 'extra' as const, label: 'Extra Payments', icon: CreditCard },
    { id: 'income' as const, label: 'Club Income', icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Financial Management</h2>
        {canCreate && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <Plus className="w-5 h-5" />
          <span>
            Add{' '}
            {activeTab === 'salary'
              ? 'Salary Payment'
              : activeTab === 'extra'
              ? 'Extra Payment'
              : 'Income'}
          </span>
        </button>
        )}
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 font-medium transition ${
                    activeTab === tab.id
                      ? 'border-b-2 border-green-600 text-green-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'salary' && <SalaryPaymentsList />}
          {activeTab === 'extra' && <ExtraPaymentsList />}
          {activeTab === 'income' && <ClubIncomeList />}
        </div>
      </div>

      {showForm && canCreate && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {activeTab === 'salary'
                ? 'Record Salary Payment'
                : activeTab === 'extra'
                ? 'Record Extra Payment'
                : 'Record Club Income'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab !== 'income' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Member</label>
                  <select
                    value={formData.member_id}
                    onChange={(e) => {
                      const selectedMember = members.find((m) => m.id === e.target.value);
                      setFormData({
                        ...formData,
                        member_id: e.target.value,
                        amount: activeTab === 'salary' ? selectedMember?.monthly_salary.toString() || '' : '',
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Choose a member</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
                  value={formData.payment_date}
                  onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              {activeTab === 'salary' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                  <input
                    type="text"
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., January 2024"
                    required
                  />
                </div>
              )}

              {activeTab === 'extra' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., Bonus, Transport"
                    required
                  />
                </div>
              )}

              {activeTab === 'income' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                  <input
                    type="text"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., Sponsorship, Ticket Sales"
                    required
                  />
                </div>
              )}

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
                  Record
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
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

function SalaryPaymentsList() {
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    amount: '',
    payment_date: '',
    month: '',
    notes: '',
  });

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    setLoading(true);
    setErrorMessage('');
    const { data, error } = await supabase
      .from('salary_payments')
      .select('*, members(full_name)')
      .order('payment_date', { ascending: false });
    if (error) {
      setErrorMessage(error.message);
      setPayments([]);
      setLoading(false);
      return;
    }
    setPayments(data || []);
    setLoading(false);
  };

  const handleEdit = async (payment: any) => {
    if (!isAdmin) return;
    setEditingPayment(payment);
    setFormData({
      amount: String(payment.amount ?? ''),
      payment_date: payment.payment_date || '',
      month: payment.month || '',
      notes: payment.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (paymentId: string) => {
    if (!isAdmin) return;
    if (!confirm('Delete this salary payment?')) return;

    const { error } = await supabase.from('salary_payments').delete().eq('id', paymentId);
    if (error) {
      setErrorMessage(error.message);
      return;
    }

    await loadPayments();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;

    const { error } = await supabase
      .from('salary_payments')
      .update({
        amount: Number(formData.amount),
        month: formData.month,
        payment_date: formData.payment_date,
        notes: formData.notes,
      })
      .eq('id', editingPayment.id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setShowForm(false);
    setEditingPayment(null);
    await loadPayments();
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (errorMessage) {
    return <div className="text-center py-8 text-red-600">{errorMessage}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
            {isAdmin && (
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {payments.length === 0 ? (
            <tr>
              <td colSpan={isAdmin ? 5 : 4} className="px-4 py-8 text-center text-gray-500">
                No payments recorded
              </td>
            </tr>
          ) : (
            payments.map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">{formatDate(payment.payment_date)}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{payment.members?.full_name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{payment.month}</td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">
                  {formatCurrency(Number(payment.amount))}
                </td>
                {isAdmin && (
                  <td className="px-4 py-3 text-sm text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => void handleEdit(payment)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => void handleDelete(payment.id)}
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

      {showForm && isAdmin && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Salary Payment</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (TZS)</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, payment_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <input
                  type="text"
                  value={formData.month}
                  onChange={(e) => setFormData((prev) => ({ ...prev, month: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingPayment(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
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

function ExtraPaymentsList() {
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    amount: '',
    payment_date: '',
    category: '',
    notes: '',
  });

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    setLoading(true);
    setErrorMessage('');
    const { data, error } = await supabase
      .from('extra_payments')
      .select('*, members(full_name)')
      .order('payment_date', { ascending: false });
    if (error) {
      setErrorMessage(error.message);
      setPayments([]);
      setLoading(false);
      return;
    }
    setPayments(data || []);
    setLoading(false);
  };

  const handleEdit = (payment: any) => {
    if (!isAdmin) return;
    setEditingPayment(payment);
    setFormData({
      amount: String(payment.amount ?? ''),
      payment_date: payment.payment_date || '',
      category: payment.category || '',
      notes: payment.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (paymentId: string) => {
    if (!isAdmin) return;
    if (!confirm('Delete this extra payment?')) return;
    const { error } = await supabase.from('extra_payments').delete().eq('id', paymentId);
    if (error) {
      setErrorMessage(error.message);
      return;
    }
    await loadPayments();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;
    const { error } = await supabase
      .from('extra_payments')
      .update({
        amount: Number(formData.amount),
        payment_date: formData.payment_date,
        category: formData.category,
        notes: formData.notes,
      })
      .eq('id', editingPayment.id);
    if (error) {
      setErrorMessage(error.message);
      return;
    }
    setShowForm(false);
    setEditingPayment(null);
    await loadPayments();
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (errorMessage) {
    return <div className="text-center py-8 text-red-600">{errorMessage}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
            {isAdmin && (
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {payments.length === 0 ? (
            <tr>
              <td colSpan={isAdmin ? 5 : 4} className="px-4 py-8 text-center text-gray-500">
                No payments recorded
              </td>
            </tr>
          ) : (
            payments.map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">{formatDate(payment.payment_date)}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{payment.members?.full_name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{payment.category}</td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">
                  {formatCurrency(Number(payment.amount))}
                </td>
                {isAdmin && (
                  <td className="px-4 py-3 text-sm text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(payment)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => void handleDelete(payment.id)}
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

      {showForm && isAdmin && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Extra Payment</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (TZS)</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, payment_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingPayment(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
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

function ClubIncomeList() {
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const [income, setIncome] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    amount: '',
    income_date: '',
    source: '',
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
      setIncome([]);
      setLoading(false);
      return;
    }
    setIncome(data || []);
    setLoading(false);
  };

  const handleEdit = (item: any) => {
    if (!isAdmin) return;
    setEditingIncome(item);
    setFormData({
      amount: String(item.amount ?? ''),
      income_date: item.income_date || '',
      source: item.source || '',
      notes: item.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (incomeId: string) => {
    if (!isAdmin) return;
    if (!confirm('Delete this income record?')) return;
    const { error } = await supabase.from('club_income').delete().eq('id', incomeId);
    if (error) {
      setErrorMessage(error.message);
      return;
    }
    await loadIncome();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIncome) return;
    const { error } = await supabase
      .from('club_income')
      .update({
        amount: Number(formData.amount),
        income_date: formData.income_date,
        source: formData.source,
        notes: formData.notes,
      })
      .eq('id', editingIncome.id);
    if (error) {
      setErrorMessage(error.message);
      return;
    }
    setShowForm(false);
    setEditingIncome(null);
    await loadIncome();
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (errorMessage) {
    return <div className="text-center py-8 text-red-600">{errorMessage}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
            {isAdmin && (
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {income.length === 0 ? (
            <tr>
              <td colSpan={isAdmin ? 5 : 4} className="px-4 py-8 text-center text-gray-500">
                No income recorded
              </td>
            </tr>
          ) : (
            income.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">{formatDate(item.income_date)}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{item.source}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{item.notes}</td>
                <td className="px-4 py-3 text-sm text-green-600 text-right font-medium">
                  {formatCurrency(Number(item.amount))}
                </td>
                {isAdmin && (
                  <td className="px-4 py-3 text-sm text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => void handleDelete(item.id)}
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

      {showForm && isAdmin && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Club Income</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                <input
                  type="text"
                  value={formData.source}
                  onChange={(e) => setFormData((prev) => ({ ...prev, source: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (TZS)</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={formData.income_date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, income_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingIncome(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
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
