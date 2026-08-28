const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const friendlyNetworkError = (error) => {
  const raw = String(error?.message || error);
  if (raw.includes('Failed to fetch') || raw.includes('NetworkError') || raw.includes('fetch failed')) {
    return `Could not reach the backend at ${API_BASE_URL}. Make sure it's running (cd backend && npm run dev).`;
  }
  return raw;
};

export const checkBackendHealth = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`);
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data.ready);
  } catch {
    return false;
  }
};

export const analyzeResume = async (resumeText, jobDescription) => {
  let res;
  try {
    res = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeText, jobDescription }),
    });
  } catch (error) {
    throw new Error(friendlyNetworkError(error));
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error('Backend returned an invalid response.');
  }

  if (!res.ok) {
    throw new Error(data.error || 'Failed to analyze resume.');
  }

  return data;
};
