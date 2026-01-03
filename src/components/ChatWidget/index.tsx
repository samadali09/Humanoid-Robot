import React, { useState, useRef, useEffect } from 'react';
import styles from './styles.module.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
}

interface Citation {
  chunk_id: string;
  text: string;
  citation: string;
  score: number;
}

export default function ChatWidget(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputValue,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputValue,
          session_id: localStorage.getItem('chat_session_id') || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Store session ID for conversation continuity
      if (data.session_id) {
        localStorage.setItem('chat_session_id', data.session_id);
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        citations: data.citations,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please make sure the backend server is running on http://localhost:8000',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat toggle button */}
      <button
        className={styles.chatToggle}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle chat"
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chat widget */}
      {isOpen && (
        <div className={styles.chatWidget}>
          <div className={styles.chatHeader}>
            <h3>Ask about the book</h3>
            <button
              className={styles.closeButton}
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          <div className={styles.chatMessages}>
            {messages.length === 0 && (
              <div className={styles.emptyState}>
                <p>👋 Hi! Ask me anything about the book content.</p>
                <p className={styles.hint}>
                  Try: "What is ROS 2?" or "Explain the simulation setup"
                </p>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`${styles.message} ${styles[message.role]}`}
              >
                <div className={styles.messageContent}>{message.content}</div>

                {message.citations && message.citations.length > 0 && (
                  <div className={styles.citations}>
                    <strong>Sources:</strong>
                    <ul>
                      {message.citations.map((citation, idx) => (
                        <li key={idx}>
                          <span className={styles.citationText}>
                            {citation.citation}
                          </span>
                          {citation.score && (
                            <span className={styles.citationScore}>
                              ({(citation.score * 100).toFixed(0)}% relevant)
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className={`${styles.message} ${styles.assistant}`}>
                <div className={styles.messageContent}>
                  <span className={styles.loadingDots}>●●●</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className={styles.chatInput}>
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your question..."
              disabled={isLoading}
              rows={2}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              className={styles.sendButton}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
