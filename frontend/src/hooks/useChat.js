/**
 * useChat — manages chat messages, loading state,
 * and communication with the chat API.
 */

import { useState, useCallback, useRef } from 'react';
import { chatAPI } from '../lib/api';

export default function useChat(topicId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  /**
   * Load chat history for the topic
   */
  const loadHistory = useCallback(async () => {
    if (!topicId) return;
    setHistoryLoading(true);
    try {
      const data = await chatAPI.getHistory(topicId);
      if (data && Array.isArray(data.messages)) {
        setMessages(data.messages);
      } else if (Array.isArray(data)) {
        setMessages(data);
      }
    } catch {
      // No history yet — that's okay, start fresh
      setMessages([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [topicId]);

  /**
   * Send a message and append both user + assistant messages
   */
  const sendMessage = useCallback(async (text, subTopicId = null) => {
    if (!text.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };

    // Optimistically add user message
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setError(null);

    try {
      const response = await chatAPI.sendMessage(topicId, text.trim(), subTopicId);

      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.message || response.content || '',
        timestamp: new Date().toISOString(),
        suggested_followups: response.suggested_followups || [],
        related_sub_topics: response.related_sub_topics || [],
        jargon_terms: response.jargon_terms || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
      return assistantMessage;
    } catch (err) {
      setError(err.message || 'Message failed to send.');
      // Add a friendly error message in chat
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: 'Oops, something broke on my end 😅 Try again?',
          timestamp: new Date().toISOString(),
          suggested_followups: [],
          related_sub_topics: [],
          jargon_terms: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [topicId, loading]);

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    loading,
    historyLoading,
    error,
    loadHistory,
    sendMessage,
    clearMessages,
  };
}
