import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/adminApi';
import { promptApi } from '../api/promptApi';
import * as Dialog from '@radix-ui/react-dialog';
import { Plus, Pencil, Trash2, Play, ShieldCheck } from 'lucide-react';

interface Policy {
  id: string;
  name: string;
  pattern: string;
  action: 'MASK' | 'BLOCK' | 'WARN';
}

const Policies: React.FC = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [testText, setTestText] = useState('');
  const [testResult, setTestResult] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [newPolicy, setNewPolicy] = useState({ name: '', pattern: '', action: 'MASK' as Policy['action'] });

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      const data = await adminApi.getPolicies();
      setPolicies(data);
    } catch (error) {
      console.error('Failed to load policies', error);
    }
  };

  const handleSavePolicy = async () => {
    try {
      if (editingPolicy) {
        await adminApi.updatePolicy(editingPolicy.id, newPolicy);
      } else {
        await adminApi.createPolicy(newPolicy);
      }
      await loadPolicies();
      setIsDialogOpen(false);
      setEditingPolicy(null);
      setNewPolicy({ name: '', pattern: '', action: 'MASK' });
    } catch (error) {
      console.error('Failed to save policy', error);
    }
  };

  const handleDeletePolicy = async (id: string) => {
    try {
      await adminApi.deletePolicy(id);
      await loadPolicies();
    } catch (error) {
      console.error('Failed to delete policy', error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (testText) {
        try {
          const result = await promptApi.testPrompt(testText);
          setTestResult(result.sanitizedPrompt || '');
        } catch (error) {
          setTestResult('Error testing prompt');
        }
      } else {
        setTestResult('');
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [testText]);

  const openCreateDialog = () => {
    setEditingPolicy(null);
    setNewPolicy({ name: '', pattern: '', action: 'MASK' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (policy: Policy) => {
    setEditingPolicy(policy);
    setNewPolicy({ name: policy.name, pattern: policy.pattern, action: policy.action });
    setIsDialogOpen(true);
  };

  return (
    <div className="flex h-screen bg-[#001f3f] text-white">
      {/* Policy Management Pane */}
      <div className="w-1/2 p-8 overflow-y-auto border-r border-blue-900/50">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="text-blue-400" /> Policy Configuration
          </h1>
          <button 
            onClick={openCreateDialog}
            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={18} /> Add Policy
          </button>
        </div>

        <div className="space-y-4">
          {policies.map((policy) => (
            <div key={policy.id} className="bg-blue-900/30 p-4 rounded-xl border border-blue-800/50 flex justify-between items-center group">
              <div>
                <div className="font-semibold text-blue-100">{policy.name}</div>
                <div className="text-xs font-mono text-blue-400 mt-1">{policy.pattern}</div>
                <div className="text-[10px] uppercase tracking-wider text-blue-500 mt-1 font-bold">{policy.action}</div>
              </div>
               <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button 
                   onClick={() => openEditDialog(policy)} 
                   className="p-2 hover:text-blue-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                   aria-label={`Edit policy ${policy.name}`}
                 >
                   <Pencil size={16} aria-hidden="true" />
                 </button>
                 <button 
                   onClick={() => handleDeletePolicy(policy.id)} 
                   className="p-2 hover:text-red-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                   aria-label={`Delete policy ${policy.name}`}
                 >
                   <Trash2 size={16} aria-hidden="true" />
                 </button>
               </div>
            </div>
          ))}
          {policies.length === 0 && <div className="text-center py-12 text-blue-400 italic">No policies configured.</div>}
        </div>
      </div>

      {/* Live Playground Pane */}
      <div className="w-1/2 p-8 bg-blue-950/20 flex flex-col">
        <div className="flex items-center gap-2 mb-6">
          <Play className="text-blue-400" size={20} />
          <h2 className="text-xl font-semibold">Live Playground</h2>
        </div>
        
        <div className="flex-1 flex flex-col gap-4">
             <div className="flex-1 flex flex-col">
               <label htmlFor="test-playground-input" className="text-sm text-blue-300 mb-2 uppercase tracking-widest font-medium">Input Text</label>
               <textarea 
                 id="test-playground-input"
                 value={testText}
                 onChange={(e) => setTestText(e.target.value)}
                 className="flex-1 p-4 bg-blue-900/40 border border-blue-800 rounded-xl text-white font-mono resize-none focus-visible:ring-2 focus-visible:ring-blue-500 outline-none transition-all"
                 placeholder="Type text to test your patterns (e.g. My email is test@example.com)…"
               />
             </div>
          
          <div className="flex-1 flex flex-col">
            <label className="text-sm text-blue-300 mb-2 uppercase tracking-widest font-medium">Processed Result</label>
            <div className="flex-1 p-4 bg-black/40 border border-blue-800/50 rounded-xl text-blue-200 font-mono overflow-auto whitespace-pre-wrap shadow-inner">
              {testResult || <span className="text-blue-700 italic">Waiting for input...</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Edit/Create Policy Dialog */}
      <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#001f3f] border border-blue-800 p-6 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
            <Dialog.Title className="text-xl font-bold mb-6 text-blue-100">
              {editingPolicy ? 'Edit Policy' : 'Create New Policy'}
            </Dialog.Title>
            
            <div className="space-y-4">
              <div>
                 <label htmlFor="policy-name" className="block text-sm text-blue-300 mb-1">Policy Name</label>
                 <input 
                   id="policy-name"
                   value={newPolicy.name}
                   onChange={(e) => setNewPolicy({...newPolicy, name: e.target.value})}
                   className="w-full p-2 bg-blue-900/40 border border-blue-800 rounded-lg text-white outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                 />
              </div>
              <div>
                 <label htmlFor="policy-pattern" className="block text-sm text-blue-300 mb-1">Regex Pattern</label>
                 <input 
                   id="policy-pattern"
                   value={newPolicy.pattern}
                   onChange={(e) => setNewPolicy({...newPolicy, pattern: e.target.value})}
                   className="w-full p-2 bg-blue-900/40 border border-blue-800 rounded-lg text-white font-mono outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                 />
              </div>
              <div>
                 <label htmlFor="policy-action" className="block text-sm text-blue-300 mb-1">Action</label>
                 <select 
                   id="policy-action"
                   value={newPolicy.action}
                   onChange={(e) => setNewPolicy({...newPolicy, action: e.target.value as any})}
                   className="w-full p-2 bg-blue-900/40 border border-blue-800 rounded-lg text-white outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                 >
                  <option value="MASK">Mask (****)</option>
                  <option value="BLOCK">Block (Reject)</option>
                  <option value="WARN">Warn (Alert)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <Dialog.Close className="px-4 py-2 text-blue-300 hover:text-white transition-colors">
                Cancel
              </Dialog.Close>
               <button 
                 onClick={handleSavePolicy}
                 className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
               >
                 Save Policy
               </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};

export default Policies;
