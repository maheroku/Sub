import React, { useState } from 'react';
import { login, register } from '../api/auth';

function AuthPage({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const fn = mode === 'login' ? login : register;
      const data = await fn(email, password);

      if (!data.success) {
        setError(data.error || 'Something went wrong');
        return;
      }

      onLogin(data.user, data.token);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    page: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f5f5f5',
      fontFamily: 'sans-serif'
    },
    card: {
      background: '#fff',
      borderRadius: 8,
      padding: '40px 36px',
      width: 360,
      boxShadow: '0 2px 12px rgba(0,0,0,0.1)'
    },
    title: { margin: '0 0 24px', fontSize: 24, fontWeight: 700, color: '#1a1a2e' },
    tabs: { display: 'flex', marginBottom: 24, gap: 0 },
    tab: (active) => ({
      flex: 1,
      padding: '8px 0',
      border: 'none',
      borderBottom: active ? '2px solid #4f46e5' : '2px solid #e5e7eb',
      background: 'none',
      cursor: 'pointer',
      fontWeight: active ? 700 : 400,
      color: active ? '#4f46e5' : '#6b7280',
      fontSize: 15
    }),
    label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 },
    input: {
      width: '100%',
      padding: '9px 12px',
      border: '1px solid #d1d5db',
      borderRadius: 6,
      fontSize: 14,
      marginBottom: 16,
      boxSizing: 'border-box'
    },
    btn: {
      width: '100%',
      padding: '10px',
      background: '#4f46e5',
      color: '#fff',
      border: 'none',
      borderRadius: 6,
      fontSize: 15,
      fontWeight: 600,
      cursor: 'pointer',
      marginTop: 4
    },
    error: {
      background: '#fee2e2',
      border: '1px solid #fca5a5',
      color: '#b91c1c',
      borderRadius: 6,
      padding: '8px 12px',
      fontSize: 13,
      marginBottom: 16
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Laftel Sub</h1>
        <div style={styles.tabs}>
          <button style={styles.tab(mode === 'login')} onClick={() => { setMode('login'); setError(''); }}>
            Login
          </button>
          <button style={styles.tab(mode === 'register')} onClick={() => { setMode('register'); setError(''); }}>
            Register
          </button>
        </div>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={mode === 'register' ? '8+ chars, uppercase, number, special' : 'Your password'}
            required
          />
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AuthPage;
