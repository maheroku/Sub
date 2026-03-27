import React, { useState, useEffect } from 'react';

const BILLING_CYCLES = ['weekly', 'monthly', 'quarterly', 'yearly'];
const CATEGORIES = ['entertainment', 'productivity', 'health', 'finance', 'utilities', 'other'];

function SubscriptionForm({ initial, onSubmit, onCancel, loading, error }) {
  const [form, setForm] = useState({
    name: '',
    cost: '',
    billingCycle: 'monthly',
    nextRenewalDate: '',
    category: 'other',
    notes: '',
    currency: 'USD'
  });

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name || '',
        cost: initial.cost !== undefined ? initial.cost : '',
        billingCycle: initial.billingCycle || 'monthly',
        nextRenewalDate: initial.nextRenewalDate
          ? new Date(initial.nextRenewalDate).toISOString().split('T')[0]
          : '',
        category: initial.category || 'other',
        notes: initial.notes || '',
        currency: initial.currency || 'USD'
      });
    }
  }, [initial]);

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      cost: parseFloat(form.cost)
    });
  };

  const styles = {
    overlay: {
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000
    },
    modal: {
      background: '#fff',
      borderRadius: 8,
      padding: '32px 28px',
      width: 440,
      maxWidth: '95vw',
      maxHeight: '90vh',
      overflowY: 'auto',
      boxShadow: '0 4px 24px rgba(0,0,0,0.18)'
    },
    title: { margin: '0 0 20px', fontSize: 20, fontWeight: 700 },
    label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 },
    input: {
      width: '100%', padding: '8px 10px',
      border: '1px solid #d1d5db', borderRadius: 6,
      fontSize: 14, marginBottom: 14, boxSizing: 'border-box'
    },
    row: { display: 'flex', gap: 12 },
    actions: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 },
    btnPrimary: {
      padding: '9px 20px', background: '#4f46e5', color: '#fff',
      border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer'
    },
    btnCancel: {
      padding: '9px 20px', background: '#f3f4f6', color: '#374151',
      border: 'none', borderRadius: 6, fontSize: 14, cursor: 'pointer'
    },
    error: {
      background: '#fee2e2', border: '1px solid #fca5a5',
      color: '#b91c1c', borderRadius: 6, padding: '8px 12px',
      fontSize: 13, marginBottom: 14
    }
  };

  return (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div style={styles.modal}>
        <h2 style={styles.title}>{initial ? 'Edit Subscription' : 'Add Subscription'}</h2>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Name</label>
          <input style={styles.input} type="text" value={form.name} onChange={set('name')} required maxLength={100} placeholder="Netflix, Spotify, Gym..." />

          <div style={styles.row}>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>Cost</label>
              <input style={styles.input} type="number" min="0" step="0.01" value={form.cost} onChange={set('cost')} required placeholder="9.99" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>Currency</label>
              <input style={styles.input} type="text" value={form.currency} onChange={set('currency')} maxLength={3} placeholder="USD" />
            </div>
          </div>

          <label style={styles.label}>Billing Cycle</label>
          <select style={styles.input} value={form.billingCycle} onChange={set('billingCycle')}>
            {BILLING_CYCLES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>

          <label style={styles.label}>Next Renewal Date</label>
          <input style={styles.input} type="date" value={form.nextRenewalDate} onChange={set('nextRenewalDate')} required />

          <label style={styles.label}>Category</label>
          <select style={styles.input} value={form.category} onChange={set('category')}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>

          <label style={styles.label}>Notes (optional)</label>
          <textarea style={{ ...styles.input, resize: 'vertical', minHeight: 60 }} value={form.notes} onChange={set('notes')} maxLength={500} placeholder="Any notes..." />

          <div style={styles.actions}>
            <button type="button" style={styles.btnCancel} onClick={onCancel}>Cancel</button>
            <button type="submit" style={styles.btnPrimary} disabled={loading}>
              {loading ? 'Saving...' : initial ? 'Save Changes' : 'Add Subscription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SubscriptionForm;
