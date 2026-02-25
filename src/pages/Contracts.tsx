import { useEffect, useMemo, useState } from 'react';
import { Plus, Edit2, Download, Ban, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatDate } from '../lib/utils';
import { generateContractAgreement } from '../lib/pdfGenerator';
import { useAuth } from '../contexts/AuthContext';

type ContractType = 'player' | 'staff';
type ContractStatus = 'draft' | 'active' | 'expired' | 'terminated';

interface Member {
  id: string;
  full_name: string;
  id_no: string | null;
  member_type: ContractType;
  role: string;
  monthly_salary: number;
  registration_fee: number;
}

interface ContractRecord {
  id: string;
  member_id: string;
  contract_no: string;
  contract_type: ContractType;
  position_title: string;
  start_date: string;
  end_date: string;
  monthly_allowance: number;
  registration_fee: number;
  status: ContractStatus;
  termination_reason: string;
  terminated_at: string | null;
  notes: string;
  member_signed_name: string;
  member_signed_date: string | null;
  club_signed_name: string;
  club_signed_date: string | null;
  created_at: string;
  updated_at: string;
  members?: Member;
}

const defaultFormData = {
  member_id: '',
  contract_no: '',
  contract_type: 'player' as ContractType,
  position_title: '',
  start_date: new Date().toISOString().split('T')[0],
  end_date: '',
  monthly_allowance: '',
  registration_fee: '',
  status: 'draft' as ContractStatus,
  notes: '',
  member_signed_name: '',
  member_signed_date: '',
  club_signed_name: 'Fahari Football Club',
  club_signed_date: '',
};

export default function Contracts() {
  const { role } = useAuth();
  const canCreate = role === 'admin' || role === 'staff';
  const isAdmin = role === 'admin';
  const [contracts, setContracts] = useState<ContractRecord[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingContract, setEditingContract] = useState<ContractRecord | null>(null);
  const [filter, setFilter] = useState<'all' | ContractType>('all');
  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    loadContracts();
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setErrorMessage('');
    const { data, error } = await supabase
      .from('members')
      .select('id, full_name, id_no, member_type, role, monthly_salary, registration_fee')
      .order('full_name');
    if (error) {
      setErrorMessage(error.message);
      setMembers([]);
      return;
    }

    setMembers((data as Member[]) || []);
  };

  const loadContracts = async () => {
    setLoading(true);
    setErrorMessage('');

    const { data, error } = await supabase
      .from('contracts')
      .select('*, members(id, full_name, id_no, member_type, role, monthly_salary, registration_fee)')
      .order('created_at', { ascending: false });
    if (error) {
      setErrorMessage(error.message);
      setContracts([]);
      setLoading(false);
      return;
    }

    setContracts((data as ContractRecord[]) || []);
    setLoading(false);
  };

  const filteredContracts = useMemo(() => {
    if (filter === 'all') return contracts;
    return contracts.filter((contract) => contract.contract_type === filter);
  }, [contracts, filter]);

  const generateContractNumber = async (contractType: ContractType) => {
    const year = new Date().getFullYear();
    const code = contractType === 'player' ? 'PLY' : 'STF';

    const { count } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .eq('contract_type', contractType);

    const nextSequence = (count || 0) + 1;
    return `FFC-${code}-${year}-${String(nextSequence).padStart(3, '0')}`;
  };

  const handleMemberChange = async (memberId: string) => {
    const selectedMember = members.find((member) => member.id === memberId);

    if (!selectedMember) {
      setFormData({ ...formData, member_id: memberId });
      return;
    }

    const generatedNo = editingContract
      ? formData.contract_no
      : await generateContractNumber(selectedMember.member_type);

    setFormData((prev) => ({
      ...prev,
      member_id: memberId,
      contract_type: selectedMember.member_type,
      position_title: selectedMember.role,
      monthly_allowance: selectedMember.monthly_salary.toString(),
      registration_fee:
        selectedMember.member_type === 'player'
          ? Number(selectedMember.registration_fee ?? 0).toString()
          : '0',
      contract_no: generatedNo,
      member_signed_name: selectedMember.full_name,
    }));
  };

  const openCreateForm = async () => {
    if (!canCreate) {
      setErrorMessage('You do not have permission to create contracts.');
      return;
    }
    setEditingContract(null);
    setFormData(defaultFormData);
    setShowForm(true);
  };

  const handleEdit = (contract: ContractRecord) => {
    if (!isAdmin) {
      setErrorMessage('Only admins can edit contracts.');
      return;
    }

    setEditingContract(contract);
    setFormData({
      member_id: contract.member_id,
      contract_no: contract.contract_no,
      contract_type: contract.contract_type,
      position_title: contract.position_title || '',
      start_date: contract.start_date,
      end_date: contract.end_date,
      monthly_allowance: String(contract.monthly_allowance),
      registration_fee: String(contract.registration_fee),
      status: contract.status,
      notes: contract.notes || '',
      member_signed_name: contract.member_signed_name || contract.members?.full_name || '',
      member_signed_date: contract.member_signed_date || '',
      club_signed_name: contract.club_signed_name || 'Fahari Football Club',
      club_signed_date: contract.club_signed_date || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingContract && !isAdmin) {
      setErrorMessage('Only admins can update contracts.');
      return;
    }
    if (!editingContract && !canCreate) {
      setErrorMessage('You do not have permission to create contracts.');
      return;
    }
    setErrorMessage('');

    if (!formData.member_id) {
      alert('Please select a member first.');
      return;
    }

    const payload = {
      member_id: formData.member_id,
      contract_no: formData.contract_no,
      contract_type: formData.contract_type,
      position_title: formData.position_title,
      start_date: formData.start_date,
      end_date: formData.end_date,
      monthly_allowance: parseFloat(formData.monthly_allowance) || 0,
      registration_fee: parseFloat(formData.registration_fee) || 0,
      status: formData.status,
      notes: formData.notes,
      member_signed_name: formData.member_signed_name,
      member_signed_date: formData.member_signed_date || null,
      club_signed_name: formData.club_signed_name,
      club_signed_date: formData.club_signed_date || null,
      terminated_at: formData.status === 'terminated' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    const result = editingContract
      ? await supabase.from('contracts').update(payload).eq('id', editingContract.id)
      : await supabase.from('contracts').insert(payload);

    if (result.error) {
      alert(result.error.message);
      return;
    }

    setShowForm(false);
    setEditingContract(null);
    setFormData(defaultFormData);
    loadContracts();
  };

  const handleActivate = async (contract: ContractRecord) => {
    if (!isAdmin) {
      setErrorMessage('Only admins can activate contracts.');
      return;
    }

    const { error } = await supabase
      .from('contracts')
      .update({ status: 'active', termination_reason: '', terminated_at: null, updated_at: new Date().toISOString() })
      .eq('id', contract.id);

    if (error) {
      alert(error.message);
      return;
    }

    loadContracts();
  };

  const handleTerminate = async (contract: ContractRecord) => {
    if (!isAdmin) {
      setErrorMessage('Only admins can terminate contracts.');
      return;
    }

    const reason = prompt('Termination reason (optional):', contract.termination_reason || '');
    if (reason === null) return;

    const { error } = await supabase
      .from('contracts')
      .update({
        status: 'terminated',
        termination_reason: reason,
        terminated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', contract.id);

    if (error) {
      alert(error.message);
      return;
    }

    loadContracts();
  };

  const handleDownload = (contract: ContractRecord) => {
    if (!contract.members) {
      alert('Member details missing for this contract.');
      return;
    }

    generateContractAgreement(contract, contract.members);
  };

  const getStatusClass = (status: ContractStatus) => {
    if (status === 'active') return 'bg-green-100 text-green-800';
    if (status === 'draft') return 'bg-gray-100 text-gray-800';
    if (status === 'expired') return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Contracts</h2>
          <p className="text-sm text-gray-600 mt-1">Manage player and staff agreements</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | ContractType)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Contracts</option>
            <option value="player">Players</option>
            <option value="staff">Staff</option>
          </select>

          {canCreate && (
          <button
            onClick={openCreateForm}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <Plus className="w-5 h-5" />
            <span>New Contract</span>
          </button>
          )}
        </div>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contract No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monthly</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredContracts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No contracts found
                </td>
              </tr>
            ) : (
              filteredContracts.map((contract) => (
                <tr key={contract.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{contract.contract_no}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>{contract.members?.full_name || '-'}</div>
                    <div className="text-xs text-gray-500">ID: {contract.members?.id_no || '-'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 capitalize">{contract.contract_type}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {formatDate(contract.start_date)} - {formatDate(contract.end_date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(Number(contract.monthly_allowance))}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(contract.status)}`}>
                      {contract.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleDownload(contract)}
                        className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                        title="Download Contract"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleEdit(contract)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Edit Contract"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {isAdmin && contract.status !== 'active' && (
                        <button
                          onClick={() => handleActivate(contract)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Activate Contract"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {isAdmin && contract.status !== 'terminated' && (
                        <button
                          onClick={() => handleTerminate(contract)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Terminate Contract"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && canCreate && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 my-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingContract ? 'Edit Contract' : 'Create Contract'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Member</label>
                  <select
                    value={formData.member_id}
                    onChange={(e) => {
                      void handleMemberChange(e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                    disabled={!!editingContract}
                  >
                    <option value="">Choose member</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.full_name} ({member.member_type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contract No</label>
                  <input
                    type="text"
                    value={formData.contract_no}
                    onChange={(e) => setFormData({ ...formData, contract_no: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contract Type</label>
                  <input
                    type="text"
                    value={formData.contract_type === 'player' ? 'Player Contract' : 'Staff Contract'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ContractStatus })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Allowance (TZS)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.monthly_allowance}
                    onChange={(e) => setFormData({ ...formData, monthly_allowance: e.target.value })}
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
                    required={formData.contract_type === 'player'}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position / Role</label>
                  <input
                    type="text"
                    value={formData.position_title}
                    onChange={(e) => setFormData({ ...formData, position_title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., Striker, Coach"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Member Signed Name</label>
                  <input
                    type="text"
                    value={formData.member_signed_name}
                    onChange={(e) => setFormData({ ...formData, member_signed_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Member Signed Date</label>
                  <input
                    type="date"
                    value={formData.member_signed_date}
                    onChange={(e) => setFormData({ ...formData, member_signed_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Club Signed Name</label>
                  <input
                    type="text"
                    value={formData.club_signed_name}
                    onChange={(e) => setFormData({ ...formData, club_signed_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Club Signed Date</label>
                  <input
                    type="date"
                    value={formData.club_signed_date}
                    onChange={(e) => setFormData({ ...formData, club_signed_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
                >
                  {editingContract ? 'Update Contract' : 'Create Contract'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingContract(null);
                    setFormData(defaultFormData);
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
