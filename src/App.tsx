import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Finances from './pages/Finances';
import Income from './pages/Income';
import MatchExpenses from './pages/MatchExpenses';
import OtherExpenses from './pages/OtherExpenses';
import Reports from './pages/Reports';
import Contracts from './pages/Contracts';
import Layout from './components/Layout';
import Users from './pages/Users';

function AppContent() {
  const { user, role, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const canManageOperations = role === 'admin' || role === 'staff';
  const canManageFinance = role === 'admin' || role === 'finance';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {currentPage === 'dashboard' && <Dashboard />}
      {currentPage === 'players' && canManageOperations && <Members type="player" />}
      {currentPage === 'staff' && canManageOperations && <Members type="staff" />}
      {currentPage === 'finances' && canManageFinance && <Finances />}
      {currentPage === 'income' && canManageFinance && <Income />}
      {currentPage === 'matches' && canManageFinance && <MatchExpenses />}
      {currentPage === 'other-expenses' && canManageFinance && <OtherExpenses />}
      {currentPage === 'contracts' && canManageOperations && <Contracts />}
      {currentPage === 'reports' && canManageFinance && <Reports />}
      {currentPage === 'users' && role === 'admin' && <Users />}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
