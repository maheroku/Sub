const BASE = '/api/subscriptions';

function authHeaders() {
  const token = localStorage.getItem('sub_token');
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

export async function getSubscriptions() {
  const res = await fetch(BASE, { headers: authHeaders() });
  return res.json();
}

export async function createSubscription(data) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function updateSubscription(id, data) {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function deleteSubscription(id) {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  return res.json();
}
