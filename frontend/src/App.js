import React, { useState } from 'react';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('sub_token'));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('sub_user');
    return stored ? JSON.parse(stored) : null;
  });

  const handleLogin = (userData, userToken) => {
    localStorage.setItem('sub_token', userToken);
    localStorage.setItem('sub_user', JSON.stringify(userData));
    setToken(userToken);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('sub_token');
    localStorage.removeItem('sub_user');
    setToken(null);
    setUser(null);
  };

  if (!token || !user) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return <Dashboard user={user} onLogout={handleLogout} />;
}

export default App;
