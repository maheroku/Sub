import React, { useState } from 'react';
import { createCheckoutSession } from '../api/billing';

const styles = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    background: '#fff', borderRadius: 12,
    padding: '32px 28px', width: '100%', maxWidth: 440,
    boxShadow: '0 8px 32px rgba(0,0,0,0.18)'
  },
  title: { fontSize: 22, fontWeight: 700, color: '#1a1a2e', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 24 },
  plans: { display: 'flex', gap: 12, marginBottom: 24 },
  plan: (selected) => ({
    flex: 1, border: selected ? '2px solid #4f46e5' : '2px solid #e5e7eb',
    borderRadius: 10, padding: '16px 14px', cursor: 'pointer',
    background: selected ? '#f5f3ff' : '#fff',
    transition: 'border-color 0.15s'
  }),
  planName: { fontSize: 15, fontWeight: 700, color: '#1a1a2e', marginBottom: 2 },
  planPrice: { fontSize: 22, fontWeight: 800, color: '#4f46e5' },
  planPer: { fontSize: 12, color: '#6b7280' },
  planBadge: {
    display: 'inline-block', marginTop: 6,
    background: '#fef3c7', color: '#92400e',
    fontSize: 11, fontWeight: 700,
    padding: '2px 7px', borderRadius: 20
  },
  features: { marginBottom: 24 },
  feature: { fontSize: 14, color: '#374151', padding: '4px 0', display: 'flex', gap: 8, alignItems: 'flex-start' },
  btnPrimary: {
    width: '100%', padding: '12px 0',
    background: '#4f46e5', color: '#fff',
    border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700,
    cursor: 'pointer', marginBottom: 10
  },
  btnCancel: {
    width: '100%', padding: '10px 0',
    background: 'none', color: '#6b7280',
    border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14,
    cursor: 'pointer'
  },
  errorBox: {
    background: '#fee2e2', border: '1px solid #fca5a5',
    color: '#b91c1c', borderRadius: 6, padding: '10px 14px', marginBottom: 14, fontSize: 13
  }
};

const FEATURES = [
  'Unlimited subscriptions',
  'Renewal email reminders (7 days before)',
  'Monthly spending report by email'
];

function UpgradeModal({ onClose }) {
  const [plan, setPlan] = useState('yearly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpgrade = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await createCheckoutSession(plan);
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to start checkout');
        setLoading(false);
      }
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.title}>Upgrade to Premium</div>
        <div style={styles.subtitle}>Unlock unlimited subscriptions and smart reminders.</div>

        <div style={styles.plans}>
          <div style={styles.plan(plan === 'monthly')} onClick={() => setPlan('monthly')}>
            <div style={styles.planName}>Monthly</div>
            <div style={styles.planPrice}>$2.99</div>
            <div style={styles.planPer}>per month</div>
          </div>
          <div style={styles.plan(plan === 'yearly')} onClick={() => setPlan('yearly')}>
            <div style={styles.planName}>Yearly</div>
            <div style={styles.planPrice}>$24.99</div>
            <div style={styles.planPer}>per year</div>
            <span style={styles.planBadge}>Save 30%</span>
          </div>
        </div>

        <div style={styles.features}>
          {FEATURES.map(f => (
            <div key={f} style={styles.feature}>
              <span style={{ color: '#4f46e5', fontWeight: 700 }}>✓</span>
              <span>{f}</span>
            </div>
          ))}
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <button style={styles.btnPrimary} onClick={handleUpgrade} disabled={loading}>
          {loading ? 'Redirecting to checkout...' : 'Continue to Checkout'}
        </button>
        <button style={styles.btnCancel} onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

export default UpgradeModal;
