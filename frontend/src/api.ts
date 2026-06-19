export const API_URL = 'http://localhost:8000';

export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('antigravity_token');
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
    localStorage.removeItem('antigravity_token');
    window.location.href = '/auth';
  }

  return response;
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
