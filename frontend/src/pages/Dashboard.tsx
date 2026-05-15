import React, { useEffect, useState } from 'react';
import { adminApi } from '../api/adminApi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { Shield, Zap, AlertTriangle, Activity } from 'lucide-react';

interface DashboardStats {
  totalDetections: number;
  blockRate: number;
  avgLatency: number;
  trends: { date: string; interactions: number; blocked: number }[];
  piiDistribution: { name: string; value: number }[];
}

const COLORS = ['#003366', '#001f3f', '#4a90e2', '#f5a623', '#d0021b', '#417505'];

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminApi.getStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-8 min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 flex flex-col items-center gap-2">
          <Activity className="animate-spin" size={40} />
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8 min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400">No statistics available.</p>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#001f3f]">Admin Dashboard</h1>
          <p className="text-slate-500">Real-time monitoring of DataShield AI protection layers</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-700 rounded-lg">
              <Shield size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Total Detections</p>
              <p className="text-2xl font-bold text-slate-800">{stats.totalDetections.toLocaleString()}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-red-100 text-red-700 rounded-lg">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Block Rate</p>
              <p className="text-2xl font-bold text-slate-800">{stats.blockRate}%</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Detection Trends</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '8px' }}
                  />
                  <Bar dataKey="interactions" fill="#4a90e2" name="Total Interactions" />
                  <Bar dataKey="blocked" fill="#001f3f" name="Blocked" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">PII Distribution</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.piiDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.piiDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
