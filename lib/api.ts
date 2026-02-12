// API client for backend communication

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/fast';

const AUTH_TOKEN_KEY = 'traid_access_token';
const AUTH_USER_KEY = 'traid_user';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token === null) localStorage.removeItem(AUTH_TOKEN_KEY);
  else localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function getStoredUser(): UserInfo | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserInfo;
  } catch {
    return null;
  }
}

export function setStoredUser(user: UserInfo | null): void {
  if (typeof window === 'undefined') return;
  if (user === null) localStorage.removeItem(AUTH_USER_KEY);
  else localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function getAuthHeaders(): Record<string, string> {
  const token = getStoredToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export interface UserInfo {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  gender?: string | null;
  age?: number | null;
  role: string;
  organization?: string | null;
}

export interface AuthResponse {
  access_token: string;
  user: UserInfo;
}

export interface ChatRequest {
  user_id: number;
  username: string;
  user_message: string;
  chatsession_id?: string;
  request_id?: string;
  role: string;
  age: number;
  gender: string;
  first_name: string;
  last_name: string;
  organization: string;
  model_name?: string;
  temperature?: number;
}

/** Body for authenticated chat: session and request IDs required. */
export interface ProtectedChatRequest {
  user_message: string;
  chatsession_id: string;
  request_id: string;
  model_name?: string;
  temperature?: number;
}

export interface ChatResponse {
  response?: string;
  raw_response?: string;
  [key: string]: unknown;
}

export interface JournalEntry {
  id: number;
  title: string;
  content: string;
  emotion: string;
  timestamp: string;
}

export interface JournalCreate {
  user_id: number;
  title: string;
  content: string;
  emotion?: string;
}

export async function signup(body: {
  email: string;
  password: string;
  username: string;
  first_name: string;
  last_name: string;
  gender?: string;
  age?: number;
  role?: string;
  organization?: string;
}): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail ?? 'Signup failed');
  }
  return response.json();
}

export async function login(body: { email: string; password: string }): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail ?? 'Login failed');
  }
  return response.json();
}

export interface ChatSessionItem {
  id: string;
  created_at: string | null;
  preview: string;
}

export async function getChatSessions(): Promise<{ sessions: ChatSessionItem[] }> {
  const response = await fetch(`${API_BASE_URL}/api/chat/sessions`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized');
    throw new Error('Failed to fetch sessions');
  }
  return response.json();
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/chat/sessions/${encodeURIComponent(sessionId)}`,
    { method: 'DELETE', headers: getAuthHeaders() }
  );
  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized');
    if (response.status === 404) throw new Error('Session not found');
    throw new Error('Failed to delete session');
  }
}

export async function getSessionMessages(sessionId: string): Promise<{ messages: { role: string; content: string }[] }> {
  const response = await fetch(`${API_BASE_URL}/api/chat/sessions/${encodeURIComponent(sessionId)}/messages`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized');
    if (response.status === 404) throw new Error('Session not found');
    throw new Error('Failed to fetch messages');
  }
  return response.json();
}

export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    let errorMessage = `Chat request failed: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorMessage = errorData.detail;
      }
    } catch {
      // If response is not JSON, use the status text
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export interface SendChatMessageStreamOptions {
  /** Pass to cancel the request (e.g. user clicks Stop). */
  signal?: AbortSignal;
}

/**
 * Send a chat message and stream the plain-text response body chunk by chunk.
 * Uses authenticated ProtectedChatRequest (chatsession_id and request_id required).
 */
export async function sendChatMessageStream(
  request: ProtectedChatRequest,
  onChunk: (chunk: string) => void,
  options?: SendChatMessageStreamOptions
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
    signal: options?.signal,
  });

  if (!response.ok) {
    let errorMessage = `Chat request failed: ${response.statusText}`;
    try {
      const contentType = response.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string'
            ? errorData.detail
            : JSON.stringify(errorData.detail);
        }
      } else {
        const text = await response.text();
        if (text) errorMessage = text;
      }
    } catch {
      // Use default errorMessage if reading body fails
    }
    throw new Error(errorMessage);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Response body is not a stream');
  }

  const decoder = new TextDecoder();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const decoded = decoder.decode(value, { stream: true });
      if (decoded) onChunk(decoded);
    }
    // Decode any remaining bytes (e.g. trailing multi-byte character)
    const remainder = decoder.decode();
    if (remainder) onChunk(remainder);
  } finally {
    reader.releaseLock();
  }
}

export async function createJournalEntry(entry: JournalCreate): Promise<JournalEntry> {
  const response = await fetch(`${API_BASE_URL}/api/journal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(entry),
  });

  if (!response.ok) {
    throw new Error(`Journal creation failed: ${response.statusText}`);
  }

  return response.json();
}

export async function getJournalEntries(userId: number): Promise<JournalEntry[]> {
  const response = await fetch(`${API_BASE_URL}/api/journal/${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch journal entries: ${response.statusText}`);
  }

  return response.json();
}

export async function healthCheck(): Promise<{ status: string }> {
  const response = await fetch(`${API_BASE_URL}/health`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Health check failed: ${response.statusText}`);
  }

  return response.json();
}

