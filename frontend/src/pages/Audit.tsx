import React, { useEffect, useState } from 'react';
import { adminApi } from '../api/adminApi';
import { FileText, Calendar, Search, Download } from 'lucide-react';

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  timestamp: string;
  prompt: string;
  sanitizedPrompt: string;
  blocked: boolean;
  reasons: string[];
}

const Audit: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    keyword: '',
  });

  useEffect(() => {
    fetchLogs();
  }, [page, filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getAuditLogs({
        page,
        ...filters,
      });
      setLogs(data.content || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(1);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-8 min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 no-print">
          <h1 className="text-3xl font-bold text-[#001f3f]">Audit Panel</h1>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-[#003366] text-white px-4 py-2 rounded-lg hover:bg-[#001f3f] transition-colors"
          >
            <Download size={18} />
            Export PDF
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm mb-8 no-print border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Start Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#003366] outline-none"
                />
              </div>
            </div>
            <div className="relative">
              <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">End Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#003366] outline-none"
                />
              </div>
            </div>
            <div className="relative">
              <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Keywords</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  name="keyword"
                  placeholder="Search user or prompt..."
                  value={filters.keyword}
                  onChange={handleFilterChange}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#003366] outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100 text-slate-600 text-sm uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Prompt</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    Loading audit logs...
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-700">{log.userName}</td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-sm max-w-xs truncate">
                      {log.prompt}
                    </td>
                    <td className="px-6 py-4">
                      {log.blocked ? (
                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600">
                          BLOCKED
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-600">
                          ALLOWED
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        className="text-[#003366] hover:text-[#001f3f] p-1 rounded hover:bg-slate-100" 
                        onClick={() => alert(`Sanitized: ${log.sanitizedPrompt}\\nReasons: ${log.reasons.join(', ')}`)}
                      >
                        <FileText size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    No audit logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center mt-6 no-print">
          <span className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-100 disabled:opacity-50 transition-colors"
            >
              Previous
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-100 disabled:opacity-50 transition-colors"
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
