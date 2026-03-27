import React from 'react';

function SubscriptionList({ subscriptions, onEdit, onDelete }) {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const fmt = (val) => `$${Number(val).toFixed(2)}`;
  const fmtDate = (d) => new Date(d).toLocaleDateString();

  const isUrgent = (dateStr) => {
    const d = new Date(dateStr);
    return d >= now && d <= in7Days;
  };

  const styles = {
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
    th: {
      textAlign: 'left', padding: '10px 12px',
      borderBottom: '2px solid #e5e7eb', color: '#6b7280',
      fontWeight: 600, fontSize: 12, textTransform: 'uppercase'
    },
    td: (urgent) => ({
      padding: '10px 12px',
      borderBottom: '1px solid #f3f4f6',
      background: urgent ? '#fef9c3' : 'transparent',
      verticalAlign: 'middle'
    }),
    badge: (cat) => ({
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 12,
      fontSize: 11,
      fontWeight: 600,
      background: '#e0e7ff',
      color: '#3730a3'
    }),
    actionBtn: (color) => ({
      background: 'none', border: 'none', cursor: 'pointer',
      color: color, fontSize: 16, padding: '2px 6px'
    }),
    empty: {
      textAlign: 'center', padding: '40px 0', color: '#9ca3af', fontSize: 15
    }
  };

  if (!subscriptions || subscriptions.length === 0) {
    return <div style={styles.empty}>No subscriptions yet. Add one to get started.</div>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>Cost</th>
            <th style={styles.th}>Cycle</th>
            <th style={styles.th}>Monthly</th>
            <th style={styles.th}>Renews</th>
            <th style={styles.th}>Category</th>
            <th style={styles.th}></th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.map(sub => {
            const urgent = isUrgent(sub.nextRenewalDate);
            return (
              <tr key={sub._id}>
                <td style={styles.td(urgent)}>
                  <strong>{sub.name}</strong>
                  {urgent && <span style={{ marginLeft: 6, fontSize: 11, color: '#b45309' }}>Renewing soon</span>}
                </td>
                <td style={styles.td(urgent)}>{fmt(sub.cost)} {sub.currency}</td>
                <td style={styles.td(urgent)}>{sub.billingCycle}</td>
                <td style={styles.td(urgent)}>{fmt(sub.monthlyCost)}</td>
                <td style={styles.td(urgent)}>{fmtDate(sub.nextRenewalDate)}</td>
                <td style={styles.td(urgent)}>
                  <span style={styles.badge(sub.category)}>{sub.category}</span>
                </td>
                <td style={styles.td(urgent)}>
                  <button style={styles.actionBtn('#4f46e5')} onClick={() => onEdit(sub)} title="Edit">✎</button>
                  <button style={styles.actionBtn('#dc2626')} onClick={() => onDelete(sub._id)} title="Delete">✕</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default SubscriptionList;
