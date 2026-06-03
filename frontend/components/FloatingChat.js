'use client';
import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import styles from './FloatingChat.module.css';

const SUGGESTED_QUESTIONS = [
  "What is the main finding of this paper?",
  "Explain the methodology used",
  "What are the key results?",
  "What are the limitations?",
  "Summarize this in simple terms"
];

export default function FloatingChat({ paperId, paperTitle }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (isOpen && paperId) {
      loadHistory();
    }
  }, [isOpen, paperId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadHistory() {
    try {
      const data = await api.get(`/chat/${paperId}`);
      if (data && data.length > 0) {
        setMessages(data);
        setShowSuggestions(false);
      }
    } catch (err) {
      console.error('Failed to load chat history', err);
    }
  }

  async function sendMessage(message) {
    const msg = message || input;
    if (!msg.trim() || loading) return;

    const userMsg = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setShowSuggestions(false);

    try {
      const { response } = await api.post(`/chat/${paperId}`, { message: msg });
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `⚠️ **Error:** ${err.message}. Please try again later.` 
      }]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    sendMessage();
  }

  function formatContent(content) {
    if (!content) return '';
    
    let formatted = content;
    
    // Handle code blocks (```code```)
    formatted = formatted.replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
    
    // Bold text between ** **
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic text between * *
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Headers (## Header)
    formatted = formatted.replace(/^### (.*?)$/gm, '<h4>$1</h4>');
    formatted = formatted.replace(/^## (.*?)$/gm, '<h3>$1</h3>');
    
    // Convert numbered lists (1. item)
    formatted = formatted.replace(/^(\d+)\.\s(.*?)$/gm, '<li value="$1">$2</li>');
    formatted = formatted.replace(/((?:<li value=.*?<\/li>\n?)+)/g, '<ol>$1</ol>');
    
    // Convert bullet points with • or - to list items
    formatted = formatted.replace(/^[•\-]\s(.*?)$/gm, '<li>$1</li>');
    formatted = formatted.replace(/((?:<li>.*?<\/li>\n?)+)/g, '<ul>$1</ul>');
    
    // Handle inline code
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Convert double newlines to paragraph breaks
    formatted = formatted.replace(/\n\n/g, '</p><p>');
    
    // Convert single newlines to <br>
    formatted = formatted.replace(/\n/g, '<br/>');
    
    // Wrap in paragraph if not already wrapped
    if (!formatted.startsWith('<')) {
      formatted = '<p>' + formatted + '</p>';
    }
    
    return formatted;
  }

  function handleSuggested(q) {
    sendMessage(q);
  }

  return (
    <>
      {/* Chat toggle button */}
      <button 
        className={styles.robotBtn} 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle AI Chat"
      >
        {isOpen ? (
          <span className={styles.closeIcon}>✕</span>
        ) : (
          <span className={styles.robotIcon}>🤖</span>
        )}
      </button>

      {/* Status indicator */}
      {!isOpen && messages.length > 0 && (
        <div className={styles.unreadBadge}>{messages.filter(m => m.role === 'assistant').length}</div>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className={styles.chatPanel}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerInfo}>
              <div className={styles.avatar}>
                <span>🤖</span>
              </div>
              <div className={styles.headerText}>
                <h3>AI Research Assistant</h3>
                <p className={styles.subtitle}>{paperTitle || 'Ask about this paper'}</p>
              </div>
            </div>
            <button 
              className={styles.closeBtn} 
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className={styles.messages}>
            {messages.length === 0 && showSuggestions ? (
              <div className={styles.welcomeSection}>
                <div className={styles.welcomeIcon}>🤖</div>
                <h4 className={styles.welcomeTitle}>Hi! I'm your AI Research Assistant</h4>
                <p className={styles.welcomeText}>
                  Ask me anything about <strong>"{paperTitle}"</strong>. I can help you understand the paper better.
                </p>
                <div className={styles.suggestions}>
                  <p className={styles.suggestionsLabel}>Try asking:</p>
                  {SUGGESTED_QUESTIONS.map((q, idx) => (
                    <button
                      key={idx}
                      className={styles.suggestionChip}
                      onClick={() => handleSuggested(q)}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`${styles.msgBubble} ${msg.role === 'user' ? styles.user : styles.assistant}`}
                  >
                    <div className={styles.msgLabel}>
                      {msg.role === 'user' ? 'You' : 'AI Assistant'}
                    </div>
                    <div 
                      className={styles.msgContent}
                      dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                    />
                    <div className={styles.msgTime}>
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </>
            )}
            
            {loading && (
              <div className={`${styles.msgBubble} ${styles.assistant}`}>
                <div className={styles.msgLabel}>AI Assistant</div>
                <div className={styles.typingIndicator}>
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <form onSubmit={handleSubmit} className={styles.inputArea}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about this paper..."
              disabled={loading}
              className={styles.chatInput}
            />
            <button 
              type="submit" 
              disabled={loading || !input.trim()} 
              className={styles.sendBtn}
            >
              {loading ? '⏳' : '➤'}
            </button>
          </form>
        </div>
      )}
    </>
  );
}