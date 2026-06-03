'use client';
import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import styles from './ChatBox.module.css';

export default function ChatBox({ paperId, paperTitle }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    loadHistory();
  }, [paperId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadHistory() {
    try {
      const data = await api.get(`/chat/${paperId}`);
      setMessages(data);
    } catch (err) {
      console.error('Failed to load chat history', err);
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { response } = await api.post(`/chat/${paperId}`, { message: input });
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Error: " + err.message }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.chatContainer}>
      <div className={styles.header}>
        <h2>Chat with Paper</h2>
        <p className={styles.subtitle}>{paperTitle}</p>
      </div>

      <div className={styles.messages}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`${styles.msgBubble} ${msg.role === 'user' ? styles.user : styles.assistant}`}
          >
            <p>{msg.content}</p>
          </div>
        ))}
        {loading && (
          <div className={`${styles.msgBubble} ${styles.assistant}`}>
            <div className={styles.typingIndicator}>
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className={styles.inputArea}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about this paper..."
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()} className={styles.sendBtn}>
          ➤
        </button>
      </form>
    </div>
  );
}
