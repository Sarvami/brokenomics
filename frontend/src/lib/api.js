/**
 * API client for Brokenomics backend
 * Base URL: http://localhost:8000/api/v1
 * Handles auth token injection + error responses
 */

const API_BASE = 'http://localhost:8000/api/v1';

let authToken = null;

/**
 * Store JWT token in memory (not localStorage for security)
 */
export function setAuthToken(token) {
  authToken = token;
}

/**
 * Get current auth token
 */
export function getAuthToken() {
  return authToken;
}

/**
 * Clear auth token (logout)
 */
export function clearAuthToken() {
  authToken = null;
}

/**
 * Base fetch wrapper
 * Injects Authorization header if token exists
 * Handles JSON responses and errors
 */
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  const headers = {
    ...(options.headers || {}),
  };

  // Add auth token if available
  if (authToken && !options.skipAuth) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  // Add Content-Type for JSON body
  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    headers,
  };

  // Convert body to JSON string if it's an object (unless FormData)
  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);

    // Handle non-JSON responses (204 No Content, etc)
    if (response.status === 204) {
      return { success: true };
    }

    const data = await response.json();

    if (!response.ok) {
      throw {
        status: response.status,
        message: data.detail || data.message || 'Request failed',
        data,
      };
    }

    return data;
  } catch (error) {
    if (error.status) {
      // Already formatted error from above
      throw error;
    }
    // Network error or other
    throw {
      status: 0,
      message: error.message || 'Network error',
    };
  }
}

// ==============================
// AUTH API
// ==============================

export const authAPI = {
  /**
   * Register new user
   * POST /api/v1/auth/register
   */
  async register(email, password, firstName, lastName) {
    return apiFetch('/auth/register', {
      method: 'POST',
      body: { email, password, first_name: firstName, last_name: lastName },
      skipAuth: true,
    });
  },

  /**
   * Login user
   * POST /api/v1/auth/login
   * Uses application/x-www-form-urlencoded format
   */
  async login(email, password) {
    const formData = new URLSearchParams();
    formData.append('username', email); // OAuth2 spec uses 'username' field
    formData.append('password', password);

    return apiFetch('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
      skipAuth: true,
    });
  },

  /**
   * Create guest session
   * POST /api/v1/auth/guest-session
   */
  async createGuestSession() {
    return apiFetch('/auth/guest-session', {
      method: 'POST',
      skipAuth: true,
    });
  },

  /**
   * Get current user profile
   * GET /api/v1/auth/me
   */
  async getCurrentUser() {
    return apiFetch('/auth/me');
  },
};

// ==============================
// TOPICS API
// ==============================

export const topicsAPI = {
  /**
   * Get all topics
   * GET /api/v1/topics
   */
  async getAllTopics() {
    return apiFetch('/topics');
  },

  /**
   * Get specific topic by ID
   * GET /api/v1/topics/{topic_id}
   */
  async getTopic(topicId) {
    return apiFetch(`/topics/${topicId}`);
  },

  /**
   * Get journey for a topic
   * GET /api/v1/topics/{topic_id}/journey
   */
  async getJourney(topicId) {
    return apiFetch(`/topics/${topicId}/journey`);
  },
};

// ==============================
// QUIZ API
// ==============================

export const quizAPI = {
  /**
   * Get personalization questions
   * GET /api/v1/quiz/questions/{topic_id}
   */
  async getQuestions(topicId) {
    return apiFetch(`/quiz/questions/${topicId}`);
  },

  /**
   * Submit quiz answers
   * POST /api/v1/quiz/submit/{topic_id}
   */
  async submitAnswers(topicId, answers) {
    return apiFetch(`/quiz/submit/${topicId}`, {
      method: 'POST',
      body: { answers },
    });
  },
};

// ==============================
// CHAT API
// ==============================

export const chatAPI = {
  /**
   * Get chat history for a topic
   * GET /api/v1/chat/history/{topic_id}
   */
  async getHistory(topicId) {
    return apiFetch(`/chat/history/${topicId}`);
  },

  /**
   * Send a chat message
   * POST /api/v1/chat/message
   */
  async sendMessage(topicId, message, subTopicId = null) {
    return apiFetch('/chat/message', {
      method: 'POST',
      body: {
        topic_id: topicId,
        message,
        ...(subTopicId && { sub_topic_id: subTopicId }),
      },
    });
  },
};

// ==============================
// PROFILE API
// ==============================

export const profileAPI = {
  /**
   * Get saved items
   * GET /api/v1/profile/saved
   */
  async getSavedItems() {
    return apiFetch('/profile/saved');
  },

  /**
   * Save an item
   * POST /api/v1/profile/saved
   */
  async saveItem(type, itemId, content) {
    return apiFetch('/profile/saved', {
      method: 'POST',
      body: {
        type,
        item_id: itemId,
        content,
      },
    });
  },

  /**
   * Get user progress
   * GET /api/v1/profile/progress
   */
  async getProgress() {
    return apiFetch('/profile/progress');
  },
};

export default {
  auth: authAPI,
  topics: topicsAPI,
  quiz: quizAPI,
  chat: chatAPI,
  profile: profileAPI,
};
