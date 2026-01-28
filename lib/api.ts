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
  [key: string]: any;
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

export async function sendChatMessageStream(
  request: ChatRequest,
  onChunk: (chunk: string) => void
): Promise<void> {
  // Note: Backend doesn't currently expose streaming, but this structure allows for future implementation
  const response = await sendChatMessage(request);
  if (response.response) {
    // Simulate streaming by chunking the response
    const chunks = response.response.split(' ');
    for (const chunk of chunks) {
      onChunk(chunk + ' ');
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  } else if (response.raw_response) {
    const chunks = response.raw_response.split(' ');
    for (const chunk of chunks) {
      onChunk(chunk + ' ');
      await new Promise(resolve => setTimeout(resolve, 50));
    }
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

