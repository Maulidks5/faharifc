import { useEffect, useMemo, useState } from 'react';
import { Shield, UserCog, UserX, UserCheck, Plus, Edit2, KeyRound, Save, X } from 'lucide-react';
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

interface EditFormState {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
}

export default function Users() {
  const { user, role } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [createLoading, setCreateLoading] = useState(false);
  const [createData, setCreateData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'staff' as UserRole,
  });

  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    void loadUsers();
  }, []);

  const roleLabel = useMemo(() => ({
    admin: 'Admin',
    staff: 'Staff',
    finance: 'Finance',
  }), []);

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

  const toggleUserStatus = async (targetUser: UserProfile, nextActive: boolean) => {
    setErrorMessage('');
    setSuccessMessage('');

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

    if (editForm?.id === targetUser.id) {
      setEditForm((prev) => (prev ? { ...prev, is_active: nextActive } : prev));
    }

    setSuccessMessage(nextActive ? 'User activated successfully.' : 'User blocked successfully.');
    setSavingId(null);
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
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
    setSuccessMessage('User created successfully.');
    await loadUsers();
  };

  const startEdit = (targetUser: UserProfile) => {
    setErrorMessage('');
    setSuccessMessage('');
    setEditForm({
      id: targetUser.id,
      email: targetUser.email,
      full_name: targetUser.full_name,
      role: targetUser.role,
      is_active: targetUser.is_active,
    });
    setPasswordData({ password: '', confirmPassword: '' });
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;

    setErrorMessage('');
    setSuccessMessage('');

    if (editForm.id === user?.id && editForm.role !== 'admin') {
      setErrorMessage('You cannot remove your own admin role.');
      return;
    }

    setEditLoading(true);
    const { error } = await supabase.rpc('admin_update_user', {
      p_user_id: editForm.id,
      p_email: editForm.email,
      p_full_name: editForm.full_name,
      p_role: editForm.role,
      p_is_active: editForm.is_active,
    });

    if (error) {
      setErrorMessage(error.message);
      setEditLoading(false);
      return;
    }

    setUsers((prev) =>
      prev.map((item) =>
        item.id === editForm.id
          ? {
              ...item,
              email: editForm.email,
              full_name: editForm.full_name,
              role: editForm.role,
              is_active: editForm.is_active,
              blocked_at: editForm.is_active ? null : item.blocked_at || new Date().toISOString(),
              blocked_reason: editForm.is_active ? '' : item.blocked_reason,
            }
          : item
      )
    );

    setSuccessMessage('User details updated successfully.');
    setEditLoading(false);
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;

    setErrorMessage('');
    setSuccessMessage('');

    if (passwordData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (passwordData.password !== passwordData.confirmPassword) {
      setErrorMessage('Password confirmation does not match.');
      return;
    }

    setPasswordLoading(true);
    const { error } = await supabase.rpc('admin_reset_user_password', {
      p_user_id: editForm.id,
      p_new_password: passwordData.password,
    });

    if (error) {
      setErrorMessage(error.message);
      setPasswordLoading(false);
      return;
    }

    setPasswordData({ password: '', confirmPassword: '' });
    setSuccessMessage(`Password reset successful for ${editForm.email}.`);
    setPasswordLoading(false);
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

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {successMessage}
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

      {editForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Edit User</h3>
            <button
              type="button"
              onClick={() => setEditForm(null)}
              className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
            >
              <X className="w-4 h-4" />
              Close
            </button>
          </div>

          <form onSubmit={saveEdit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="text"
              value={editForm.full_name}
              onChange={(e) => setEditForm((prev) => (prev ? { ...prev, full_name: e.target.value } : prev))}
              placeholder="Full name"
              className="px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
            <input
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm((prev) => (prev ? { ...prev, email: e.target.value } : prev))}
              placeholder="Email"
              className="px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
            <select
              value={editForm.role}
              onChange={(e) => setEditForm((prev) => (prev ? { ...prev, role: e.target.value as UserRole } : prev))}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="staff">Staff</option>
              <option value="finance">Finance</option>
              <option value="admin">Admin</option>
            </select>
            <div className="flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg">
              <span className="text-sm text-gray-600">Active</span>
              <input
                type="checkbox"
                checked={editForm.is_active}
                onChange={(e) => setEditForm((prev) => (prev ? { ...prev, is_active: e.target.checked } : prev))}
                className="w-4 h-4"
              />
            </div>
            <div className="md:col-span-4 flex justify-end">
              <button
                type="submit"
                disabled={editLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>

          <form onSubmit={resetPassword} className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-gray-200">
            <input
              type="password"
              value={passwordData.password}
              onChange={(e) => setPasswordData((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="New password"
              className="px-3 py-2 border border-gray-300 rounded-lg"
              minLength={6}
              required
            />
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder="Confirm password"
              className="px-3 py-2 border border-gray-300 rounded-lg"
              minLength={6}
              required
            />
            <button
              type="submit"
              disabled={passwordLoading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              {passwordLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </div>
      )}

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
                  <td className="px-6 py-4 text-sm text-gray-700">{roleLabel[profile.role]}</td>
                  <td className="px-6 py-4 text-sm">
                    {profile.is_active ? (
                      <span className="inline-flex px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Blocked</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatDate(profile.created_at)}</td>
                  <td className="px-6 py-4 text-sm text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => startEdit(profile)}
                        disabled={savingId === profile.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit
                      </button>
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
                    </div>
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
