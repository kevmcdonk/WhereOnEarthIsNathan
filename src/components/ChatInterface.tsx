import { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import azureService from '../services/AzureService';

import { DefaultAzureCredential } from "@azure/identity";

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);
  
  //private config: AzureServiceConfig;
  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        const authState = await azureService.isAuthenticated();
        setIsAuthenticated(authState);
        
        // If authenticated, try to start a new thread
        if (authState) {
          try {
            await azureService.startNewThread();
          } catch (threadError) {
            console.error("Failed to start thread:", threadError);
          }
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
      }
    };
    
    checkAuth();
    
    // Add a sample welcome message
    if (messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: 'Hello! How can I help you today?'
        }
      ]);
    }
  }, []);

  useEffect(() => {
    // Scroll to bottom when messages change
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleLogin = async () => {
    try {
      await azureService.login();
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await azureService.logout();
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      if (!isAuthenticated) {
        await handleLogin();
      }
      
      const response = await azureService.callFoundryAgent(input);
      const assistantMessage: ChatMessage = { role: 'assistant', content: response.message || 'Sorry, I didn\'t understand that.' };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, an error occurred while processing your request.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMarkdown = (content: string) => {
    return { __html: marked(content) };
  };

  return (
    <div className="chat-container">
      <div className="mb-4">
        {isAuthenticated ? (
          <button onClick={handleLogout} className="btn btn-secondary text-sm">
            Sign Out
          </button>
        ) : (
          <button onClick={handleLogin} className="btn btn-primary text-sm">
            Sign In with Azure
          </button>
        )}
      </div>
      
      <div className="messages-container h-96 overflow-y-auto mb-4 p-2">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`chat-message ${msg.role === 'user' ? 'chat-message-user' : 'chat-message-ai'}`}
          >
            <div className="flex items-center mb-2">
              <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center mr-2">
                {msg.role === 'user' ? '👤' : '🤖'}
              </div>
              <span className="font-semibold">{msg.role === 'user' ? 'You' : 'Azure Assistant'}</span>
            </div>
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={renderMarkdown(msg.content)} 
            />
          </div>
        ))}
        {isLoading && (
          <div className="chat-message chat-message-ai">
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center mr-2">
                🤖
              </div>
              <span className="font-semibold">Azure Assistant</span>
            </div>
            <div className="mt-2">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messageEndRef} />
      </div>
      
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message here..."
          disabled={isLoading}
          className="flex-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button 
          type="submit" 
          disabled={isLoading || !input.trim()} 
          className="btn btn-primary"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;
