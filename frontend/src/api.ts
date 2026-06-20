export const API_URL = 'http://localhost:8000';

export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('reflect_token');
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Handle unauthorized
    localStorage.removeItem('reflect_token');
    window.location.href = '/auth';
  }

  return response;
};

export const fetchCurrentUser = async () => {
  const res = await fetchWithAuth('/users/me/');
  if (res.ok) return await res.json(); // { id, email }
  throw new Error('Failed to fetch user');
};

export const fetchSummaries = async () => {
  const res = await fetchWithAuth('/summaries/');
  if (res.ok) {
    return await res.json();
  }
  throw new Error('Failed to fetch summaries');
};

export const generateSummary = async (periodStart: string, periodEnd: string, type: 'weekly' | 'monthly') => {
  const res = await fetchWithAuth('/summaries/generate', {
    method: 'POST',
    body: JSON.stringify({
      period_start: periodStart,
      period_end: periodEnd,
      summary_type: type,
    }),
  });
  if (res.ok) {
    return await res.json();
  }
  const errorData = await res.json().catch(() => ({}));
  throw new Error(errorData.detail || 'Failed to generate summary');
};
export const runDiagnostic = async (entryId: string) => {
  const res = await fetchWithAuth(`/entries/${entryId}/diagnose`, { method: 'POST' })
  if (!res.ok) throw new Error('Diagnostic failed')
  return await res.json()
}

export const fetchDiagnostic = async (entryId: string) => {
  const res = await fetchWithAuth(`/entries/${entryId}/diagnose`)
  if (res.status === 404) return null // not yet run
  if (!res.ok) throw new Error('Could not load diagnostic')
  return await res.json()
}

export const fetchBooks = async () => {
  const res = await fetchWithAuth('/books/');
  if (res.ok) return await res.json();
  throw new Error('Failed to fetch books');
};

export const createBook = async (title: string, coverImageUrl?: string) => {
  const res = await fetchWithAuth('/books/', {
    method: 'POST',
    body: JSON.stringify({ title, cover_image_url: coverImageUrl }),
  });
  if (res.ok) return await res.json();
  throw new Error('Failed to create book');
};

export const updateBook = async (bookId: number, title: string, coverImageUrl?: string) => {
  const res = await fetchWithAuth(`/books/${bookId}`, {
    method: 'PUT',
    body: JSON.stringify({ title, cover_image_url: coverImageUrl }),
  });
  if (res.ok) return await res.json();
  throw new Error('Failed to update book');
};

export interface ContentBlockMark {
  type: string;
  start: number;
  end: number;
}

export interface ContentBlock {
  id: string;
  type: string;
  text: string;
  marks?: ContentBlockMark[];
  fontFamily?: string;
  fontSize?: number;
}
