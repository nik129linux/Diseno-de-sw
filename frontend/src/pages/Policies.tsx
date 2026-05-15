import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/adminApi';
import * as Dialog from '@radix-ui/react-dialog';
import { Plus, Pencil, Trash2, Play, ShieldCheck, AlertCircle, X } from 'lucide-react';
import { cn } from '../lib/utils';

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

const DEFAULT_PATTERN: RegexPattern = { name: '', pattern: '', action: 'MASK', priority: 1, enabled: true };

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
        if (p.action === 'MASK') result = result.replace(regex, `[${p.name}_REDACTED]`);
      }
    } catch { /* invalid regex */ }
  }
  return { result, matches };
}

const ACTION_STYLES = {
  BLOCK: 'bg-destructive/10 text-destructive border border-destructive/20',
  MASK:  'bg-amber-100 text-amber-700 border border-amber-200',
  WARN:  'bg-accent/10 text-accent-foreground border border-accent/20',
};

const Policies: React.FC = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [form, setForm] = useState({ name: '', description: '', patterns: [{ ...DEFAULT_PATTERN }] });
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

  const inputCls = "h-9 px-3 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring transition-shadow";

  return (
    <div className="flex h-full bg-background overflow-hidden">
      {/* Policy list */}
      <div className="w-1/2 p-6 overflow-y-auto border-r border-border flex flex-col gap-5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-accent" />
            <h1 className="text-base font-semibold text-foreground">Policy Configuration</h1>
          </div>
          <button onClick={openCreate} className="flex items-center gap-1.5 h-8 bg-primary hover:bg-primary/90 text-primary-foreground px-3 rounded-lg text-sm font-medium transition-colors">
            <Plus size={14} /> Add Policy
          </button>
        </div>

        {loadError && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" /> {loadError}
          </div>
        )}

        <div className="space-y-2">
          {policies.map((policy) => (
            <div
              key={policy.id}
              onClick={() => setPlaygroundPolicy(policy)}
              className={cn(
                'bg-card border rounded-xl p-4 cursor-pointer transition-colors',
                playgroundPolicy?.id === policy.id ? 'border-accent shadow-sm' : 'border-border hover:border-primary/30'
              )}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    {policy.name}
                    {!policy.enabled && <span className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded">disabled</span>}
                    {playgroundPolicy?.id === policy.id && <span className="text-[10px] bg-accent/15 text-accent-foreground px-1.5 py-0.5 rounded">active</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{policy.regexPatterns?.length ?? 0} patterns</p>
                </div>
                <div className="flex gap-1 ml-2">
                  <button onClick={(e) => { e.stopPropagation(); openEdit(policy); }} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors" aria-label={`Edit ${policy.name}`}>
                    <Pencil size={13} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(policy.id); }} className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors" aria-label={`Delete ${policy.name}`}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {policies.length === 0 && !loadError && (
            <div className="text-center py-16 text-muted-foreground text-sm italic">No policies configured.</div>
          )}
        </div>
      </div>

      {/* Playground */}
      <div className="w-1/2 p-6 flex flex-col gap-4 bg-secondary/30">
        <div className="flex items-center gap-2">
          <Play size={16} className="text-accent" />
          <h2 className="text-base font-semibold text-foreground">Live Playground</h2>
          {playgroundPolicy && <span className="text-xs text-muted-foreground">— {playgroundPolicy.name}</span>}
        </div>

        <div className="flex flex-col gap-4 flex-1 min-h-0">
          <div className="flex flex-col flex-1">
            <label htmlFor="playground-input" className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Input</label>
            <textarea
              id="playground-input"
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="Type text to test patterns — e.g. My email is john@corp.com and card is 4111111111111111"
              className="flex-1 p-3 rounded-lg border border-border bg-card text-foreground font-mono text-sm resize-none outline-none focus-visible:ring-2 focus-visible:ring-ring transition-shadow"
            />
          </div>

          <div className="flex flex-col flex-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Result</label>
            <div className="flex-1 p-3 rounded-lg border border-border bg-card font-mono text-sm overflow-auto whitespace-pre-wrap text-foreground">
              {playground ? playground.result : <span className="text-muted-foreground italic">Waiting for input…</span>}
            </div>
          </div>

          {playground && playground.matches.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {playground.matches.map((m, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs">
                  <span className={cn('px-2 py-0.5 rounded-md font-semibold', ACTION_STYLES[m.action])}>{m.action}</span>
                  <span className="text-muted-foreground">{m.patternName}</span>
                  <span className="text-muted-foreground/60">· {m.matches.length} match(es)</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialog */}
      <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[85vh] overflow-y-auto bg-card border border-border rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <Dialog.Title className="text-base font-semibold text-foreground">
                {editingPolicy ? 'Edit Policy' : 'Create Policy'}
              </Dialog.Title>
              <Dialog.Close className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors">
                <X size={16} />
              </Dialog.Close>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="policy-name" className="block text-sm font-medium text-foreground mb-1.5">Name</label>
                <input id="policy-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={cn(inputCls, 'w-full')} placeholder="e.g. PII Detection" />
              </div>
              <div>
                <label htmlFor="policy-desc" className="block text-sm font-medium text-foreground mb-1.5">Description</label>
                <input id="policy-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={cn(inputCls, 'w-full')} placeholder="What does this policy detect?" />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-foreground">Patterns</span>
                  <button onClick={addPattern} className="text-xs text-accent hover:text-accent/80 flex items-center gap-1 font-medium">
                    <Plus size={12} /> Add pattern
                  </button>
                </div>
                <div className="space-y-2">
                  {form.patterns.map((p, i) => (
                    <div key={i} className="bg-secondary rounded-xl p-3 border border-border space-y-2">
                      <div className="flex gap-2">
                        <input placeholder="Name (e.g. EMAIL)" value={p.name} onChange={(e) => updatePattern(i, 'name', e.target.value)}
                          className={cn(inputCls, 'flex-1')} />
                        <select value={p.action} onChange={(e) => updatePattern(i, 'action', e.target.value)}
                          className="h-9 px-2 rounded-lg border border-border bg-input text-foreground text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          <option value="MASK">MASK</option>
                          <option value="BLOCK">BLOCK</option>
                          <option value="WARN">WARN</option>
                        </select>
                        {form.patterns.length > 1 && (
                          <button onClick={() => removePattern(i)} className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg transition-colors" aria-label="Remove pattern">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                      <input placeholder="Regex pattern (e.g. \b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}\b)" value={p.pattern}
                        onChange={(e) => updatePattern(i, 'pattern', e.target.value)}
                        className={cn(inputCls, 'w-full font-mono')} />
                    </div>
                  ))}
                </div>
              </div>

              {saveError && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0" /> {saveError}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Dialog.Close className="h-9 px-4 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</Dialog.Close>
              <button onClick={handleSave} className="h-9 px-5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-semibold transition-colors">
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
