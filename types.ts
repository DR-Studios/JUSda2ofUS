export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system',
  TOOL = 'tool'
}

export interface MemoryRecord {
  id: string;
  content: string;
  timestamp: string;
  importance: number; // 1-10
  type: 'short-term' | 'long-term';
  tags: string[];
}

export interface Message {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
}

export interface ToolCall {
  name: string;
  args: Record<string, any>;
  id: string;
}

export interface ToolResult {
  id: string; // Matches ToolCall id
  name: string;
  result: any;
  isError?: boolean;
}

export interface SystemState {
  isConnected: boolean;
  activeSessionId: string;
  memoryUsage: {
    shortTerm: number;
    longTerm: number;
  };
}