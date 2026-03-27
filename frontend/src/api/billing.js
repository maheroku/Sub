const BASE = '/api/billing';

function authHeaders() {
  const token = localStorage.getItem('sub_token');
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

export async function createCheckoutSession(plan) {
  const res = await fetch(`${BASE}/create-checkout-session`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ plan })
  });
  return res.json();
}

export async function createPortalSession() {
  const res = await fetch(`${BASE}/portal`, {
    method: 'POST',
    headers: authHeaders()
  });
  return res.json();
}
