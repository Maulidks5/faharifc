import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { formatDateTime } from '../lib/utils';

interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  changed_at: string;
  changed_by: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  user_profiles?: {
    full_name: string;
    email: string;
    role: string;
  } | null;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    void loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    setErrorMessage('');

    const { data, error } = await supabase
      .from('audit_logs')
      .select('id, table_name, record_id, action, changed_at, changed_by, old_data, new_data, user_profiles(full_name, email, role)')
      .order('changed_at', { ascending: false })
      .limit(200);

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setLogs((data as AuditLog[]) || []);
    setLoading(false);
  };

  const getActionClass = (action: AuditLog['action']) => {
    if (action === 'INSERT') return 'bg-green-100 text-green-800';
    if (action === 'UPDATE') return 'bg-blue-100 text-blue-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Audit Logs</h2>
        <p className="text-sm text-gray-600 mt-1">Track who changed what and when</p>
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Table</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Record</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Summary</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No audit logs yet</td>
              </tr>
            ) : (
              logs.map((log) => {
                const changedFields =
                  log.action === 'UPDATE' && log.old_data && log.new_data
                    ? Object.keys(log.new_data).filter(
                        (key) => JSON.stringify(log.old_data?.[key]) !== JSON.stringify(log.new_data?.[key])
                      )
                    : [];

                return (
                  <tr key={log.id} className="hover:bg-gray-50 align-top">
                    <td className="px-4 py-3 text-sm text-gray-900">{formatDateTime(log.changed_at)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div>{log.user_profiles?.full_name || 'System'}</div>
                      <div className="text-xs text-gray-500">{log.user_profiles?.email || '-'}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getActionClass(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{log.table_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{log.record_id}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {log.action === 'UPDATE'
                        ? changedFields.length > 0
                          ? `Changed: ${changedFields.slice(0, 6).join(', ')}`
                          : 'Updated record'
                        : log.action === 'INSERT'
                        ? 'Created record'
                        : 'Deleted record'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
