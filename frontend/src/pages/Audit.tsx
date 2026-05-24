import React, { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../api/adminApi';
import { FileText, Calendar, Search, Download, RefreshCw, X } from 'lucide-react';

interface AuditLog {
  id: string;
  userId: string;
  originalPromptHash: string;
  sanitizedPrompt: string;
  blocked: boolean;
  blockedReasons: string[];
  detectedPatterns: string[];
  processingTimeMs: number;
  timestamp: string;
  ipAddress: string;
  policyVersion: string;
}

interface DetailModal {
  log: AuditLog;
}

const Audit: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', keyword: '' });
  const [modal, setModal] = useState<DetailModal | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => { fetchLogs(); }, [page, filters]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getAuditLogs({ page: page - 1, size: 20, ...filters });
      setLogs(data.content || []);
      setTotalPages(data.totalPages || 1);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(1);
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const blob = await adminApi.exportCsv(filters);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `datashield_audit_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-8 h-full overflow-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Audit Panel</h1>
            <p className="text-muted-foreground text-sm mt-1">Complete interaction history and security events</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchLogs()}
              className="flex items-center gap-2 h-9 border border-border hover:bg-secondary text-foreground px-4 rounded-lg text-sm font-medium transition-colors"
            >
              <RefreshCw size={15} />
              Refresh
            </button>
            <button
              onClick={handleExportCsv}
              disabled={exporting}
              className="flex items-center gap-2 h-9 bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground px-4 rounded-lg text-sm font-medium transition-colors"
            >
              <Download size={15} />
              {exporting ? 'Exporting…' : 'Export CSV'}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
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
                <th className="px-5 py-3.5">Detections</th>
                <th className="px-5 py-3.5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground text-sm">
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
                      <div className="flex flex-wrap gap-1">
                        {log.detectedPatterns?.length > 0
                          ? log.detectedPatterns.map((p) => (
                              <span key={p} className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                                {p}
                              </span>
                            ))
                          : <span className="text-xs text-muted-foreground">—</span>
                        }
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => setModal({ log })}
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
                  <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground text-sm">
                    No audit logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center">
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

      {/* Detail Modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setModal(null)}
        >
          <div
            className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Interaction Detail</h2>
              <button
                onClick={() => setModal(null)}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-0.5">User</dt>
                <dd className="font-mono text-foreground">{modal.log.userId}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-0.5">Timestamp</dt>
                <dd className="text-foreground">{new Date(modal.log.timestamp).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-0.5">Sanitized Prompt</dt>
                <dd className="font-mono text-xs bg-secondary rounded-lg p-3 text-foreground whitespace-pre-wrap break-all">
                  {modal.log.sanitizedPrompt || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-0.5">Detected Patterns</dt>
                <dd className="flex flex-wrap gap-1">
                  {modal.log.detectedPatterns?.length > 0
                    ? modal.log.detectedPatterns.map(p => (
                        <span key={p} className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">{p}</span>
                      ))
                    : <span className="text-muted-foreground">none</span>
                  }
                </dd>
              </div>
              {modal.log.blocked && (
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-0.5">Blocked Reasons</dt>
                  <dd className="text-destructive">{modal.log.blockedReasons?.join(', ') || '—'}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-0.5">IP Address</dt>
                <dd className="font-mono text-foreground">{modal.log.ipAddress || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-0.5">Processing Time</dt>
                <dd className="text-foreground">{modal.log.processingTimeMs}ms</dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
};

export default Audit;
