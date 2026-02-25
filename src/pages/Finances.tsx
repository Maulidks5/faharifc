import { useEffect, useState } from 'react';
import { Plus, DollarSign, TrendingUp, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatDate } from '../lib/utils';

interface Member {
  id: string;
  full_name: string;
  monthly_salary: number;
}

export default function Finances() {
  const [activeTab, setActiveTab] = useState<'salary' | 'extra' | 'income'>('salary');
  const [members, setMembers] = useState<Member[]>([]);
  const [showForm, setShowForm] = useState(false);
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
    const { data } = await supabase.from('members').select('id, full_name, monthly_salary').order('full_name');
    setMembers(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === 'salary') {
      await supabase.from('salary_payments').insert({
        member_id: formData.member_id,
        amount: parseFloat(formData.amount),
        payment_date: formData.payment_date,
        month: formData.month,
        notes: formData.notes,
      });
    } else if (activeTab === 'extra') {
      await supabase.from('extra_payments').insert({
        member_id: formData.member_id,
        amount: parseFloat(formData.amount),
        payment_date: formData.payment_date,
        category: formData.category,
        notes: formData.notes,
      });
    } else if (activeTab === 'income') {
      await supabase.from('club_income').insert({
        amount: parseFloat(formData.amount),
        income_date: formData.payment_date,
        source: formData.source,
        notes: formData.notes,
      });
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
      </div>

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

      {showForm && (
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
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('salary_payments')
      .select('*, members(full_name)')
      .order('payment_date', { ascending: false });
    setPayments(data || []);
    setLoading(false);
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {payments.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
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
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function ExtraPaymentsList() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('extra_payments')
      .select('*, members(full_name)')
      .order('payment_date', { ascending: false });
    setPayments(data || []);
    setLoading(false);
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {payments.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
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
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function ClubIncomeList() {
  const [income, setIncome] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIncome();
  }, []);

  const loadIncome = async () => {
    setLoading(true);
    const { data } = await supabase.from('club_income').select('*').order('income_date', { ascending: false });
    setIncome(data || []);
    setLoading(false);
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {income.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
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
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
