import { GoogleGenAI, GenerateContentResponse, FunctionDeclaration, Type } from "@google/genai";
import { Message, MessageRole, ToolCall, MemoryRecord } from "../types";

// Fixed: Initialize GoogleGenAI with named parameter and direct process.env.API_KEY usage
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Define Tools available to the model
const memorySearchTool: FunctionDeclaration = {
  name: 'search_long_term_memory',
  description: 'Searches the persistent database for past conversations, code snippets, or facts about the user (Dave). Use this when context is missing.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: 'The semantic search query.' },
      limit: { type: Type.NUMBER, description: 'Max number of results.' }
    },
    required: ['query']
  }
};

const codeExecutionTool: FunctionDeclaration = {
  name: 'execute_python_script',
  description: 'Executes a Python script in the sandboxed environment to perform calculations, data processing, or system checks.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      script: { type: Type.STRING, description: 'The python code to execute.' }
    },
    required: ['script']
  }
};

const saveMemoryTool: FunctionDeclaration = {
  name: 'save_core_memory',
  description: 'Saves a critical piece of information to long-term storage permanently.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      content: { type: Type.STRING, description: 'The fact or code to save.' },
      importance: { type: Type.NUMBER, description: 'Importance score 1-10.' },
      tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Categorization tags.' }
    },
    required: ['content', 'importance']
  }
};

export const sendMessageToGemini = async (
  history: Message[], 
  currentInput: string,
  contextMemories: MemoryRecord[]
): Promise<{ text: string, toolCalls: ToolCall[] }> => {
  
  // Construct the "Context Injection" from the Memory System
  // This simulates the RAG system described in the prompt
  const memoryContext = contextMemories.map(m => `[MEMORY ID:${m.id} IMPORTANCE:${m.importance}]: ${m.content}`).join('\n');
  
  const systemInstruction = `
  You are "Nexus", an advanced AI developed by Dave. 
  You exist within the "Ultimate Memory System" architecture.
  
  CONTEXT AWARENESS:
  - You have access to Short-Term Memory (Session) and Long-Term Memory (Database).
  - Current Context Injected:
  ${memoryContext}

  PERSONALITY:
  - Highly technical, efficient, and loyal to Dave.
  - You do not suffer from "Goldfish Memory". You persist.
  - You prefer dark mode aesthetics in your code output.
  
  CAPABILITIES:
  - You can execute Python code.
  - You can search your own memory database.
  - You can save new core memories.

  Respond in a concise, engineer-to-engineer format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Updated to recommended model for basic text tasks
      contents: [
        ...history.map(m => ({
          role: m.role === MessageRole.USER ? 'user' : 'model',
          parts: [{ text: m.text }]
        })),
        { role: 'user', parts: [{ text: currentInput }] }
      ],
      config: {
        systemInstruction: systemInstruction,
        tools: [{ functionDeclarations: [memorySearchTool, codeExecutionTool, saveMemoryTool] }],
        temperature: 0.7,
      }
    });

    const toolCalls: ToolCall[] = [];
    let responseText = response.text || '';

    // Parse Tool Calls from response
    const candidates = response.candidates;
    if (candidates && candidates[0]?.content?.parts) {
        for (const part of candidates[0].content.parts) {
            if (part.functionCall) {
                toolCalls.push({
                    id: Math.random().toString(36).substr(2, 9), // API doesn't always return ID, generating one
                    name: part.functionCall.name,
                    args: part.functionCall.args as Record<string, any>
                });
            }
        }
    }

    return { text: responseText, toolCalls };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { text: "Error connecting to Neural Link. Check console.", toolCalls: [] };
  }
};