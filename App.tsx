import React, { useState, useEffect } from 'react';
import { Send, Upload, Mic, Layout, Settings, Menu, Terminal as TermIcon, Save, Check, X, AlertTriangle } from 'lucide-react';
import ChatArea from './components/ChatArea';
import MemoryPanel from './components/MemoryPanel';
import { Message, MessageRole, MemoryRecord } from './types';
import { sendMessageToGemini } from './services/geminiService';

interface PendingMemory {
  id: string; // tool call id
  content: string;
  importance: number;
  tags: string[];
}

const App = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      role: MessageRole.SYSTEM,
      text: 'Nexus Prime v2.4 Online. Connection to Redis established. Postgres Vector Database active. Ready for input, Dave.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showMemory, setShowMemory] = useState(true);
  const [pendingMemory, setPendingMemory] = useState<PendingMemory | null>(null);

  // Mock Memories - In a real app, these fetch from Postgres/Redis
  const [shortTermMemories, setShortTermMemories] = useState<MemoryRecord[]>([]);
  const [longTermMemories, setLongTermMemories] = useState<MemoryRecord[]>([
    { id: 'm1', type: 'long-term', content: 'Dave prefers 42-hour marathon coding sessions.', timestamp: 'Day 0', importance: 10, tags: ['profile', 'habits'] },
    { id: 'm2', type: 'long-term', content: 'Project "Eve" is a neural RAG system with vision capabilities.', timestamp: 'Day 2', importance: 9, tags: ['project', 'eve', 'architecture'] },
    { id: 'm3', type: 'long-term', content: 'Preferred communication style: Direct, technical, no fluff, casual profanity allowed.', timestamp: 'Day 0', importance: 8, tags: ['personality'] }
  ]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing || pendingMemory) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);

    // Update Short Term Memory (Mock)
    setShortTermMemories(prev => [
      { id: Date.now().toString(), type: 'short-term', content: input, timestamp: 'Now', importance: 1, tags: ['session'] },
      ...prev
    ].slice(0, 5)); // Keep last 5

    try {
      const response = await sendMessageToGemini(messages, input, longTermMemories);
      
      const newMessages: Message[] = [];

      // 1. Add AI Text Response if present
      if (response.text) {
        newMessages.push({
          id: (Date.now() + 1).toString(),
          role: MessageRole.MODEL,
          text: response.text,
          timestamp: new Date()
        });
      }

      // 2. Add Tool Call Indicator
      if (response.toolCalls && response.toolCalls.length > 0) {
          newMessages.push({
              id: Date.now().toString() + '-tool',
              role: MessageRole.TOOL,
              text: `Executing Tools:\n${response.toolCalls.map(t => `> ${t.name}(${JSON.stringify(t.args)})`).join('\n')}`,
              timestamp: new Date(),
              toolCalls: response.toolCalls
          });
      }

      setMessages(prev => [...prev, ...newMessages]);
      
      // 3. Handle Tool Execution Logic
      if (response.toolCalls && response.toolCalls.length > 0) {
          
          // Check for Critical Memory Save Tool
          const saveCall = response.toolCalls.find(t => t.name === 'save_core_memory');
          if (saveCall) {
              // INTERCEPT: Do not execute. Prompt user.
              setPendingMemory({
                  id: saveCall.id,
                  content: saveCall.args.content,
                  importance: saveCall.args.importance,
                  tags: saveCall.args.tags || []
              });
              // Return immediately. The `finally` block will clear `isProcessing`, 
              // allowing the user to interact with the prompt.
              return; 
          }
          
          // Mock Execution for other tools (e.g., Python)
          await new Promise(r => setTimeout(r, 1000));
          
          if(response.toolCalls.find(t => t.name === 'execute_python_script')) {
              const resultMsg: Message = {
                id: Date.now().toString() + '-res',
                role: MessageRole.TOOL,
                text: `Output:\nProcess exited with code 0\n> Data processed successfully.`,
                timestamp: new Date()
              }
              setMessages(prev => [...prev, resultMsg]);
          }
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: MessageRole.SYSTEM,
        text: 'Error connecting to Neural Link.',
        timestamp: new Date()
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmMemory = () => {
    if (!pendingMemory) return;

    // 1. Commit to "DB"
    const newMemory: MemoryRecord = {
      id: Date.now().toString(),
      type: 'long-term',
      content: pendingMemory.content,
      importance: pendingMemory.importance,
      tags: pendingMemory.tags,
      timestamp: 'Just now'
    };
    setLongTermMemories(prev => [newMemory, ...prev]);

    // 2. Add Confirmation Message to Chat
    const resultMsg: Message = {
      id: Date.now().toString() + '-res',
      role: MessageRole.TOOL,
      text: `Memory System Output:\n> Write confirmed by user [${pendingMemory.importance}/10].\n> Data persisted to vector store.`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, resultMsg]);
    
    // 3. Clear State
    setPendingMemory(null);
  };

  const handleDenyMemory = () => {
    if (!pendingMemory) return;

    // 1. Add Abort Message
    const resultMsg: Message = {
      id: Date.now().toString() + '-res',
      role: MessageRole.TOOL,
      text: `Memory System Output:\n> Write operation aborted by user.\n> Data discarded.`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, resultMsg]);

    // 2. Clear State
    setPendingMemory(null);
  };

  return (
    <div className="flex h-screen bg-[#020617] text-slate-200 overflow-hidden font-sans">
      {/* LCARS Sidebar / Nav */}
      <div className={`bg-slate-950 border-r border-slate-800 flex flex-col transition-all duration-300 ${showSidebar ? 'w-64' : 'w-16'}`}>
        <div className="h-16 flex items-center px-4 border-b border-slate-800 lcars-border border-l-[6px]">
          <TermIcon className="text-amber-500 w-6 h-6 mr-3" />
          {showSidebar && <h1 className="font-bold text-xl tracking-widest text-amber-500 font-mono">NEXUS<span className="text-cyan-400">PRIME</span></h1>}
        </div>
        
        <nav className="flex-1 p-2 space-y-2">
           <button onClick={() => setShowMemory(!showMemory)} className={`w-full flex items-center p-3 rounded hover:bg-slate-900 transition-colors ${showMemory ? 'bg-slate-900 border-l-2 border-cyan-500' : ''}`}>
             <Layout className="w-5 h-5 text-cyan-400" />
             {showSidebar && <span className="ml-3 font-mono text-sm">Memory Grid</span>}
           </button>
           <div className="w-full flex items-center p-3 rounded hover:bg-slate-900 transition-colors text-slate-500 cursor-not-allowed">
             <Settings className="w-5 h-5" />
             {showSidebar && <span className="ml-3 font-mono text-sm">Configuration</span>}
           </div>
        </nav>

        <div className="p-4 border-t border-slate-800">
           <div className="text-[10px] font-mono text-slate-500 mb-1">SYSTEM STATUS</div>
           <div className="flex items-center gap-2 text-xs text-green-400 font-mono">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
             ONLINE
           </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur">
          <div className="flex items-center gap-4">
            <button onClick={() => setShowSidebar(!showSidebar)} className="text-slate-400 hover:text-white">
              <Menu className="w-5 h-5" />
            </button>
            <div className="h-6 w-[1px] bg-slate-700"></div>
            <span className="font-mono text-sm text-cyan-500">SESSION: 42-HOUR-MARATHON-DEV</span>
          </div>
          <div className="flex items-center gap-4">
             <span className="text-xs font-mono text-amber-500">MODEL: GEMINI-2.5-FLASH</span>
          </div>
        </header>

        {/* Workspace Grid */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col min-w-0 relative">
             <ChatArea messages={messages} isProcessing={isProcessing} />

             {/* Pending Memory Prompt Overlay */}
             {pendingMemory && (
                <div className="absolute bottom-6 left-6 right-6 z-20 animate-in slide-in-from-bottom-5 fade-in duration-300">
                   <div className="bg-slate-950/90 border-l-4 border-amber-500 rounded-r-lg p-4 shadow-[0_0_50px_rgba(245,158,11,0.2)] backdrop-blur-xl flex items-start gap-4">
                      <div className="bg-amber-500/20 p-2 rounded-full text-amber-500 shrink-0 mt-1">
                        <Save className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                           <h3 className="text-amber-500 font-bold font-mono text-sm flex items-center gap-2 mb-1">
                             SYSTEM INTERRUPT: CONFIRM MEMORY WRITE
                             {pendingMemory.importance >= 8 && (
                               <span className="text-[10px] bg-red-900/50 text-red-400 border border-red-800 px-1 rounded flex items-center gap-1">
                                 <AlertTriangle className="w-3 h-3" /> CRITICAL
                               </span>
                             )}
                           </h3>
                        </div>
                        <p className="text-slate-400 text-xs mb-3">
                          The model has requested to persist new information to long-term storage. This will influence future context.
                        </p>
                        <div className="bg-black/60 p-3 rounded border border-slate-800 font-mono text-xs text-cyan-200 mb-4 shadow-inner">
                          <span className="text-slate-500 select-none">DATA &gt; </span>"{pendingMemory.content}"
                          <div className="mt-2 flex gap-2">
                             {pendingMemory.tags.map(tag => (
                               <span key={tag} className="text-[10px] text-amber-600 bg-amber-950/30 px-1 rounded">#{tag}</span>
                             ))}
                          </div>
                        </div>
                        <div className="flex gap-3">
                           <button 
                             onClick={handleConfirmMemory}
                             className="flex items-center gap-2 bg-emerald-900/30 hover:bg-emerald-800/50 text-emerald-400 border border-emerald-800 hover:border-emerald-500 px-6 py-2 rounded-sm text-xs font-bold font-mono tracking-wider transition-all"
                           >
                             <Check className="w-4 h-4" /> AUTHORIZE
                           </button>
                           <button 
                             onClick={handleDenyMemory}
                             className="flex items-center gap-2 bg-red-900/30 hover:bg-red-800/50 text-red-400 border border-red-800 hover:border-red-500 px-6 py-2 rounded-sm text-xs font-bold font-mono tracking-wider transition-all"
                           >
                             <X className="w-4 h-4" /> REJECT
                           </button>
                        </div>
                      </div>
                   </div>
                </div>
             )}
             
             {/* Input Area */}
             <div className="p-4 bg-slate-900/80 border-t border-slate-800 backdrop-blur z-10 relative">
               <div className="max-w-4xl mx-auto flex gap-4 items-end">
                 <button className="p-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors">
                   <Upload className="w-5 h-5" />
                 </button>
                 <div className="flex-1 bg-slate-800 rounded-lg border border-slate-700 focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500/50 transition-all flex flex-col">
                   <textarea 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    disabled={!!pendingMemory || isProcessing}
                    placeholder={pendingMemory ? "Awaiting confirmation..." : "Command the Nexus..."}
                    className="bg-transparent border-none p-3 text-slate-200 focus:ring-0 resize-none h-14 min-h-[56px] max-h-32 custom-scrollbar placeholder:text-slate-600 font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                   />
                 </div>
                 <button className="p-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors">
                   <Mic className="w-5 h-5" />
                 </button>
                 <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isProcessing || !!pendingMemory}
                  className="p-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                 >
                   <Send className="w-5 h-5" />
                 </button>
               </div>
               <div className="text-center mt-2">
                 <span className="text-[10px] text-slate-600 font-mono">
                   AI can make mistakes. Check generated code.
                 </span>
               </div>
             </div>
          </div>

          {/* Right Sidebar: Memory & Tools */}
          {showMemory && (
            <div className="w-80 border-l border-slate-800 flex flex-col transition-all duration-300">
               <MemoryPanel shortTermMemories={shortTermMemories} longTermMemories={longTermMemories} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;