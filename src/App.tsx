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

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

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
      {currentPage === 'players' && <Members type="player" />}
      {currentPage === 'staff' && <Members type="staff" />}
      {currentPage === 'finances' && <Finances />}
      {currentPage === 'income' && <Income />}
      {currentPage === 'matches' && <MatchExpenses />}
      {currentPage === 'other-expenses' && <OtherExpenses />}
      {currentPage === 'contracts' && <Contracts />}
      {currentPage === 'reports' && <Reports />}
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
