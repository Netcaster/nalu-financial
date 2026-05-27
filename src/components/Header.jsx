import React, { useState, useEffect, useRef } from 'react';
import { searchCoinGecko } from '../lib/api.js';
import { STOCKS } from '../lib/constants.js';

const LogoIcon = () => (
  <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
    <polygon points="16,2 30,10 30,22 16,30 2,22 2,10" fill="none" stroke="#14bcbd" strokeWidth="2"/>
    <polygon points="16,8 24,13 24,21 16,26 8,21 8,13" fill="#14bcbd" opacity="0.25"/>
    <circle cx="16" cy="16" r="3.5" fill="#14bcbd"/>
  </svg>
);

export default function Header({ tab, onTabChange, theme, onThemeToggle, alertCount }) {
  const [clock, setClock] = useState('--:--:--');
  const [query, setQuery]   = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);
  const searchRef   = useRef(null);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const utc = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
      setClock(
        String(utc.getHours()).padStart(2,'0') + ':' +
        String(utc.getMinutes()).padStart(2,'0') + ':' +
        String(utc.getSeconds()).padStart(2,'0')
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setResults(null);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSearchInput(e) {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(debounceRef.current);
    if (q.length < 2) { setResults(null); return; }
    debounceRef.current = setTimeout(() => doSearch(q), 350);
  }

  async function doSearch(q) {
    setSearching(true);
    const ql = q.toLowerCase();
    const stockMatches = STOCKS.filter(s =>
      s.sym.toLowerCase().includes(ql) || s.name.toLowerCase().includes(ql)
    ).slice(0, 4);
    let cryptoMatches = [];
    try { cryptoMatches = await searchCoinGecko(q); } catch {}
    setResults({ stocks: stockMatches, crypto: cryptoMatches });
    setSearching(false);
  }

  function pickStock(s) {
    onTabChange('stocks');
    setQuery(''); setResults(null);
  }

  function pickCoin(c) {
    onTabChange('crypto');
    setQuery(''); setResults(null);
  }

  const TABS = [
    { id:'crypto',   label:'Crypto',    icon:'₿'  },
    { id:'stocks',   label:'Stocks',    icon:'📈' },
    { id:'defai',    label:'DeFAI',     icon:'🤖', badge:'AI' },
    { id:'research', label:'Research',  icon:'🧠' },
  ];

  return (
    <header className="main-header">
      <div className="header-left">
        <div className="logo">
          <LogoIcon />
          <span className="logo-text">Nalu<span className="logo-pro"> Intelligence</span></span>
        </div>
        <nav className="main-nav">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`nav-tab${tab === t.id ? ' active' : ''}`}
              onClick={() => onTabChange(t.id)}
            >
              <span>{t.icon}</span> {t.label}
              {t.badge && <span className="tab-badge">{t.badge}</span>}
            </button>
          ))}
        </nav>
      </div>

      <div className="header-center">
        <div className="search-wrap" ref={searchRef}>
          <svg className="search-icon" width="14" height="14" viewBox="0 0 20 20" fill="none">
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M15 15l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            className="search-input"
            type="text"
            placeholder="Search coins, stocks, AI tokens..."
            value={query}
            onChange={handleSearchInput}
            autoComplete="off"
          />
          {results && (
            <div className="search-dropdown">
              {results.stocks.length > 0 && (
                <>
                  <div className="search-section-label">Stocks</div>
                  {results.stocks.map(s => (
                    <div key={s.sym} className="search-item" onClick={() => pickStock(s)}>
                      <span className="stock-badge" style={{fontSize:'9px',width:'28px',height:'22px',borderRadius:'4px'}}>{s.sym.slice(0,4)}</span>
                      <div>
                        <div className="si-name">{s.name}</div>
                        <div className="si-sym">{s.sym} · {s.sector}</div>
                      </div>
                      <span className="si-rank" style={{color:'var(--blue)',fontSize:'10px'}}>Stock</span>
                    </div>
                  ))}
                </>
              )}
              {results.crypto.length > 0 && (
                <>
                  <div className="search-section-label">Crypto</div>
                  {results.crypto.map(c => (
                    <div key={c.id} className="search-item" onClick={() => pickCoin(c)}>
                      {c.thumb
                        ? <img src={c.thumb} alt="" style={{width:22,height:22,borderRadius:'50%'}} />
                        : <div style={{width:22,height:22,borderRadius:'50%',background:'var(--card2)'}} />
                      }
                      <div>
                        <div className="si-name">{c.name}</div>
                        <div className="si-sym">{c.symbol?.toUpperCase()}</div>
                      </div>
                      <span className="si-rank">#{c.market_cap_rank || '?'}</span>
                    </div>
                  ))}
                </>
              )}
              {!searching && results.stocks.length === 0 && results.crypto.length === 0 && (
                <div style={{padding:'16px',textAlign:'center',color:'var(--txt3)',fontSize:'12px'}}>No results found</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="header-right">
        <div className="clock-wrap">
          <span className="clock-dot" />
          <span style={{fontFamily:'monospace',fontSize:'12px'}}>{clock}</span>
          <span className="clock-tz">UTC</span>
        </div>

        <div className="ws-indicator">
          <span className="ws-dot" />
          <span style={{fontSize:'11px',color:'var(--txt2)'}}>Live</span>
        </div>

        <button className="icon-btn" onClick={onThemeToggle} title="Toggle Day/Night">
          {theme === 'dark' ? (
            <svg viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5"/>
              <line x1="12" y1="2" x2="12" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="12" y1="20" x2="12" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="2" y1="12" x2="4" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="20" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
