import React, { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import HubView from './components/HubView.jsx';
import CryptoView from './components/CryptoView.jsx';
import StocksView from './components/StocksView.jsx';
import DeFAIView from './components/DeFAIView.jsx';
import RiskView from './components/RiskView.jsx';
import ResearchView from './components/ResearchView.jsx';

const TABS = ['hub', 'crypto', 'stocks', 'defai', 'research'];

export default function App() {
  const [tab, setTab] = useState('hub');
  const [theme, setTheme] = useState(() => localStorage.getItem('nalu_theme') || 'dark');
  const [toast, setToast] = useState(null);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
    localStorage.setItem('nalu_theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  }

  function showToast(msg, icon = '🔔') {
    setToast({ msg, icon });
    setTimeout(() => setToast(null), 5000);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--txt)' }}>
      <Header
        tab={tab}
        onTabChange={setTab}
        theme={theme}
        onThemeToggle={toggleTheme}
        alertCount={alertCount}
      />

      {tab === 'hub'      && <HubView      theme={theme} />}
      {tab === 'crypto'   && <CryptoView   theme={theme} onToast={showToast} onAlertCountChange={setAlertCount} />}
      {tab === 'stocks'   && <StocksView   theme={theme} onToast={showToast} />}
      {tab === 'defai'    && <DeFAIView    theme={theme} onToast={showToast} />}
      {tab === 'risk'     && <RiskView     theme={theme} onToast={showToast} />}
      {tab === 'research' && <ResearchView theme={theme} onToast={showToast} />}

      {toast && (
        <div className="toast">
          <span>{toast.icon}</span>
          <span className="toast-msg">{toast.msg}</span>
          <button className="toast-close" onClick={() => setToast(null)}>✕</button>
        </div>
      )}
    </div>
  );
}
