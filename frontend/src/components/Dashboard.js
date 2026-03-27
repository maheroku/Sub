import React, { useState, useEffect, useCallback } from 'react';
import { getSubscriptions, createSubscription, updateSubscription, deleteSubscription } from '../api/subscriptions';
import { createPortalSession } from '../api/billing';
import SubscriptionForm from './SubscriptionForm';
import SubscriptionList from './SubscriptionList';
import UpgradeModal from './UpgradeModal';

function Dashboard({ user, onLogout }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [summary, setSummary] = useState({ monthlyTotal: 0, yearlyTotal: 0, count: 0 });
  const [showForm, setShowForm] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');
  const [portalLoading, setPortalLoading] = useState(false);

  const fetchSubs = useCallback(async () => {
    try {
      const data = await getSubscriptions();
      if (data.success) {
        setSubscriptions(data.subscriptions);
        setSummary(data.summary);
      } else {
        setLoadError(data.error || 'Failed to load subscriptions');
      }
    } catch (err) {
      setLoadError('Network error');
    }
  }, []);

  useEffect(() => {
    fetchSubs();
  }, [fetchSubs]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgrade') === 'success') {
      setUpgradeMessage('You are now a Premium member! Enjoy unlimited subscriptions.');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('upgrade') === 'cancelled') {
      setUpgradeMessage('');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const upcoming = subscriptions.filter(s => {
    const d = new Date(s.nextRenewalDate);
    return d >= now && d <= in30Days;
  });

  const handleAdd = () => {
    setEditingSub(null);
    setFormError('');
    setShowForm(true);
  };

  const handleEdit = (sub) => {
    setEditingSub(sub);
    setFormError('');
    setShowForm(true);
  };

  const handleFormSubmit = async (formData) => {
    setFormLoading(true);
    setFormError('');
    try {
      let res;
      if (editingSub) {
        res = await updateSubscription(editingSub._id, formData);
      } else {
        res = await createSubscription(formData);
      }
      if (res.success) {
        setShowForm(false);
        setEditingSub(null);
        await fetchSubs();
      } else {
        setFormError(res.error || 'Failed to save subscription');
      }
    } catch (err) {
      setFormError('Network error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this subscription?')) return;
    try {
      const res = await deleteSubscription(id);
      if (res.success) {
        await fetchSubs();
      }
    } catch (err) {
      // silently fail
    }
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const data = await createPortalSession();
      if (data.success && data.url) {
        window.location.href = data.url;
      }
    } catch {
      // silently fail
    } finally {
      setPortalLoading(false);
    }
  };

  const fmt = (val) => `$${Number(val).toFixed(2)}`;

  const styles = {
    page: { minHeight: '100vh', background: '#f9fafb', fontFamily: 'sans-serif' },
    header: {
      background: '#fff',
      borderBottom: '1px solid #e5e7eb',
      padding: '14px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between'
    },
    headerTitle: { fontSize: 20, fontWeight: 700, color: '#1a1a2e', margin: 0 },
    headerRight: { display: 'flex', gap: 10, alignItems: 'center' },
    btnOutline: {
      padding: '7px 14px', background: 'none',
      border: '1px solid #d1d5db', borderRadius: 6,
      fontSize: 13, cursor: 'pointer', color: '#374151'
    },
    btnPremium: {
      padding: '7px 14px', background: '#f59e0b', color: '#fff',
      border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer'
    },
    main: { maxWidth: 1000, margin: '0 auto', padding: '28px 20px' },
    cards: { display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' },
    card: {
      flex: 1, minWidth: 160,
      background: '#fff', borderRadius: 8, padding: '18px 20px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.07)'
    },
    cardLabel: { fontSize: 12, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 },
    cardValue: { fontSize: 26, fontWeight: 700, color: '#1a1a2e' },
    sectionTitle: { fontSize: 16, fontWeight: 700, color: '#374151', margin: '0 0 12px' },
    upcomingBox: {
      background: '#fffbeb', border: '1px solid #fde68a',
      borderRadius: 8, padding: '14px 16px', marginBottom: 24
    },
    upcomingItem: { fontSize: 14, color: '#92400e', padding: '4px 0' },
    addBtn: {
      padding: '9px 18px', background: '#4f46e5', color: '#fff',
      border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600,
      cursor: 'pointer', marginBottom: 16
    },
    listBox: {
      background: '#fff', borderRadius: 8,
      padding: '20px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.07)'
    },
    errorBox: {
      background: '#fee2e2', border: '1px solid #fca5a5',
      color: '#b91c1c', borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: 13
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Laftel Sub</h1>
        <div style={styles.headerRight}>
          <span style={{ fontSize: 13, color: '#6b7280' }}>{user.email}</span>
          {user.isPremium ? (
            <button style={styles.btnOutline} onClick={handleManageBilling} disabled={portalLoading}>
              {portalLoading ? 'Loading...' : 'Manage Subscription'}
            </button>
          ) : (
            <button style={styles.btnPremium} onClick={() => setShowUpgrade(true)}>
              Upgrade to Premium
            </button>
          )}
          <button style={styles.btnOutline} onClick={onLogout}>Logout</button>
        </div>
      </div>

      <div style={styles.main}>
        {upgradeMessage && (
          <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', color: '#065f46', borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
            {upgradeMessage}
          </div>
        )}
        {loadError && <div style={styles.errorBox}>{loadError}</div>}

        <div style={styles.cards}>
          <div style={styles.card}>
            <div style={styles.cardLabel}>Monthly Total</div>
            <div style={styles.cardValue}>{fmt(summary.monthlyTotal)}</div>
          </div>
          <div style={styles.card}>
            <div style={styles.cardLabel}>Yearly Total</div>
            <div style={styles.cardValue}>{fmt(summary.yearlyTotal)}</div>
          </div>
          <div style={styles.card}>
            <div style={styles.cardLabel}>Active Subscriptions</div>
            <div style={styles.cardValue}>{summary.count}</div>
          </div>
        </div>

        {upcoming.length > 0 && (
          <div style={styles.upcomingBox}>
            <div style={{ ...styles.sectionTitle, color: '#92400e', marginBottom: 8 }}>
              Renewing in next 30 days
            </div>
            {upcoming.map(s => (
              <div key={s._id} style={styles.upcomingItem}>
                {s.name} — {new Date(s.nextRenewalDate).toLocaleDateString()} ({s.currency} {Number(s.cost).toFixed(2)})
              </div>
            ))}
          </div>
        )}

        <button style={styles.addBtn} onClick={handleAdd}>+ Add Subscription</button>

        <div style={styles.listBox}>
          <SubscriptionList
            subscriptions={subscriptions}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>

      {showForm && (
        <SubscriptionForm
          initial={editingSub}
          onSubmit={handleFormSubmit}
          onCancel={() => { setShowForm(false); setEditingSub(null); setFormError(''); }}
          loading={formLoading}
          error={formError}
        />
      )}

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </div>
  );
}

export default Dashboard;
