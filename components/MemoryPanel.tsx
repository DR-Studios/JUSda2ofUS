import React from 'react';
import { MemoryRecord } from '../types';
import { Database, Zap, Cpu, HardDrive } from 'lucide-react';

interface MemoryPanelProps {
  shortTermMemories: MemoryRecord[];
  longTermMemories: MemoryRecord[];
}

// Fixed: Typed as React.FC to allow 'key' prop in parent usage
const MemoryItem: React.FC<{ memory: MemoryRecord }> = ({ memory }) => (
  <div className="mb-2 p-2 bg-slate-900/50 border-l-2 border-cyan-500 rounded text-xs hover:bg-slate-800 transition-colors cursor-pointer group">
    <div className="flex justify-between items-center mb-1 text-cyan-300">
      <span className="font-mono opacity-70">{memory.timestamp}</span>
      <span className="bg-cyan-900/50 px-1 rounded text-[10px]">IMP: {memory.importance}</span>
    </div>
    <div className="text-slate-300 line-clamp-2 group-hover:line-clamp-none transition-all duration-300">
      {memory.content}
    </div>
    <div className="mt-1 flex gap-1 flex-wrap">
      {memory.tags.map(t => (
        <span key={t} className="text-[10px] text-amber-500 bg-amber-950/30 px-1 rounded">#{t}</span>
      ))}
    </div>
  </div>
);

const MemoryPanel: React.FC<MemoryPanelProps> = ({ shortTermMemories, longTermMemories }) => {
  return (
    <div className="h-full flex flex-col bg-slate-950/50 border-l border-slate-800 backdrop-blur-sm">
      <div className="p-4 border-b border-slate-800 bg-slate-900/50">
        <h2 className="text-lg font-bold text-cyan-400 flex items-center gap-2">
          <Database className="w-5 h-5" />
          Neural Memory
        </h2>
        <div className="flex gap-4 mt-2 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" /> Redis: Online
          </div>
          <div className="flex items-center gap-1">
            <HardDrive className="w-3 h-3 text-green-400" /> Postgres: Active
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {/* Short Term Memory Section */}
        <div className="mb-6">
          <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4" /> Short-Term Buffer (Active)
          </h3>
          <div className="space-y-2">
             {shortTermMemories.length === 0 ? (
               <div className="text-slate-600 text-xs italic text-center p-2">Buffer Empty</div>
             ) : (
               shortTermMemories.map(m => <MemoryItem key={m.id} memory={m} />)
             )}
          </div>
        </div>

        {/* Long Term Memory Section */}
        <div>
          <h3 className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Cpu className="w-4 h-4" /> RAG Context (Injected)
          </h3>
          <div className="space-y-2">
             {longTermMemories.map(m => <MemoryItem key={m.id} memory={m} />)}
          </div>
        </div>
      </div>
      
      {/* System Stats Footer */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 text-[10px] font-mono text-slate-500 flex justify-between">
        <span>VECTORS: 14,203</span>
        <span>TOKEN USAGE: 4.2k</span>
      </div>
    </div>
  );
};

export default MemoryPanel;