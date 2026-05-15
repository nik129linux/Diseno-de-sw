import React, { useEffect, useState } from 'react';
import { adminApi } from '../api/adminApi';
import { FileText, Calendar, Search, Download } from 'lucide-react';

interface AuditLog {
  id: string;
  userId: string;
  originalPromptHash: string;
  sanitizedPrompt: string;
  blocked: boolean;
  blockedReasons: string[];
  processingTimeMs: number;
  timestamp: string;
  ipAddress: string;
  policyVersion: string;
}

const Audit: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', keyword: '' });

  useEffect(() => { fetchLogs(); }, [page, filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getAuditLogs({ page, ...filters });
      setLogs(data.content || []);
      setTotalPages(data.totalPages || 1);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(1);
  };

  return (
    <div className="p-8 h-full overflow-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center no-print">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Audit Panel</h1>
            <p className="text-muted-foreground text-sm mt-1">Complete interaction history and security events</p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 h-9 bg-primary hover:bg-primary/90 text-primary-foreground px-4 rounded-lg text-sm font-medium transition-colors"
          >
            <Download size={15} />
            Export PDF
          </button>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-xl p-5 no-print shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: 'startDate', label: 'Start Date', type: 'date', icon: Calendar, placeholder: '' },
              { id: 'endDate',   label: 'End Date',   type: 'date', icon: Calendar, placeholder: '' },
              { id: 'keyword',   label: 'Keywords',   type: 'text', icon: Search,   placeholder: 'Search user or prompt…' },
            ].map(({ id, label, type, icon: Icon, placeholder }) => (
              <div key={id}>
                <label htmlFor={id} className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">
                  {label}
                </label>
                <div className="relative">
                  <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id={id}
                    type={type}
                    name={id}
                    placeholder={placeholder}
                    value={filters[id as keyof typeof filters]}
                    onChange={handleFilterChange}
                    autoComplete="off"
                    className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring transition-shadow"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-secondary border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              <tr>
                <th className="px-5 py-3.5">User ID</th>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Prompt Hash (SHA-256)</th>
                <th className="px-5 py-3.5">Latency</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground text-sm">
                    Loading audit logs…
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-secondary/50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-mono text-foreground truncate max-w-[120px]">{log.userId}</td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-xs font-mono text-muted-foreground max-w-xs truncate" title={log.originalPromptHash}>
                      {log.originalPromptHash}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">{log.processingTimeMs}ms</td>
                    <td className="px-5 py-3.5">
                      {log.blocked ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20">
                          BLOCKED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-success/10 text-success border border-success/20">
                          ALLOWED
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => {
                          const detail = `Sanitized prompt:\n${log.sanitizedPrompt}\n\nBlocked reasons:\n${log.blockedReasons?.join('\n') || 'none'}`;
                          window.alert(detail);
                        }}
                        aria-label={`View details for interaction ${log.id}`}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                      >
                        <FileText size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground text-sm">
                    No audit logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center no-print">
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="h-9 px-4 border border-border rounded-lg text-sm hover:bg-secondary disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="h-9 px-4 border border-border rounded-lg text-sm hover:bg-secondary disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Audit;
