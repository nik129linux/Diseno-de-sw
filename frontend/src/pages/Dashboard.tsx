import React, { useEffect, useState } from 'react';
import { adminApi } from '../api/adminApi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Shield, Zap, AlertTriangle, Activity } from 'lucide-react';

interface PatternCount {
  pattern: string;
  count: number;
}

interface DashboardStats {
  totalInteractions: number;
  blockedCount: number;
  avgLatency: number;
  topPatterns?: PatternCount[];
}

const PIE_COLORS = [
  'oklch(0.55 0.18 250)',
  'oklch(0.62 0.16 30)',
  'oklch(0.58 0.17 145)',
  'oklch(0.65 0.18 310)',
  'oklch(0.60 0.15 80)',
];

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi.getStats()
      .then(setStats)
      .catch(() => setError('Failed to load statistics.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Activity size={32} className="animate-spin text-accent" />
          <p className="text-sm">Loading analytics…</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-destructive text-sm">{error ?? 'No statistics available.'}</p>
      </div>
    );
  }

  const blockRate = stats.totalInteractions > 0
    ? ((stats.blockedCount / stats.totalInteractions) * 100).toFixed(1)
    : '0.0';

  const barData = [
    { name: 'Total',   value: stats.totalInteractions },
    { name: 'Blocked', value: stats.blockedCount },
    { name: 'Allowed', value: stats.totalInteractions - stats.blockedCount },
  ];

  const pieData = (stats.topPatterns ?? []).map(p => ({
    name: p.pattern,
    value: p.count,
  }));

  return (
    <div className="p-8 h-full overflow-auto">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Real-time monitoring of DataShield AI protection layers</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-4 shadow-sm">
            <div className="p-2.5 bg-primary/10 rounded-lg">
              <Shield size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Total Interactions</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{stats.totalInteractions.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-4 shadow-sm">
            <div className="p-2.5 bg-destructive/10 rounded-lg">
              <AlertTriangle size={20} className="text-destructive" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Block Rate</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{blockRate}%</p>
              <p className="text-xs text-muted-foreground">{stats.blockedCount.toLocaleString()} blocked</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-4 shadow-sm">
            <div className="p-2.5 bg-accent/15 rounded-lg">
              <Zap size={20} className="text-accent" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Avg Latency</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{stats.avgLatency}ms</p>
            </div>
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bar chart */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-base font-semibold text-foreground mb-6">Interaction Summary</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.015 240)" />
                  <XAxis dataKey="name" stroke="oklch(0.45 0.03 250)" fontSize={12} />
                  <YAxis stroke="oklch(0.45 0.03 250)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: 'oklch(1 0 0)',
                      border: '1px solid oklch(0.88 0.015 240)',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />
                  <Bar dataKey="value" fill="oklch(0.28 0.07 256)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top patterns donut */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-base font-semibold text-foreground mb-6">Top Detected Patterns</h3>
            {pieData.length > 0 ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'oklch(1 0 0)',
                        border: '1px solid oklch(0.88 0.015 240)',
                        borderRadius: '8px',
                        fontSize: '13px',
                      }}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => <span style={{ fontSize: 12 }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">
                No pattern detections yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
