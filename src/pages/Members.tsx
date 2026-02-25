import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatDate } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

interface Member {
  id: string;
  full_name: string;
  id_no: string | null;
  date_of_birth: string;
  phone: string;
  role: string;
  member_type: string;
  monthly_salary: number;
  registration_fee: number;
}

interface MemberProfile {
  member: Member;
  salaryPayments: any[];
  extraPayments: any[];
  totalCost: number;
}

interface MembersProps {
  type: 'player' | 'staff';
}

export default function Members({ type }: MembersProps) {
  const { role } = useAuth();
  const canCreate = role === 'admin' || role === 'staff';
  const isAdmin = role === 'admin';
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [viewingProfile, setViewingProfile] = useState<MemberProfile | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    id_no: '',
    date_of_birth: '',
    phone: '',
    role: '',
    monthly_salary: '',
    registration_fee: '',
  });

  useEffect(() => {
    loadMembers();
  }, [type]);

  const loadMembers = async () => {
    setLoading(true);
    setErrorMessage('');
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('member_type', type)
      .order('full_name');
    if (error) {
      setErrorMessage(error.message);
      setMembers([]);
      setLoading(false);
      return;
    }
    setMembers(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMember && !isAdmin) {
      setErrorMessage('Only admins can update members.');
      return;
    }
    if (!editingMember && !canCreate) {
      setErrorMessage('You do not have permission to create members.');
      return;
    }
    setErrorMessage('');

    const memberData = {
      ...formData,
      member_type: type,
      monthly_salary: parseFloat(formData.monthly_salary),
      registration_fee: parseFloat(formData.registration_fee),
      id_no: formData.id_no || null,
    };

    if (editingMember) {
      const { error } = await supabase.from('members').update(memberData).eq('id', editingMember.id);
      if (error) {
        setErrorMessage(error.message);
        return;
      }
    } else {
      const { error } = await supabase.from('members').insert(memberData);
      if (error) {
        setErrorMessage(error.message);
        return;
      }
    }

    setShowForm(false);
    setEditingMember(null);
    setFormData({
      full_name: '',
      id_no: '',
      date_of_birth: '',
      phone: '',
      role: '',
      monthly_salary: '',
      registration_fee: '',
    });
    loadMembers();
  };

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    setFormData({
      full_name: member.full_name,
      id_no: member.id_no || '',
      date_of_birth: member.date_of_birth,
      phone: member.phone,
      role: member.role,
      monthly_salary: member.monthly_salary.toString(),
      registration_fee: Number(member.registration_fee ?? 0).toString(),
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) {
      setErrorMessage('Only admins can delete members.');
      return;
    }

    if (confirm('Are you sure you want to delete this member?')) {
      const { error } = await supabase.from('members').delete().eq('id', id);
      if (error) {
        setErrorMessage(error.message);
        return;
      }
      loadMembers();
    }
  };

  const handleViewProfile = async (member: Member) => {
    setErrorMessage('');
    const [{ data: salaryPayments, error: salaryError }, { data: extraPayments, error: extraError }] = await Promise.all([
      supabase.from('salary_payments').select('*').eq('member_id', member.id).order('payment_date', { ascending: false }),
      supabase.from('extra_payments').select('*').eq('member_id', member.id).order('payment_date', { ascending: false }),
    ]);
    if (salaryError || extraError) {
      setErrorMessage(salaryError?.message || extraError?.message || 'Failed to load member profile.');
      return;
    }

    const totalSalaries = salaryPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    const totalExtras = extraPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    setViewingProfile({
      member,
      salaryPayments: salaryPayments || [],
      extraPayments: extraPayments || [],
      totalCost: totalSalaries + totalExtras,
    });
    setShowProfile(true);
  };

  const title = type === 'player' ? 'Players' : 'Staff';

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {canCreate && (
        <button
          onClick={() => {
            setEditingMember(null);
            setFormData({
              full_name: '',
              id_no: '',
              date_of_birth: '',
              phone: '',
              role: '',
              monthly_salary: '',
              registration_fee: '',
            });
            setShowForm(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <Plus className="w-5 h-5" />
          <span>Add {type === 'player' ? 'Player' : 'Staff'}</span>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monthly Salary</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registration Fee</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {members.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No {title.toLowerCase()} found
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{member.full_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{member.id_no || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{member.role}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{member.phone}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(member.monthly_salary)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(Number(member.registration_fee ?? 0))}</td>
                  <td className="px-6 py-4 text-sm text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleViewProfile(member)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(member)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                        disabled={!isAdmin}
                        title={isAdmin ? 'Edit member' : 'Admin only'}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(member.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        disabled={!isAdmin}
                        title={isAdmin ? 'Delete member' : 'Admin only'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
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
              {editingMember ? 'Edit' : 'Add'} {type === 'player' ? 'Player' : 'Staff'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID No</label>
                <input
                  type="text"
                  value={formData.id_no}
                  onChange={(e) => setFormData({ ...formData, id_no: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., P001 or S001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder={type === 'player' ? 'e.g., Forward, Midfielder' : 'e.g., Coach, Manager'}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Salary (TZS)</label>
                <input
                  type="number"
                  value={formData.monthly_salary}
                  onChange={(e) => setFormData({ ...formData, monthly_salary: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registration Fee (TZS)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.registration_fee}
                  onChange={(e) => setFormData({ ...formData, registration_fee: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
                >
                  {editingMember ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingMember(null);
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

      {showProfile && viewingProfile && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6 my-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">{viewingProfile.member.full_name}</h3>

            <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-200">
              <div>
                <p className="text-sm text-gray-600">ID No</p>
                <p className="font-medium">{viewingProfile.member.id_no || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Role</p>
                <p className="font-medium">{viewingProfile.member.role}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date of Birth</p>
                <p className="font-medium">{formatDate(viewingProfile.member.date_of_birth)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium">{viewingProfile.member.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Monthly Salary</p>
                <p className="font-medium">{formatCurrency(viewingProfile.member.monthly_salary)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Registration Fee</p>
                <p className="font-medium">{formatCurrency(Number(viewingProfile.member.registration_fee ?? 0))}</p>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-bold text-gray-900 mb-3">Salary History</h4>
              <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                {viewingProfile.salaryPayments.length === 0 ? (
                  <p className="text-gray-500 text-sm">No salary payments recorded</p>
                ) : (
                  <div className="space-y-2">
                    {viewingProfile.salaryPayments.map((payment) => (
                      <div key={payment.id} className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">{payment.month}</p>
                          <p className="text-xs text-gray-600">{formatDate(payment.payment_date)}</p>
                        </div>
                        <p className="font-medium">{formatCurrency(Number(payment.amount))}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-bold text-gray-900 mb-3">Extra Payments</h4>
              <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                {viewingProfile.extraPayments.length === 0 ? (
                  <p className="text-gray-500 text-sm">No extra payments recorded</p>
                ) : (
                  <div className="space-y-2">
                    {viewingProfile.extraPayments.map((payment) => (
                      <div key={payment.id} className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">{payment.category}</p>
                          <p className="text-xs text-gray-600">{formatDate(payment.payment_date)}</p>
                        </div>
                        <p className="font-medium">{formatCurrency(Number(payment.amount))}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center">
                <p className="font-bold text-gray-900">Total Cost</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(viewingProfile.totalCost)}</p>
              </div>
            </div>

            <button
              onClick={() => {
                setShowProfile(false);
                setViewingProfile(null);
              }}
              className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
