const BASE_URL = process.env.REACT_APP_API_URL || '/expenses';

async function apiFetch(url, options = {}, retries = 3) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) {
      if (res.status >= 400 && res.status < 500) {
        const body = await res.json().catch(() => ({}));
        throw new ApiError(res.status, body.errors || body.error || 'Request failed');
      }
      throw new Error(`Server error: ${res.status}`);
    }
    return res.json();
  } catch (err) {
    clearTimeout(timeout);
    if (retries > 0 && !(err instanceof ApiError)) {
      await new Promise((r) => setTimeout(r, 500));
      return apiFetch(url, options, retries - 1);
    }
    throw err;
  }
}

export class ApiError extends Error {
  constructor(status, detail) {
    super(Array.isArray(detail) ? detail.map((e) => e.msg).join(', ') : detail);
    this.status = status;
  }
}

export async function getExpenses(params = {}) {
  const qs = new URLSearchParams();
  if (params.category) qs.set('category', params.category);
  if (params.sort) qs.set('sort', params.sort);
  const query = qs.toString() ? `?${qs}` : '';
  return apiFetch(`${BASE_URL}${query}`);
}

export async function createExpense(payload) {
  return apiFetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function getCategories() {
  return apiFetch(`${BASE_URL}/categories`);
}