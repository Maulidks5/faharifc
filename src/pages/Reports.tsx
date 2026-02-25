import { useEffect, useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  generateMemberReport,
  generateAllMembersReport,
  generateMatchExpensesReport,
  generateOtherExpensesReport,
  generateFinancialSummaryReport,
} from '../lib/pdfGenerator';

interface Member {
  id: string;
  full_name: string;
  role: string;
  member_type: string;
  monthly_salary: number;
}

type DateFilter = 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';

export default function Reports() {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setErrorMessage('');
    const { data, error } = await supabase.from('members').select('*').order('full_name');
    if (error) {
      setErrorMessage(error.message);
      setMembers([]);
      return;
    }
    setMembers(data || []);
  };

  const getDateRange = (): { startDate: string | null; endDate: string | null } => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (dateFilter) {
      case 'today':
        return {
          startDate: today.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
        };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        return {
          startDate: weekStart.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
        };
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
          startDate: monthStart.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
        };
      case 'year':
        const yearStart = new Date(now.getFullYear(), 0, 1);
        return {
          startDate: yearStart.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
        };
      case 'custom':
        return {
          startDate: customStartDate || null,
          endDate: customEndDate || null,
        };
      default:
        return { startDate: null, endDate: null };
    }
  };

  const handleIndividualMemberReport = async () => {
    if (!selectedMember) {
      alert('Please select a member');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    const member = members.find((m) => m.id === selectedMember);
    const { startDate, endDate } = getDateRange();

    let salaryQuery = supabase.from('salary_payments').select('*').eq('member_id', selectedMember);
    let extraQuery = supabase.from('extra_payments').select('*').eq('member_id', selectedMember);

    if (startDate) {
      salaryQuery = salaryQuery.gte('payment_date', startDate);
      extraQuery = extraQuery.gte('payment_date', startDate);
    }
    if (endDate) {
      salaryQuery = salaryQuery.lte('payment_date', endDate);
      extraQuery = extraQuery.lte('payment_date', endDate);
    }

    const [{ data: salaryPayments, error: salaryError }, { data: extraPayments, error: extraError }] = await Promise.all([
      salaryQuery.order('payment_date', { ascending: false }),
      extraQuery.order('payment_date', { ascending: false }),
    ]);
    if (salaryError || extraError) {
      setErrorMessage(salaryError?.message || extraError?.message || 'Failed to generate member report.');
      setLoading(false);
      return;
    }

    generateMemberReport(member, salaryPayments || [], extraPayments || [], startDate, endDate);
    setLoading(false);
  };

  const handleAllPlayersReport = async () => {
    setLoading(true);
    setErrorMessage('');
    const { data, error } = await supabase.from('members').select('*').eq('member_type', 'player').order('full_name');
    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }
    generateAllMembersReport(data || [], 'player');
    setLoading(false);
  };

  const handleAllStaffReport = async () => {
    setLoading(true);
    setErrorMessage('');
    const { data, error } = await supabase.from('members').select('*').eq('member_type', 'staff').order('full_name');
    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }
    generateAllMembersReport(data || [], 'staff');
    setLoading(false);
  };

  const handleMatchExpensesReport = async () => {
    setLoading(true);
    setErrorMessage('');
    const { startDate, endDate } = getDateRange();

    let query = supabase.from('match_expenses').select('*');

    if (startDate) {
      query = query.gte('match_date', startDate);
    }
    if (endDate) {
      query = query.lte('match_date', endDate);
    }

    const { data, error } = await query.order('match_date', { ascending: false });
    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }
    generateMatchExpensesReport(data || [], startDate, endDate);
    setLoading(false);
  };

  const handleFinancialSummaryReport = async () => {
    setLoading(true);
    setErrorMessage('');
    const { startDate, endDate } = getDateRange();

    let salariesQuery = supabase.from('salary_payments').select('amount');
    let extrasQuery = supabase.from('extra_payments').select('amount');
    let matchesQuery = supabase.from('match_expenses').select('amount');
    let otherExpensesQuery = supabase.from('other_expenses').select('amount');
    let incomeQuery = supabase.from('club_income').select('amount');

    if (startDate) {
      salariesQuery = salariesQuery.gte('payment_date', startDate);
      extrasQuery = extrasQuery.gte('payment_date', startDate);
      matchesQuery = matchesQuery.gte('match_date', startDate);
      otherExpensesQuery = otherExpensesQuery.gte('expense_date', startDate);
      incomeQuery = incomeQuery.gte('income_date', startDate);
    }
    if (endDate) {
      salariesQuery = salariesQuery.lte('payment_date', endDate);
      extrasQuery = extrasQuery.lte('payment_date', endDate);
      matchesQuery = matchesQuery.lte('match_date', endDate);
      otherExpensesQuery = otherExpensesQuery.lte('expense_date', endDate);
      incomeQuery = incomeQuery.lte('income_date', endDate);
    }

    const [
      { count: playerCount, error: playerCountError },
      { count: staffCount, error: staffCountError },
      { data: salaries, error: salariesError },
      { data: extras, error: extrasError },
      { data: matches, error: matchesError },
      { data: otherExpenses, error: otherExpensesError },
      { data: income, error: incomeError },
    ] = await Promise.all([
      supabase.from('members').select('*', { count: 'exact', head: true }).eq('member_type', 'player'),
      supabase.from('members').select('*', { count: 'exact', head: true }).eq('member_type', 'staff'),
      salariesQuery,
      extrasQuery,
      matchesQuery,
      otherExpensesQuery,
      incomeQuery,
    ]);
    const firstError =
      playerCountError ||
      staffCountError ||
      salariesError ||
      extrasError ||
      matchesError ||
      otherExpensesError ||
      incomeError;
    if (firstError) {
      setErrorMessage(firstError.message);
      setLoading(false);
      return;
    }

    const data = {
      totalPlayers: playerCount || 0,
      totalStaff: staffCount || 0,
      totalSalariesPaid: salaries?.reduce((sum, s) => sum + Number(s.amount), 0) || 0,
      totalExtraPayments: extras?.reduce((sum, e) => sum + Number(e.amount), 0) || 0,
      totalMatchExpenses: matches?.reduce((sum, m) => sum + Number(m.amount), 0) || 0,
      totalOtherExpenses: otherExpenses?.reduce((sum, o) => sum + Number(o.amount), 0) || 0,
      totalIncome: income?.reduce((sum, i) => sum + Number(i.amount), 0) || 0,
    };

    generateFinancialSummaryReport(data, startDate, endDate);
    setLoading(false);
  };

  const handleOtherExpensesReport = async () => {
    setLoading(true);
    setErrorMessage('');
    const { startDate, endDate } = getDateRange();

    let query = supabase.from('other_expenses').select('*');

    if (startDate) {
      query = query.gte('expense_date', startDate);
    }
    if (endDate) {
      query = query.lte('expense_date', endDate);
    }

    const { data, error } = await query.order('expense_date', { ascending: false });
    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }
    generateOtherExpensesReport(data || [], startDate, endDate);
    setLoading(false);
  };

  const reportCards = [
    {
      title: 'Individual Member Report',
      description: 'Generate detailed financial report for a specific member',
      action: handleIndividualMemberReport,
      color: 'blue',
      hasSelect: true,
    },
    {
      title: 'All Players Report',
      description: 'Generate report for all players with salary information',
      action: handleAllPlayersReport,
      color: 'green',
      hasSelect: false,
    },
    {
      title: 'All Staff Report',
      description: 'Generate report for all staff members with salary information',
      action: handleAllStaffReport,
      color: 'purple',
      hasSelect: false,
    },
    {
      title: 'Match Expenses Report',
      description: 'Generate detailed report of all match-related expenses',
      action: handleMatchExpensesReport,
      color: 'orange',
      hasSelect: false,
    },
    {
      title: 'Financial Summary Report',
      description: 'Generate comprehensive club financial overview',
      action: handleFinancialSummaryReport,
      color: 'red',
      hasSelect: false,
    },
    {
      title: 'Other Expenses Report',
      description: 'Generate detailed report of all non-match expenses',
      action: handleOtherExpensesReport,
      color: 'indigo',
      hasSelect: false,
    },
  ];

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string; text: string }> = {
      blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
      green: { bg: 'bg-green-100', text: 'text-green-600' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
      orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
      red: { bg: 'bg-red-100', text: 'text-red-600' },
      indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
        <p className="text-gray-600 mt-1">Generate and download professional PDF reports</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Filter</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilter)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {dateFilter === 'custom' && (
            <>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {reportCards.map((card) => {
          const colors = getColorClasses(card.color);
          return (
            <div key={card.title} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <FileText className={`w-6 h-6 ${colors.text}`} />
                </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{card.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{card.description}</p>

                {card.hasSelect && (
                  <select
                    value={selectedMember}
                    onChange={(e) => setSelectedMember(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent mb-4"
                  >
                    <option value="">Select a member</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.full_name} ({member.member_type === 'player' ? 'Player' : 'Staff'})
                      </option>
                    ))}
                  </select>
                )}

                <button
                  onClick={card.action}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  <span>{loading ? 'Generating...' : 'Generate PDF'}</span>
                </button>
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
