'use client';

import { useEffect, useRef, useState } from 'react';
import SEOScoreCard from './seo/seo-score-card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { CheckCircle, AlertTriangle, ExternalLink, Hash, Tags, Link, Image as ImageIcon } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolResults?: any[];
}

interface SEOVisualizationProps {
  data: any;
  type: 'analyze' | 'keywords' | 'compare' | 'suggestions' | 'headings' | 'meta';
}

// SEO Visualization Component
function SEOVisualization({ data, type }: SEOVisualizationProps) {
  if (!data) return null;

  switch (type) {
    case 'analyze':
      if (data.seo_score) {
        return (
          <div className="my-4 p-4 bg-gray-50 rounded-lg">
            <div className="mb-3">
              <h4 className="text-sm font-medium text-gray-700 flex items-center">
                <BarChart className="w-4 h-4 mr-2" />
                SEO Analysis Results
              </h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="text-center p-3 bg-white rounded border">
                <div className="text-xl font-bold text-blue-600">{Math.round(data.seo_score.overall_score)}</div>
                <div className="text-xs text-blue-700">Overall Score</div>
              </div>
              <div className="text-center p-3 bg-white rounded border">
                <div className="text-xl font-bold text-green-600">{data.seo_score.grade}</div>
                <div className="text-xs text-green-700">Grade</div>
              </div>
              <div className="text-center p-3 bg-white rounded border">
                <div className="text-xl font-bold text-orange-600">
                  {data.seo_score.priority_issues?.filter((i: any) => i.impact === 'high').length || 0}
                </div>
                <div className="text-xs text-orange-700">High Priority</div>
              </div>
              <div className="text-center p-3 bg-white rounded border">
                <div className="text-xl font-bold text-purple-600">{data.seo_score.priority_issues?.length || 0}</div>
                <div className="text-xs text-purple-700">Total Issues</div>
              </div>
            </div>
            {data.seo_score.category_scores && (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={Object.entries(data.seo_score.category_scores).map(([key, value]) => ({ name: key, score: value }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="score" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        );
      }
      break;
      
    case 'keywords':
      if (data.keyword_analysis) {
        return (
          <div className="my-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <Tags className="w-4 h-4 mr-2" />
              Keyword Analysis
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="text-xs font-medium text-gray-600 mb-2">Top Keywords</h5>
                <div className="space-y-1">
                  {Object.entries(data.keyword_analysis.density || {})
                    .sort(([,a], [,b]) => (b as number) - (a as number))
                    .slice(0, 5)
                    .map(([keyword, density]) => (
                      <div key={keyword} className="flex justify-between text-xs p-2 bg-white rounded border">
                        <span className="font-medium">{keyword}</span>
                        <span className="text-blue-600">{Math.round((density as number) * 100) / 100}%</span>
                      </div>
                    ))
                  }
                </div>
              </div>
              <div>
                <h5 className="text-xs font-medium text-gray-600 mb-2">Analysis Score</h5>
                <div className="text-center p-4 bg-white rounded border">
                  <div className="text-2xl font-bold text-green-600">{Math.round(data.keyword_analysis.score)}</div>
                  <div className="text-xs text-green-700">Keyword Score</div>
                </div>
              </div>
            </div>
          </div>
        );
      }
      break;
      
    case 'compare':
      if (data.comparison) {
        return (
          <div className="my-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <ExternalLink className="w-4 h-4 mr-2" />
              SEO Comparison
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-white rounded border">
                <div className="text-sm font-medium text-gray-600 mb-2">Title Analysis</div>
                <div className="flex justify-between text-xs">
                  <span>URL 1: {data.comparison.title_comparison?.url1_score}</span>
                  <span>URL 2: {data.comparison.title_comparison?.url2_score}</span>
                </div>
                <div className={`text-xs mt-1 font-medium ${
                  data.comparison.title_comparison?.winner === 'url1' ? 'text-green-600' :
                  data.comparison.title_comparison?.winner === 'url2' ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  Winner: {data.comparison.title_comparison?.winner === 'tie' ? 'Tie' : data.comparison.title_comparison?.winner?.toUpperCase()}
                </div>
              </div>
              <div className="text-center p-3 bg-white rounded border">
                <div className="text-sm font-medium text-gray-600 mb-2">Meta Description</div>
                <div className="flex justify-between text-xs">
                  <span>URL 1: {data.comparison.meta_description_comparison?.url1_score}</span>
                  <span>URL 2: {data.comparison.meta_description_comparison?.url2_score}</span>
                </div>
                <div className={`text-xs mt-1 font-medium ${
                  data.comparison.meta_description_comparison?.winner === 'url1' ? 'text-green-600' :
                  data.comparison.meta_description_comparison?.winner === 'url2' ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  Winner: {data.comparison.meta_description_comparison?.winner === 'tie' ? 'Tie' : data.comparison.meta_description_comparison?.winner?.toUpperCase()}
                </div>
              </div>
              <div className="text-center p-3 bg-white rounded border">
                <div className="text-sm font-medium text-gray-600 mb-2">Overall Winner</div>
                <div className={`text-lg font-bold ${
                  data.comparison.overall_winner === 'url1' ? 'text-green-600' :
                  data.comparison.overall_winner === 'url2' ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  {data.comparison.overall_winner === 'tie' ? 'Tie' : data.comparison.overall_winner?.toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        );
      }
      break;
      
    case 'suggestions':
      if (data.suggestions && Array.isArray(data.suggestions)) {
        return (
          <div className="my-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              SEO Recommendations
            </h4>
            <div className="space-y-2">
              {data.suggestions.slice(0, 5).map((suggestion: any, index: number) => (
                <div key={index} className="flex items-start p-3 bg-white rounded border">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 text-xs font-bold text-white ${
                    suggestion.impact === 'high' ? 'bg-red-500' :
                    suggestion.impact === 'medium' ? 'bg-orange-500' : 'bg-green-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-gray-900">{suggestion.issue || suggestion.recommendation}</div>
                    <div className="flex items-center mt-1 space-x-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        suggestion.impact === 'high' ? 'bg-red-100 text-red-700' :
                        suggestion.impact === 'medium' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {suggestion.impact} impact
                      </span>
                      <span className="text-xs text-gray-500">+{suggestion.score_impact} points</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }
      break;
  }
  
  return null;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Function to parse tool results from AI response
  const parseToolResults = (content: string): any[] => {
    const results = [];
    const toolRegex = /\[TOOL_RESULT:(.*?)\]/g;
    let match;
    
    while ((match = toolRegex.exec(content)) !== null) {
      try {
        const toolData = JSON.parse(match[1]);
        results.push(toolData);
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    return results;
  };
  
  // Function to clean content of tool result markers
  const cleanContent = (content: string): string => {
    return content.replace(/\[TOOL_RESULT:.*?\]/g, '').trim();
  };

  return (
    <div className="border border-gray-300 rounded-lg h-96 flex flex-col bg-white">
      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
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
                <div className="whitespace-pre-wrap">{message.content}</div>
                {/* SEO Tool Results Visualization */}
                {message.toolResults && message.toolResults.map((result, index) => {
                  const toolType = result.tool || 'analyze';
                  return (
                    <SEOVisualization
                      key={index}
                      data={result}
                      type={toolType}
                    />
                  );
                })}
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
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (input.trim()) {
            setIsLoading(true);
            const userMessage: Message = {
              id: Date.now().toString(),
              role: 'user',
              content: input
            };
            
            const updatedMessages = [...messages, userMessage];
            setMessages(updatedMessages);
            setInput('');

            try {
              const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: updatedMessages })
              });

              if (response.body) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let assistantContent = '';
                
                const assistantMessage: Message = {
                  id: (Date.now() + 1).toString(),
                  role: 'assistant',
                  content: ''
                };
                
                setMessages([...updatedMessages, assistantMessage]);

                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  
                  const chunk = decoder.decode(value);
                  assistantContent += chunk;
                  
                  const toolResults = parseToolResults(assistantContent);
                  const cleanedContent = cleanContent(assistantContent);
                  
                  setMessages(prev => prev.map(msg => 
                    msg.id === assistantMessage.id 
                      ? { ...msg, content: cleanedContent, toolResults }
                      : msg
                  ));
                }
              }
            } catch (error) {
              console.error('Chat error:', error);
              setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Sorry, there was an error processing your request.'
              }]);
            } finally {
              setIsLoading(false);
            }
          }
        }} className="flex space-x-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about the scraped content..."
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
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