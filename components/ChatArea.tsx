import React, { useRef, useEffect } from 'react';
import { Message, MessageRole } from '../types';
import ReactMarkdown from 'react-markdown';
import { User, Bot, Terminal, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatAreaProps {
  messages: Message[];
  isProcessing: boolean;
}

const ChatArea: React.FC<ChatAreaProps> = ({ messages, isProcessing }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative">
      <AnimatePresence>
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-4 ${msg.role === MessageRole.USER ? 'justify-end' : 'justify-start'}`}
          >
            {/* Avatar for Bot */}
            {msg.role !== MessageRole.USER && (
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === MessageRole.TOOL ? 'bg-amber-900/50 text-amber-400' : 'bg-cyan-900/50 text-cyan-400'
              }`}>
                {msg.role === MessageRole.TOOL ? <Terminal size={20} /> : <Bot size={20} />}
              </div>
            )}

            {/* Message Bubble */}
            <div className={`max-w-[80%] rounded-lg p-4 shadow-lg ${
              msg.role === MessageRole.USER 
                ? 'bg-blue-600/20 border border-blue-500/30 text-blue-100' 
                : msg.role === MessageRole.TOOL
                  ? 'bg-slate-900 border border-amber-500/50 font-mono text-xs text-amber-200'
                  : 'bg-slate-800/50 border border-slate-700 text-slate-200'
            }`}>
              <div className="text-[10px] uppercase tracking-widest opacity-40 mb-1 font-mono">
                {msg.role} • {msg.timestamp.toLocaleTimeString()}
              </div>
              
              <div className="prose prose-invert prose-sm max-w-none">
                 {msg.role === MessageRole.TOOL ? (
                   <pre className="whitespace-pre-wrap">{msg.text}</pre>
                 ) : (
                   <ReactMarkdown 
                    components={{
                      code({node, className, children, ...props}) {
                        const match = /language-(\w+)/.exec(className || '')
                        return match ? (
                          <div className="rounded-md overflow-hidden my-2 border border-slate-700 bg-black">
                            <div className="bg-slate-800 px-3 py-1 text-xs text-slate-400 font-mono border-b border-slate-700">
                              {match[1]}
                            </div>
                            <code className={`${className} block p-3 font-mono text-sm`} {...props}>
                              {children}
                            </code>
                          </div>
                        ) : (
                          <code className="bg-slate-800 px-1 py-0.5 rounded text-amber-200 font-mono text-sm" {...props}>
                            {children}
                          </code>
                        )
                      }
                    }}
                   >
                     {msg.text}
                   </ReactMarkdown>
                 )}
              </div>

              {/* Tool Calls Visualization */}
              {msg.toolCalls && msg.toolCalls.length > 0 && (
                <div className="mt-3 space-y-2">
                  {msg.toolCalls.map(tool => (
                    <div key={tool.id} className="bg-black/40 rounded p-2 text-xs font-mono border-l-2 border-purple-500">
                      <div className="text-purple-400 font-bold flex items-center gap-1">
                        <Activity size={12} /> Executing: {tool.name}
                      </div>
                      <div className="text-slate-500 truncate">{JSON.stringify(tool.args)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Avatar for User */}
            {msg.role === MessageRole.USER && (
              <div className="w-10 h-10 bg-blue-900/50 rounded-full flex items-center justify-center shrink-0 text-blue-400">
                <User size={20} />
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {isProcessing && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          className="flex gap-4 items-center"
        >
          <div className="w-10 h-10 bg-cyan-900/20 rounded-full flex items-center justify-center shrink-0">
            <Activity className="animate-spin text-cyan-500" size={20} />
          </div>
          <div className="text-cyan-500 font-mono text-sm animate-pulse">
            NEURAL LINK ACTIVE... PROCESSING REQUEST
          </div>
        </motion.div>
      )}
      
      <div ref={bottomRef} />
    </div>
  );
};

export default ChatArea;