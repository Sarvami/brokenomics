/**
 * FloatingChat — chat panel for the Journey View.
 * Loads history, lets users send messages, shows followup chips.
 * Lives on the right side of JourneyView on desktop.
 */

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { PaperPlaneRight, X, Robot } from 'phosphor-react';
import ChatMessage from './ChatMessage';
import useChat from '../../hooks/useChat';

// Starter prompts so the chat doesn't look empty
const STARTER_PROMPTS = [
  "Explain this like I'm 18 🎓",
  "Give me a real example with Indian context 🇮🇳",
  "What's the biggest mistake beginners make?",
  "How do I start with just ₹500?",
];

export default function FloatingChat({ topic, subTopic, onClose }) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const {
    messages,
    loading,
    historyLoading,
    sendMessage,
    loadHistory,
  } = useChat(topic?.id);

  const accentColor = topic?.accentColor || '#C0392B';

  // Load chat history on mount
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || loading) return;
    setInputValue('');
    await sendMessage(text, subTopic?.id);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFollowupClick = (text) => {
    sendMessage(text, subTopic?.id);
  };

  const showStarters = messages.length === 0 && !historyLoading;

  return (
    <div
      className="flex flex-col h-full md:h-[calc(100vh-72px)] sticky top-[72px]"
      style={{ background: '#12121A' }}
    >
      {/* Chat header */}
      <div
        className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: `${accentColor}22`, border: `1px solid ${accentColor}44` }}
        >
          <Robot size={16} color={accentColor} weight="fill" />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-xs font-semibold text-white truncate"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Brokenomics AI
          </p>
          <p
            className="text-[10px] text-gray-500"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {topic?.name} {subTopic ? `· ${subTopic.title}` : ''}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors flex-shrink-0"
            aria-label="Close chat"
          >
            <X size={14} color="#6B7280" />
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 min-h-0">
        {/* Loading state */}
        {historyLoading && (
          <div className="flex items-center justify-center py-8">
            <div
              className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: `${accentColor} transparent transparent transparent` }}
            />
          </div>
        )}

        {/* Starter prompts */}
        {showStarters && !historyLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-3 py-4"
          >
            <div className="text-center mb-2">
              <Robot size={32} color={accentColor} weight="duotone" className="mx-auto mb-2" />
              <p
                className="text-sm text-white font-semibold"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Ask me anything about {topic?.name}
              </p>
              <p
                className="text-xs text-gray-500 mt-1"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                No judgment, no jargon — just real answers
              </p>
            </div>
            <div className="flex flex-col gap-2 mt-2">
              {STARTER_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleFollowupClick(prompt)}
                  className="text-left px-3.5 py-2.5 rounded-xl text-xs transition-all duration-200 hover:bg-white/08"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#9CA3AF',
                    fontFamily: "'Space Grotesk', sans-serif",
                    cursor: 'pointer',
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id || msg.timestamp}
            message={msg}
            onFollowupClick={handleFollowupClick}
            accentColor={accentColor}
          />
        ))}

        {/* Loading indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-start gap-2"
          >
            <div
              className="px-4 py-3 rounded-[18px_18px_18px_4px]"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.10)',
              }}
            >
              <div className="flex gap-1.5 items-center">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: accentColor }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div
        className="flex-shrink-0 p-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div
          className="flex items-end gap-2 rounded-2xl px-3 py-2"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.10)',
          }}
        >
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about this topic..."
            rows={1}
            className="flex-1 bg-transparent text-white text-sm resize-none outline-none leading-relaxed placeholder-gray-600"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              maxHeight: '100px',
              overflowY: 'auto',
            }}
            aria-label="Chat input"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || loading}
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 mb-0.5"
            style={{
              background: inputValue.trim() ? accentColor : 'rgba(255,255,255,0.06)',
              border: 'none',
              cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
              opacity: loading ? 0.5 : 1,
            }}
            aria-label="Send message"
          >
            <PaperPlaneRight size={16} color="#FFFFFF" weight="fill" />
          </button>
        </div>
        <p
          className="text-[10px] text-gray-700 text-center mt-1.5"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
