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
    <div className="h-full flex flex-col bg-white">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">Error: {error}</p>
            </div>
          )}
          
          {!messages || messages.length === 0 ? (
            <div className="flex items-center justify-center h-96 text-gray-500">
              <div className="text-center max-w-md">
                <svg className="mx-auto h-16 w-16 text-gray-400 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h2 className="text-heading-4 font-semibold text-gray-800 mb-2">Welcome to SEO Assistant</h2>
                <p className="text-body font-regular text-gray-600">
                  I&apos;m here to help you with SEO analysis and insights. You can ask me about website optimization, 
                  content analysis, or any other SEO-related questions. Try asking something like:
                </p>
                <div className="mt-4 space-y-2 text-caption font-regular text-gray-500">
                  <p>&quot;Analyze the SEO performance of example.com&quot;</p>
                  <p>&quot;What are the best practices for meta descriptions?&quot;</p>
                  <p>&quot;Help me improve my website&apos;s SEO score&quot;</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <div key={message.id} className="group">
                  <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex max-w-4xl w-full ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`px-6 py-4 rounded-2xl shadow-sm ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white ml-12'
                            : 'bg-gray-50 text-gray-900 mr-12 border border-gray-200'
                        }`}
                      >
                        {message.role === 'assistant' && (
                          <div className="flex items-center mb-3">
                            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center mr-3">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm2 2a1 1 0 000 2h8a1 1 0 100-2H5z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span className="text-caption font-medium text-gray-700">SEO Assistant</span>
                          </div>
                        )}
                        
                        {/* Display tool calls */}
                        {message.toolCalls && message.toolCalls.length > 0 && (
                          <div className="mb-4 space-y-3">
                            {message.toolCalls.map((toolCall) => (
                              <div key={toolCall.id} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                                <div className="flex items-center mb-2">
                                  <Hash className="w-4 h-4 mr-2 text-blue-600" />
                                  <span className="text-caption font-medium text-blue-800">
                                    Tool: {toolCall.name}
                                  </span>
                                  {toolCall.result && (
                                    <CheckCircle className="w-4 h-4 ml-2 text-green-600" />
                                  )}
                                </div>
                                
                                <div className="text-caption font-regular text-blue-700 mb-2">
                                  <pre className="whitespace-pre-wrap font-mono text-xs">
                                    {JSON.stringify(toolCall.args, null, 2)}
                                  </pre>
                                </div>
                                
                                {toolCall.result && (
                                  <div className="text-caption font-regular text-green-700">
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
                        
                        <div className="whitespace-pre-wrap text-body font-regular">
                          {message.content}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {isLoading && (
            <div className="mt-6">
              <div className="flex justify-start">
                <div className="bg-gray-50 text-gray-900 mr-12 border border-gray-200 px-6 py-4 rounded-2xl shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm2 2a1 1 0 000 2h8a1 1 0 100-2H5z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <span className="text-caption font-regular text-gray-600">Analyzing...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="max-w-4xl mx-auto">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (input.trim()) {
                handleSendMessage(input);
                setInput('');
              }
            }} 
            className="flex space-x-4"
          >
            <div className="flex-1 relative">
              <input
                value={input}
                placeholder="Ask me anything about SEO optimization, website analysis, or content strategy..."
                onChange={(e) => setInput(e.target.value)}
                className="w-full px-4 py-3 pr-12 text-body font-regular text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm"
                disabled={isLoading}
              />
              <button 
                type="submit" 
                disabled={isLoading || !input?.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}