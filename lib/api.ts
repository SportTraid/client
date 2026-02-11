// API client for backend communication

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/fast';

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

export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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
 * Backend returns streaming plain text (no JSON). Do not use response.json().
 */
export async function sendChatMessageStream(
  request: ChatRequest,
  onChunk: (chunk: string) => void,
  options?: SendChatMessageStreamOptions
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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

