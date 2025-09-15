'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle, Hash } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

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

  // Scroll to top on initial mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    // Only scroll to bottom when there are actual messages (user has started chatting)
    if (messages.length > 0) {
      scrollToBottom();
    }
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
    <div className="h-full flex flex-col" style={{ backgroundColor: '#003D5B' }}>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">Error: {error}</p>
            </div>
          )}
          
          {!messages || messages.length === 0 ? (
            <div className="flex items-center justify-center min-h-full overflow-y-auto py-8">
              <div className="text-center px-8 w-full max-w-7xl">
                <svg className="mx-auto h-16 w-16 text-white/70 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h2 className="font-montserrat font-semibold text-2xl sm:text-3xl md:text-4xl lg:text-[48px] text-white mb-2 mt-8">Concentrix SEO Assistant</h2>
                <p className="font-montserrat text-body font-regular text-white/80 mb-8 max-w-3xl mx-auto">
                  Welcome, team member! I have access to all Concentrix website content and can help you optimize 
                  our SEO performance. Ask me about our pages, content analysis, or SEO improvements.
                </p>
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 text-left">
                  {/* SEO Analysis Tools */}
                  <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                    <h3 className="font-montserrat text-sm font-semibold text-white mb-2">SEO Analysis</h3>
                    <p className="font-montserrat text-xs text-white/70">&quot;Analyze the SEO performance of our homepage&quot;</p>
                  </div>
                  
                  {/* Meta Tags */}
                  <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                    <h3 className="font-montserrat text-sm font-semibold text-white mb-2">Meta Tags Audit</h3>
                    <p className="font-montserrat text-xs text-white/70">&quot;Check meta tags optimization for our services page&quot;</p>
                  </div>
                  
                  {/* Keywords Analysis */}
                  <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                    <h3 className="font-montserrat text-sm font-semibold text-white mb-2">Keyword Research</h3>
                    <p className="font-montserrat text-xs text-white/70">&quot;What keywords is our homepage targeting?&quot;</p>
                  </div>
                  
                  {/* Headings Structure */}
                  <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                    <h3 className="font-montserrat text-sm font-semibold text-white mb-2">Heading Structure</h3>
                    <p className="font-montserrat text-xs text-white/70">&quot;Audit the heading hierarchy on our about page&quot;</p>
                  </div>
                  
                  {/* Content Quality */}
                  <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                    <h3 className="font-montserrat text-sm font-semibold text-white mb-2">Content Quality</h3>
                    <p className="font-montserrat text-xs text-white/70">&quot;Analyze content quality metrics for our blog posts&quot;</p>
                  </div>
                  
                  {/* Readability Check */}
                  <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                    <h3 className="font-montserrat text-sm font-semibold text-white mb-2">Readability</h3>
                    <p className="font-montserrat text-xs text-white/70">&quot;Check readability score for our services content&quot;</p>
                  </div>
                  
                  {/* Content Depth */}
                  <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                    <h3 className="font-montserrat text-sm font-semibold text-white mb-2">Content Depth</h3>
                    <p className="font-montserrat text-xs text-white/70">&quot;How comprehensive is our AI solutions page?&quot;</p>
                  </div>
                  
                  {/* SEO Comparison */}
                  <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                    <h3 className="font-montserrat text-sm font-semibold text-white mb-2">Page Comparison</h3>
                    <p className="font-montserrat text-xs text-white/70">&quot;Compare SEO between homepage and services page&quot;</p>
                  </div>
                  
                  {/* SEO Suggestions */}
                  <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                    <h3 className="font-montserrat text-sm font-semibold text-white mb-2">SEO Recommendations</h3>
                    <p className="font-montserrat text-xs text-white/70">&quot;Generate SEO improvement suggestions for our contact page&quot;</p>
                  </div>
                  
                  {/* Homepage Analysis */}
                  <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                    <h3 className="font-montserrat text-sm font-semibold text-white mb-2">Homepage Info</h3>
                    <p className="font-montserrat text-xs text-white/70">&quot;What is our homepage meta description?&quot;</p>
                  </div>
                  
                  {/* Content Search */}
                  <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                    <h3 className="font-montserrat text-sm font-semibold text-white mb-2">Content Search</h3>
                    <p className="font-montserrat text-xs text-white/70">&quot;Find content about customer experience solutions&quot;</p>
                  </div>
                  
                  {/* List Pages */}
                  <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                    <h3 className="font-montserrat text-sm font-semibold text-white mb-2">Site Overview</h3>
                    <p className="font-montserrat text-xs text-white/70">&quot;List all pages in our website&quot;</p>
                  </div>
                  
                  {/* Google Search Console - Divider */}
                  <div className="col-span-full mt-4 mb-2">
                    <h3 className="font-montserrat text-sm font-semibold text-white/90 text-center">Google Search Console Analytics</h3>
                  </div>
                  
                  {/* GSC Top Queries */}
                  <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                    <h3 className="font-montserrat text-sm font-semibold text-white mb-2">Top Queries</h3>
                    <p className="font-montserrat text-xs text-white/70">&quot;Show our top performing search queries&quot;</p>
                  </div>
                  
                  {/* GSC Top Pages */}
                  <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                    <h3 className="font-montserrat text-sm font-semibold text-white mb-2">Top Pages</h3>
                    <p className="font-montserrat text-xs text-white/70">&quot;Which pages get the most search traffic?&quot;</p>
                  </div>
                  
                  {/* GSC Striking Distance */}
                  <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                    <h3 className="font-montserrat text-sm font-semibold text-white mb-2">Quick Win Keywords</h3>
                    <p className="font-montserrat text-xs text-white/70">&quot;Find keywords ranking on page 2&quot;</p>
                  </div>
                  
                  {/* GSC Query Trends */}
                  <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                    <h3 className="font-montserrat text-sm font-semibold text-white mb-2">Query Trends</h3>
                    <p className="font-montserrat text-xs text-white/70">&quot;Show search query performance over time&quot;</p>
                  </div>
                  
                  {/* GSC All-Time Queries */}
                  <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                    <h3 className="font-montserrat text-sm font-semibold text-white mb-2">Historical Queries</h3>
                    <p className="font-montserrat text-xs text-white/70">&quot;Analyze all-time query performance&quot;</p>
                  </div>
                  
                  {/* GSC All-Time Pages */}
                  <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                    <h3 className="font-montserrat text-sm font-semibold text-white mb-2">Page History</h3>
                    <p className="font-montserrat text-xs text-white/70">&quot;Show historical page performance data&quot;</p>
                  </div>
                  
                  {/* GSC Performance Comparison */}
                  <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                    <h3 className="font-montserrat text-sm font-semibold text-white mb-2">Period Comparison</h3>
                    <p className="font-montserrat text-xs text-white/70">&quot;Compare this month vs last month&quot;</p>
                  </div>
                  
                  {/* GSC Content Types */}
                  <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                    <h3 className="font-montserrat text-sm font-semibold text-white mb-2">Content Types</h3>
                    <p className="font-montserrat text-xs text-white/70">&quot;How do blog posts perform vs service pages?&quot;</p>
                  </div>
                  
                  {/* GSC Keyword Analysis */}
                  <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                    <h3 className="font-montserrat text-sm font-semibold text-white mb-2">Keyword Clusters</h3>
                    <p className="font-montserrat text-xs text-white/70">&quot;Analyze keywords by topic and intent&quot;</p>
                  </div>
                  
                  {/* GSC Blog Insights */}
                  <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                    <h3 className="font-montserrat text-sm font-semibold text-white mb-2">Blog Performance</h3>
                    <p className="font-montserrat text-xs text-white/70">&quot;Show blog post search performance&quot;</p>
                  </div>
                  
                  {/* GSC Lifetime Summary */}
                  <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                    <h3 className="font-montserrat text-sm font-semibold text-white mb-2">Overall Summary</h3>
                    <p className="font-montserrat text-xs text-white/70">&quot;Show lifetime search performance metrics&quot;</p>
                  </div>
                  
                  {/* GSC Connection Test */}
                  <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                    <h3 className="font-montserrat text-sm font-semibold text-white mb-2">GSC Status</h3>
                    <p className="font-montserrat text-xs text-white/70">&quot;Test Search Console connection&quot;</p>
                  </div>
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
                        className={`px-6 py-4 rounded-2xl shadow-lg ${
                          message.role === 'user'
                            ? 'bg-white text-gray-900 ml-12'
                            : 'bg-white text-gray-900 mr-12 border border-gray-200'
                        }`}
                      >
                        {message.role === 'assistant' && (
                          <div className="flex items-center mb-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#003D5B' }}>
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm2 2a1 1 0 000 2h8a1 1 0 100-2H5z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span className="text-caption font-medium text-gray-800">SEO Assistant</span>
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
                        
                        <div className="prose prose-sm max-w-none text-gray-900">
                          <ReactMarkdown
                            components={{
                              h1: ({ children }) => <h1 className="text-2xl font-bold text-gray-900 mb-4 mt-6">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-xl font-semibold text-gray-900 mb-3 mt-5">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-lg font-medium text-gray-900 mb-2 mt-4">{children}</h3>,
                              p: ({ children }) => <p className="text-body font-regular text-gray-900 mb-3 leading-relaxed">{children}</p>,
                              ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1 text-gray-900">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1 text-gray-900">{children}</ol>,
                              li: ({ children }) => <li className="text-body font-regular text-gray-900">{children}</li>,
                              strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                              em: ({ children }) => <em className="italic text-gray-900">{children}</em>,
                              code: ({ children }) => <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm font-mono">{children}</code>,
                              blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700 mb-3">{children}</blockquote>,
                              a: ({ href, children }) => <a href={href} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">{children}</a>
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
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
                <div className="bg-white text-gray-900 mr-12 border border-gray-200 px-6 py-4 rounded-2xl shadow-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#003D5B' }}>
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm2 2a1 1 0 000 2h8a1 1 0 100-2H5z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <span className="text-caption font-regular text-gray-700">Analyzing...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-white/20 p-4" style={{ backgroundColor: '#003D5B' }}>
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
                placeholder="Ask about Concentrix SEO performance, analyze pages, or get optimization recommendations..."
                onChange={(e) => setInput(e.target.value)}
                className="w-full px-4 py-3 pr-12 text-body font-regular text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-lg placeholder:text-gray-500"
                disabled={isLoading}
              />
              <button 
                type="submit" 
                disabled={isLoading || !input?.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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