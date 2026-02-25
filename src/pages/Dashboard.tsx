import { useEffect, useState } from 'react';
import { Users, Briefcase, TrendingUp, TrendingDown, DollarSign, Trophy } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatDate } from '../lib/utils';

interface Stats {
  totalPlayers: number;
  totalStaff: number;
  totalSalariesPaid: number;
  totalExtraPayments: number;
  totalMatchExpenses: number;
  totalOtherExpenses: number;
  totalIncome: number;
  netBalance: number;
}

interface Transaction {
  id: string;
  type: string;
  description: string;
  amount: number;
  date: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalPlayers: 0,
    totalStaff: 0,
    totalSalariesPaid: 0,
    totalExtraPayments: 0,
    totalMatchExpenses: 0,
    totalOtherExpenses: 0,
    totalIncome: 0,
    netBalance: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);

    const [
      { count: playerCount },
      { count: staffCount },
      { data: salaries },
      { data: extras },
      { data: matches },
      { data: otherExpenses },
      { data: income },
      { data: recentSalaries },
      { data: recentExtras },
      { data: recentOtherExpenses },
      { data: recentIncome },
    ] = await Promise.all([
      supabase.from('members').select('*', { count: 'exact', head: true }).eq('member_type', 'player'),
      supabase.from('members').select('*', { count: 'exact', head: true }).eq('member_type', 'staff'),
      supabase.from('salary_payments').select('amount'),
      supabase.from('extra_payments').select('amount'),
      supabase.from('match_expenses').select('amount'),
      supabase.from('other_expenses').select('amount'),
      supabase.from('club_income').select('amount'),
      supabase.from('salary_payments').select('*, members(full_name)').order('payment_date', { ascending: false }).limit(5),
      supabase.from('extra_payments').select('*, members(full_name)').order('payment_date', { ascending: false }).limit(5),
      supabase.from('other_expenses').select('*').order('expense_date', { ascending: false }).limit(5),
      supabase.from('club_income').select('*').order('income_date', { ascending: false }).limit(5),
    ]);

    const totalSalariesPaid = salaries?.reduce((sum, s) => sum + Number(s.amount), 0) || 0;
    const totalExtraPayments = extras?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
    const totalMatchExpenses = matches?.reduce((sum, m) => sum + Number(m.amount), 0) || 0;
    const totalOtherExpenses = otherExpenses?.reduce((sum, o) => sum + Number(o.amount), 0) || 0;
    const totalIncome = income?.reduce((sum, i) => sum + Number(i.amount), 0) || 0;

    setStats({
      totalPlayers: playerCount || 0,
      totalStaff: staffCount || 0,
      totalSalariesPaid,
      totalExtraPayments,
      totalMatchExpenses,
      totalOtherExpenses,
      totalIncome,
      netBalance: totalIncome - (totalSalariesPaid + totalExtraPayments + totalMatchExpenses + totalOtherExpenses),
    });

    const allTransactions: Transaction[] = [
      ...(recentSalaries?.map((s: any) => ({
        id: s.id,
        type: 'salary',
        description: `Salary payment to ${s.members?.full_name}`,
        amount: -Number(s.amount),
        date: s.payment_date,
      })) || []),
      ...(recentExtras?.map((e: any) => ({
        id: e.id,
        type: 'extra',
        description: `${e.category} for ${e.members?.full_name}`,
        amount: -Number(e.amount),
        date: e.payment_date,
      })) || []),
      ...(recentIncome?.map((i: any) => ({
        id: i.id,
        type: 'income',
        description: i.source,
        amount: Number(i.amount),
        date: i.income_date,
      })) || []),
      ...(recentOtherExpenses?.map((o: any) => ({
        id: o.id,
        type: 'other_expense',
        description: `${o.category}: ${o.expense_item}`,
        amount: -Number(o.amount),
        date: o.expense_date,
      })) || []),
    ];

    allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setTransactions(allTransactions.slice(0, 10));

    setLoading(false);
  };

  const statCards = [
    { label: 'Total Players', value: stats.totalPlayers, icon: Users, color: 'blue' },
    { label: 'Total Staff', value: stats.totalStaff, icon: Briefcase, color: 'purple' },
    { label: 'Salaries Paid', value: formatCurrency(stats.totalSalariesPaid), icon: DollarSign, color: 'red' },
    { label: 'Extra Payments', value: formatCurrency(stats.totalExtraPayments), icon: DollarSign, color: 'orange' },
    { label: 'Match Expenses', value: formatCurrency(stats.totalMatchExpenses), icon: Trophy, color: 'indigo' },
    { label: 'Other Expenses', value: formatCurrency(stats.totalOtherExpenses), icon: DollarSign, color: 'yellow' },
    { label: 'Total Income', value: formatCurrency(stats.totalIncome), icon: TrendingUp, color: 'green' },
    {
      label: 'Net Balance',
      value: formatCurrency(stats.netBalance),
      icon: stats.netBalance >= 0 ? TrendingUp : TrendingDown,
      color: stats.netBalance >= 0 ? 'green' : 'red',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string; text: string }> = {
      blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
      red: { bg: 'bg-red-100', text: 'text-red-600' },
      orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
      indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
      yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
      green: { bg: 'bg-green-100', text: 'text-green-600' },
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          const colors = getColorClasses(card.color);
          return (
            <div key={card.label} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
                <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${colors.text}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No transactions yet
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{formatDate(transaction.date)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{transaction.description}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          transaction.type === 'income'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {transaction.type === 'income' ? 'Income' : 'Expense'}
                      </span>
                    </td>
                    <td
                      className={`px-6 py-4 text-sm font-medium text-right ${
                        transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {transaction.amount >= 0 ? '+' : ''}
                      {formatCurrency(transaction.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
