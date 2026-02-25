import { useEffect, useState } from 'react';
import { Shield, UserCog, UserX, UserCheck, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { formatDate } from '../lib/utils';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  blocked_at: string | null;
  blocked_reason: string;
  created_at: string;
}

export default function Users() {
  const { user, role } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createData, setCreateData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'staff' as UserRole,
  });

  useEffect(() => {
    void loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setErrorMessage('');

    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, email, full_name, role, is_active, blocked_at, blocked_reason, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setUsers((data as UserProfile[]) || []);
    setLoading(false);
  };

  const updateRole = async (targetUser: UserProfile, nextRole: UserRole) => {
    if (targetUser.id === user?.id && nextRole !== 'admin') {
      setErrorMessage('You cannot remove your own admin role.');
      return;
    }

    setSavingId(targetUser.id);
    const { error } = await supabase
      .from('user_profiles')
      .update({ role: nextRole, updated_at: new Date().toISOString() })
      .eq('id', targetUser.id);

    if (error) {
      setErrorMessage(error.message);
      setSavingId(null);
      return;
    }

    setUsers((prev) =>
      prev.map((item) => (item.id === targetUser.id ? { ...item, role: nextRole } : item))
    );
    setSavingId(null);
  };

  const toggleUserStatus = async (targetUser: UserProfile, nextActive: boolean) => {
    if (targetUser.id === user?.id && !nextActive) {
      setErrorMessage('You cannot block your own account.');
      return;
    }

    const reason = !nextActive ? prompt('Reason for blocking (optional):', targetUser.blocked_reason || '') || '' : '';

    setSavingId(targetUser.id);
    const { error } = await supabase.rpc('admin_set_user_active', {
      p_user_id: targetUser.id,
      p_is_active: nextActive,
      p_reason: reason,
    });

    if (error) {
      setErrorMessage(error.message);
      setSavingId(null);
      return;
    }

    setUsers((prev) =>
      prev.map((item) =>
        item.id === targetUser.id
          ? {
              ...item,
              is_active: nextActive,
              blocked_at: nextActive ? null : new Date().toISOString(),
              blocked_reason: nextActive ? '' : reason,
            }
          : item
      )
    );
    setSavingId(null);
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setCreateLoading(true);

    const { error } = await supabase.rpc('admin_create_user', {
      p_email: createData.email,
      p_password: createData.password,
      p_full_name: createData.full_name,
      p_role: createData.role,
    });

    if (error) {
      setErrorMessage(error.message);
      setCreateLoading(false);
      return;
    }

    setCreateData({ full_name: '', email: '', password: '', role: 'staff' });
    setCreateLoading(false);
    await loadUsers();
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (role !== 'admin') {
    return <div className="text-center py-8 text-gray-600">You do not have permission to view this page.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <p className="text-sm text-gray-600 mt-1">Register users, assign roles, and block or activate accounts</p>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Register New User</h3>
        <form onSubmit={createUser} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            value={createData.full_name}
            onChange={(e) => setCreateData((prev) => ({ ...prev, full_name: e.target.value }))}
            placeholder="Full name"
            className="px-3 py-2 border border-gray-300 rounded-lg"
            required
          />
          <input
            type="email"
            value={createData.email}
            onChange={(e) => setCreateData((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="Email"
            className="px-3 py-2 border border-gray-300 rounded-lg"
            required
          />
          <input
            type="password"
            value={createData.password}
            onChange={(e) => setCreateData((prev) => ({ ...prev, password: e.target.value }))}
            placeholder="Temporary password"
            className="px-3 py-2 border border-gray-300 rounded-lg"
            minLength={6}
            required
          />
          <div className="flex gap-2">
            <select
              value={createData.role}
              onChange={(e) => setCreateData((prev) => ({ ...prev, role: e.target.value as UserRole }))}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="staff">Staff</option>
              <option value="finance">Finance</option>
              <option value="admin">Admin</option>
            </select>
            <button
              type="submit"
              disabled={createLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <span className="inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                {createLoading ? 'Creating...' : 'Create'}
              </span>
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((profile) => (
                <tr key={profile.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      {profile.role === 'admin' ? (
                        <Shield className="w-4 h-4 text-amber-600" />
                      ) : (
                        <UserCog className="w-4 h-4 text-blue-600" />
                      )}
                      <span className="font-medium">{profile.full_name || 'No Name'}</span>
                      {profile.id === user?.id && (
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">You</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{profile.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <select
                      value={profile.role}
                      onChange={(e) => void updateRole(profile, e.target.value as UserRole)}
                      disabled={savingId === profile.id || !profile.is_active}
                      className="px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="staff">Staff</option>
                      <option value="finance">Finance</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {profile.is_active ? (
                      <span className="inline-flex px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                        Blocked
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatDate(profile.created_at)}</td>
                  <td className="px-6 py-4 text-sm text-right">
                    {profile.is_active ? (
                      <button
                        onClick={() => void toggleUserStatus(profile, false)}
                        disabled={savingId === profile.id || profile.id === user?.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-md bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        Block
                      </button>
                    ) : (
                      <button
                        onClick={() => void toggleUserStatus(profile, true)}
                        disabled={savingId === profile.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-md bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Activate
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
