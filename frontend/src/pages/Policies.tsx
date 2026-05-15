import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/adminApi';
import * as Dialog from '@radix-ui/react-dialog';
import { Plus, Pencil, Trash2, Play, ShieldCheck, AlertCircle } from 'lucide-react';

// Matches backend Policy / RegexPattern model
interface RegexPattern {
  name: string;
  pattern: string;
  action: 'MASK' | 'BLOCK' | 'WARN';
  priority: number;
  enabled: boolean;
}

interface Policy {
  id: string;
  name: string;
  description: string;
  regexPatterns: RegexPattern[];
  enabled: boolean;
}

interface PatternMatch {
  patternName: string;
  action: RegexPattern['action'];
  matches: string[];
}

const DEFAULT_PATTERN: RegexPattern = {
  name: '',
  pattern: '',
  action: 'MASK',
  priority: 1,
  enabled: true,
};

// Run patterns client-side — no round trip needed for live playground
function runPatterns(text: string, patterns: RegexPattern[]): { result: string; matches: PatternMatch[] } {
  let result = text;
  const matches: PatternMatch[] = [];

  const sorted = [...patterns].filter(p => p.enabled && p.pattern).sort((a, b) => a.priority - b.priority);

  for (const p of sorted) {
    try {
      const regex = new RegExp(p.pattern, 'gi');
      const found = result.match(regex);
      if (found) {
        matches.push({ patternName: p.name, action: p.action, matches: found });
        if (p.action === 'MASK') {
          result = result.replace(regex, `[${p.name}_REDACTED]`);
        }
      }
    } catch {
      // invalid regex — skip silently
    }
  }

  return { result, matches };
}

const Policies: React.FC = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [form, setForm] = useState({ name: '', description: '', patterns: [{ ...DEFAULT_PATTERN }] });

  // Playground state
  const [testText, setTestText] = useState('');
  const [playgroundPolicy, setPlaygroundPolicy] = useState<Policy | null>(null);

  useEffect(() => { loadPolicies(); }, []);

  const loadPolicies = async () => {
    try {
      const data = await adminApi.getPolicies();
      setPolicies(data);
      if (data.length > 0) setPlaygroundPolicy(data[0]);
    } catch {
      setLoadError('Failed to load policies.');
    }
  };

  const openCreate = () => {
    setEditingPolicy(null);
    setForm({ name: '', description: '', patterns: [{ ...DEFAULT_PATTERN }] });
    setSaveError(null);
    setIsDialogOpen(true);
  };

  const openEdit = (policy: Policy) => {
    setEditingPolicy(policy);
    setForm({ name: policy.name, description: policy.description, patterns: policy.regexPatterns });
    setSaveError(null);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    setSaveError(null);
    try {
      const payload = { name: form.name, description: form.description, regexPatterns: form.patterns, enabled: true };
      if (editingPolicy) {
        await adminApi.updatePolicy(editingPolicy.id, payload);
      } else {
        await adminApi.createPolicy(payload);
      }
      await loadPolicies();
      setIsDialogOpen(false);
    } catch {
      setSaveError('Failed to save policy. Check your inputs and try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this policy?')) return;
    try {
      await adminApi.deletePolicy(id);
      await loadPolicies();
    } catch {
      setLoadError('Failed to delete policy.');
    }
  };

  const updatePattern = (index: number, field: keyof RegexPattern, value: string | number | boolean) => {
    const updated = [...form.patterns];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, patterns: updated });
  };

  const addPattern = () => setForm({ ...form, patterns: [...form.patterns, { ...DEFAULT_PATTERN, priority: form.patterns.length + 1 }] });
  const removePattern = (i: number) => setForm({ ...form, patterns: form.patterns.filter((_, idx) => idx !== i) });

  const playground = testText && playgroundPolicy
    ? runPatterns(testText, playgroundPolicy.regexPatterns)
    : null;

  return (
    <div className="flex h-full bg-[#001f3f] text-white overflow-hidden">
      {/* Policy List */}
      <div className="w-1/2 p-6 overflow-y-auto border-r border-blue-900/50 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ShieldCheck className="text-blue-400" size={20} /> Policy Configuration
          </h1>
          <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-500 px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors">
            <Plus size={16} /> Add Policy
          </button>
        </div>

        {loadError && (
          <div className="mb-4 p-3 bg-red-900/40 border border-red-600 rounded-lg flex gap-2 text-red-200 text-sm">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" /> {loadError}
          </div>
        )}

        <div className="space-y-3">
          {policies.map((policy) => (
            <div
              key={policy.id}
              className={`bg-blue-900/30 p-4 rounded-xl border transition-colors cursor-pointer ${
                playgroundPolicy?.id === policy.id ? 'border-blue-500' : 'border-blue-800/50 hover:border-blue-700'
              }`}
              onClick={() => setPlaygroundPolicy(policy)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-blue-100 flex items-center gap-2">
                    {policy.name}
                    {!policy.enabled && <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded">disabled</span>}
                    {playgroundPolicy?.id === policy.id && (
                      <span className="text-[10px] bg-blue-600 px-1.5 py-0.5 rounded">active in playground</span>
                    )}
                  </div>
                  <div className="text-xs text-blue-400 mt-1">{policy.regexPatterns?.length ?? 0} patterns</div>
                </div>
                <div className="flex gap-1 ml-2">
                  <button onClick={(e) => { e.stopPropagation(); openEdit(policy); }} className="p-1.5 hover:text-blue-300 rounded transition-colors" aria-label={`Edit ${policy.name}`}>
                    <Pencil size={14} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(policy.id); }} className="p-1.5 hover:text-red-400 rounded transition-colors" aria-label={`Delete ${policy.name}`}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {policies.length === 0 && !loadError && (
            <div className="text-center py-12 text-blue-400 italic text-sm">No policies configured.</div>
          )}
        </div>
      </div>

      {/* Live Playground */}
      <div className="w-1/2 p-6 flex flex-col gap-4 bg-blue-950/20">
        <div className="flex items-center gap-2">
          <Play className="text-blue-400" size={18} />
          <h2 className="text-lg font-semibold">Live Playground</h2>
          {playgroundPolicy && <span className="text-xs text-blue-400">— {playgroundPolicy.name}</span>}
        </div>

        <div className="flex-1 flex flex-col gap-4 min-h-0">
          <div className="flex flex-col flex-1">
            <label htmlFor="playground-input" className="text-xs text-blue-300 mb-1 uppercase tracking-widest font-medium">Input</label>
            <textarea
              id="playground-input"
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              className="flex-1 p-3 bg-blue-900/40 border border-blue-800 rounded-xl text-white font-mono text-sm resize-none focus-visible:ring-2 focus-visible:ring-blue-500 outline-none"
              placeholder="Type text to test patterns — e.g. My email is john@corp.com and card is 4111111111111111"
            />
          </div>

          <div className="flex flex-col flex-1">
            <label className="text-xs text-blue-300 mb-1 uppercase tracking-widest font-medium">Result</label>
            <div className="flex-1 p-3 bg-black/40 border border-blue-800/50 rounded-xl text-blue-200 font-mono text-sm overflow-auto whitespace-pre-wrap">
              {playground ? playground.result : <span className="text-blue-700 italic">Waiting for input...</span>}
            </div>
          </div>

          {playground && playground.matches.length > 0 && (
            <div className="space-y-1">
              {playground.matches.map((m, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className={`px-2 py-0.5 rounded font-bold ${
                    m.action === 'BLOCK' ? 'bg-red-900/60 text-red-300' :
                    m.action === 'MASK'  ? 'bg-yellow-900/60 text-yellow-300' :
                                           'bg-blue-900/60 text-blue-300'
                  }`}>{m.action}</span>
                  <span className="text-blue-400">{m.patternName}</span>
                  <span className="text-slate-500">— {m.matches.length} match(es)</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[85vh] overflow-y-auto bg-[#001f3f] border border-blue-800 p-6 rounded-2xl shadow-2xl">
            <Dialog.Title className="text-lg font-bold mb-4 text-blue-100">
              {editingPolicy ? 'Edit Policy' : 'Create Policy'}
            </Dialog.Title>

            <div className="space-y-4">
              <div>
                <label htmlFor="policy-name" className="block text-sm text-blue-300 mb-1">Name</label>
                <input id="policy-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full p-2 bg-blue-900/40 border border-blue-800 rounded-lg text-white outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-sm" />
              </div>
              <div>
                <label htmlFor="policy-desc" className="block text-sm text-blue-300 mb-1">Description</label>
                <input id="policy-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full p-2 bg-blue-900/40 border border-blue-800 rounded-lg text-white outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-sm" />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-blue-300">Patterns</span>
                  <button onClick={addPattern} className="text-xs text-blue-400 hover:text-blue-200 flex items-center gap-1">
                    <Plus size={12} /> Add pattern
                  </button>
                </div>
                <div className="space-y-3">
                  {form.patterns.map((p, i) => (
                    <div key={i} className="bg-blue-900/30 p-3 rounded-lg border border-blue-800 space-y-2">
                      <div className="flex gap-2">
                        <input placeholder="Name (e.g. EMAIL)" value={p.name} onChange={(e) => updatePattern(i, 'name', e.target.value)}
                          className="flex-1 p-1.5 bg-blue-900/40 border border-blue-800 rounded text-white text-xs outline-none focus-visible:ring-1 focus-visible:ring-blue-500" />
                        <select value={p.action} onChange={(e) => updatePattern(i, 'action', e.target.value)}
                          className="p-1.5 bg-blue-900/40 border border-blue-800 rounded text-white text-xs outline-none">
                          <option value="MASK">MASK</option>
                          <option value="BLOCK">BLOCK</option>
                          <option value="WARN">WARN</option>
                        </select>
                        {form.patterns.length > 1 && (
                          <button onClick={() => removePattern(i)} className="text-red-400 hover:text-red-300 p-1" aria-label="Remove pattern">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                      <input placeholder="Regex pattern" value={p.pattern} onChange={(e) => updatePattern(i, 'pattern', e.target.value)}
                        className="w-full p-1.5 bg-blue-900/40 border border-blue-800 rounded text-white font-mono text-xs outline-none focus-visible:ring-1 focus-visible:ring-blue-500" />
                    </div>
                  ))}
                </div>
              </div>

              {saveError && (
                <div className="p-3 bg-red-900/40 border border-red-600 rounded-lg text-red-200 text-sm flex gap-2">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" /> {saveError}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Dialog.Close className="px-4 py-2 text-blue-300 hover:text-white text-sm transition-colors">Cancel</Dialog.Close>
              <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-500 px-5 py-2 rounded-lg text-sm font-semibold transition-colors">
                Save
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};

export default Policies;
