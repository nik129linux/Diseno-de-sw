import React, { useEffect, useState } from 'react';
import { adminApi } from '../api/adminApi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Shield, Zap, AlertTriangle, Activity } from 'lucide-react';

// Matches GET /api/v1/audit/stats response
interface DashboardStats {
  totalInteractions: number;
  blockedCount: number;
  avgLatency: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminApi.getStats();
        setStats(data);
      } catch {
        setError('Failed to load dashboard statistics.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-8 min-h-full bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 flex flex-col items-center gap-2">
          <Activity className="animate-spin" size={40} />
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8 min-h-full bg-slate-50 flex items-center justify-center">
        <p className="text-red-500">{error || 'No statistics available.'}</p>
      </div>
    );
  }

  const blockRate = stats.totalInteractions > 0
    ? ((stats.blockedCount / stats.totalInteractions) * 100).toFixed(1)
    : '0.0';

  const chartData = [
    { name: 'Total', value: stats.totalInteractions },
    { name: 'Blocked', value: stats.blockedCount },
    { name: 'Allowed', value: stats.totalInteractions - stats.blockedCount },
  ];

  return (
    <div className="p-8 min-h-full bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#001f3f]">Admin Dashboard</h1>
          <p className="text-slate-500">Real-time monitoring of DataShield AI protection layers</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-700 rounded-lg">
              <Shield size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Total Interactions</p>
              <p className="text-2xl font-bold text-slate-800">{stats.totalInteractions.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-red-100 text-red-700 rounded-lg">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Block Rate</p>
              <p className="text-2xl font-bold text-slate-800">{blockRate}%</p>
              <p className="text-xs text-slate-400">{stats.blockedCount.toLocaleString()} blocked</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-amber-100 text-amber-700 rounded-lg">
              <Zap size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Avg Latency</p>
              <p className="text-2xl font-bold text-slate-800">{stats.avgLatency}ms</p>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Interaction Summary</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '8px' }}
                />
                <Bar dataKey="value" fill="#003366" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
