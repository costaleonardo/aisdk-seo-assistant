'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle, AlertTriangle, ExternalLink, Hash, Tags, Link, Image as ImageIcon, BarChart } from 'lucide-react';

interface ToolCall {
  id: string;
  name: string;
  args: any;
  result?: any;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
  toolCalls?: ToolCall[];
}

export default function ChatInterface() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (messageContent: string) => {
    setIsLoading(true);
    setError(null);
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      createdAt: new Date()
    };
    
    // Add user message immediately
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (reader) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '',
          createdAt: new Date(),
          toolCalls: []
        };
        
        setMessages(prev => [...prev, aiMessage]);
        
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          
          // Update the AI message content with accumulated buffer
          setMessages(prev => 
            prev.map(msg => 
              msg.id === aiMessage.id 
                ? { ...msg, content: buffer }
                : msg
            )
          );
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border border-gray-300 rounded-lg h-96 flex flex-col bg-white">
      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">Error: {error}</p>
          </div>
        )}
        
        {!messages || messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm">Start a conversation by asking questions about your scraped content!</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center mb-1">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm2 2a1 1 0 000 2h8a1 1 0 100-2H5z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs text-gray-600 font-medium">Assistant</span>
                  </div>
                )}
                
                {/* Display tool calls */}
                {message.toolCalls && message.toolCalls.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {message.toolCalls.map((toolCall) => (
                      <div key={toolCall.id} className="p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                        <div className="flex items-center mb-1">
                          <Hash className="w-3 h-3 mr-1 text-blue-600" />
                          <span className="text-xs font-medium text-blue-800">
                            Tool: {toolCall.name}
                          </span>
                          {toolCall.result && (
                            <CheckCircle className="w-3 h-3 ml-2 text-green-600" />
                          )}
                        </div>
                        
                        <div className="text-xs text-blue-700 mb-1">
                          Args: {JSON.stringify(toolCall.args, null, 2)}
                        </div>
                        
                        {toolCall.result && (
                          <div className="text-xs text-green-700">
                            ✓ Completed successfully
                            {toolCall.result.count && (
                              <span className="ml-2">
                                ({toolCall.result.count} results)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="whitespace-pre-wrap">
                  {message.content}
                </div>
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <span className="text-sm text-gray-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-300 p-4">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) {
              handleSendMessage(input);
              setInput('');
            }
          }} 
          className="flex space-x-2"
        >
          <input
            value={input}
            placeholder="Ask a question about the scraped content..."
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          />
          <button 
            type="submit" 
            disabled={isLoading || !input?.trim()}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Send'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}