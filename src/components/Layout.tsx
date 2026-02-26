import { useState } from 'react';
import { LayoutDashboard, Users, Wallet, Trophy, FileText, LogOut, Menu, X, TrendingUp, Receipt, KeyRound, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const { signOut, role, fullName, user, changePassword } = useAuth();

  const canManageOperations = role === 'admin' || role === 'staff';
  const canManageFinance = role === 'admin' || role === 'finance';

  const navigation = [
    { name: 'Dashboard', icon: LayoutDashboard, page: 'dashboard' },
    ...(canManageOperations ? [
      { name: 'Players', icon: Users, page: 'players' },
      { name: 'Staff', icon: Users, page: 'staff' },
      { name: 'Contracts', icon: FileText, page: 'contracts' },
    ] : []),
    ...(canManageFinance ? [
      { name: 'Finances', icon: Wallet, page: 'finances' },
      { name: 'Income', icon: TrendingUp, page: 'income' },
      { name: 'Match Expenses', icon: Trophy, page: 'matches' },
      { name: 'Other Expenses', icon: Receipt, page: 'other-expenses' },
    ] : []),
    ...(canManageFinance ? [{ name: 'Reports', icon: FileText, page: 'reports' }] : []),
    ...(role === 'admin' ? [{ name: 'Users', icon: Users, page: 'users' }] : []),
    ...(role === 'admin' ? [{ name: 'Audit Logs', icon: FileText, page: 'audit-logs' }] : []),
  ];

  const roleLabel =
    role === 'admin'
      ? 'Admin'
      : role === 'finance'
      ? 'Finance'
      : role === 'staff'
      ? 'Staff'
      : 'User';
  const displayName = fullName || user?.email || 'User';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Password confirmation does not match.');
      return;
    }

    setPasswordLoading(true);
    const { error } = await changePassword(passwordData.newPassword);
    if (error) {
      setPasswordError(error.message);
      setPasswordLoading(false);
      return;
    }

    setPasswordSuccess('Password changed successfully.');
    setPasswordData({ newPassword: '', confirmPassword: '' });
    setPasswordLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {profileMenuOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setProfileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-30 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900">Fahari FC</h1>
                <p className="text-xs text-gray-500">Management</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.page}
                  onClick={() => {
                    onNavigate(item.page);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                    currentPage === item.page
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-200 text-xs text-gray-500">
            Signed in as {roleLabel}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="flex items-center justify-between px-4 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="lg:ml-0 ml-12">
              <h2 className="text-xl font-bold text-gray-900">
                {navigation.find((item) => item.page === currentPage)?.name || 'Dashboard'}
              </h2>
            </div>
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                className="inline-flex items-center gap-3 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <div className="w-8 h-8 rounded-full bg-green-600 text-white text-xs font-semibold flex items-center justify-center">
                  {initials}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                  <p className="text-xs text-gray-500">{roleLabel}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20">
                  <button
                    onClick={() => {
                      setPasswordError('');
                      setPasswordSuccess('');
                      setShowPasswordModal(true);
                      setProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <KeyRound className="w-4 h-4" />
                    Change Password
                  </button>
                  <button
                    onClick={signOut}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Change Password</h3>

            <form onSubmit={handleChangePassword} className="space-y-4">
              {passwordError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm">
                  {passwordSuccess}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))}
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {passwordLoading ? 'Saving...' : 'Update Password'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({ newPassword: '', confirmPassword: '' });
                    setPasswordError('');
                    setPasswordSuccess('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
