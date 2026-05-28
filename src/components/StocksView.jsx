import React, { useState, useEffect, useCallback } from 'react';
import TVChart from './TVChart.jsx';
import { fetchNews, fetchStockQuotes } from '../lib/api.js';
import { fmt, fmtCompact, fmtPct, pctClass, timeAgo } from '../lib/utils.js';
import { STOCKS, STOCK_PRICES, STOCK_CHANGES, SECTORS, ECON_EVENTS } from '../lib/constants.js';

/* ── symbols to request from Yahoo Finance ──────────────────────── */
const STOCK_SYMS  = STOCKS.map(s => s.sym);
const INDEX_SYMS  = ['^GSPC', '^NDX', '^DJI', '^VIX', 'GC=F', 'CL=F', 'DX-Y.NYB', '^TNX'];
const ALL_SYMS    = [...STOCK_SYMS, ...INDEX_SYMS];

const IDX_META = [
  { sym:'^GSPC',   name:'S&P 500',    fmt: v => v.toLocaleString('en-US', { maximumFractionDigits:0 }) },
  { sym:'^NDX',    name:'NASDAQ 100', fmt: v => v.toLocaleString('en-US', { maximumFractionDigits:0 }) },
  { sym:'^DJI',    name:'Dow Jones',  fmt: v => v.toLocaleString('en-US', { maximumFractionDigits:0 }) },
  { sym:'^VIX',    name:'VIX',        fmt: v => v.toFixed(2) },
  { sym:'GC=F',    name:'Gold',       fmt: v => v.toLocaleString('en-US', { maximumFractionDigits:0 }) },
  { sym:'CL=F',    name:'Crude Oil',  fmt: v => v.toFixed(2) },
  { sym:'DX-Y.NYB',name:'USD Index',  fmt: v => v.toFixed(2) },
  { sym:'^TNX',    name:'10Y Yield',  fmt: v => v.toFixed(2) + '%' },
];

/* ── sub-components ─────────────────────────────────────────────── */

function IndicesBar({ idxQuotes }) {
  const now  = new Date();
  const utcH = now.getUTCHours();
  const open = utcH >= 14 && utcH < 21;

  return (
    <div className="indices-bar">
      {IDX_META.map(m => {
        const q   = idxQuotes[m.sym];
        const val = q ? m.fmt(q.regularMarketPrice) : '—';
        const chg = q ? q.regularMarketChangePercent : 0;
        return (
          <div key={m.sym} className="idx-chip">
            <span className="idx-name">{m.name}</span>
            <span className="idx-val">{val}</span>
            {q
              ? <span className={`idx-chg ${pctClass(chg)}`}>{fmtPct(chg)}</span>
              : <span className="idx-chg" style={{ color:'var(--txt3)' }}>—</span>
            }
          </div>
        );
      })}
      <div className="ms-wrap" style={{ marginLeft:'auto' }}>
        <span className={`ms-dot ${open ? 'open' : 'closed'}`} />
        <span style={{ fontSize:11, color:'var(--txt2)' }}>{open ? 'NYSE/NASDAQ Open' : 'Market Closed'}</span>
      </div>
    </div>
  );
}

function StockWatchlist({ stocks, selected, onSelect, prices, changes }) {
  return (
    <div className="watchlist-list">
      {stocks.map(s => {
        const p   = prices[s.sym]  ?? STOCK_PRICES[s.sym]  ?? 0;
        const chg = changes[s.sym] ?? STOCK_CHANGES[s.sym] ?? 0;
        return (
          <div key={s.sym} className={`wl-item${s === selected ? ' active' : ''}`} onClick={() => onSelect(s)}>
            <div className="wl-left">
              <span className="stock-badge" style={{ width:30, height:24, fontSize:9, borderRadius:4 }}>{s.sym.slice(0,4)}</span>
              <div>
                <div className="wl-sym">{s.sym}</div>
                <div className="wl-name">{s.sector}</div>
              </div>
            </div>
            <div className="wl-right">
              <div className="wl-price">${fmt(p, 2)}</div>
              <div className={`wl-chg ${pctClass(chg)}`}>{fmtPct(chg)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StockMovers({ stocks, onSelect, prices, changes }) {
  const [tab, setTab] = useState('gainers');
  const sorted = [...stocks].sort((a, b) => {
    const ca = changes[a.sym] ?? STOCK_CHANGES[a.sym] ?? 0;
    const cb = changes[b.sym] ?? STOCK_CHANGES[b.sym] ?? 0;
    return tab === 'gainers' ? cb - ca : tab === 'losers' ? ca - cb : 0;
  });
  const list = sorted.slice(0, 6);
  return (
    <div className="panel-section">
      <div className="stab-bar">
        {['gainers','losers','volume'].map(t => (
          <button key={t} className={`stab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <div className="mover-list">
        {list.map(s => {
          const chg = changes[s.sym] ?? STOCK_CHANGES[s.sym] ?? 0;
          const p   = prices[s.sym]  ?? STOCK_PRICES[s.sym]  ?? 0;
          return (
            <div key={s.sym} className="mover-item" onClick={() => onSelect(s)}>
              <div className="mv-left">
                <span className="stock-badge" style={{ width:28, height:24, fontSize:8, borderRadius:4 }}>{s.sym.slice(0,4)}</span>
                <div>
                  <div className="mv-sym">{s.sym}</div>
                  <div className="mv-price">${fmt(p, 2)}</div>
                </div>
              </div>
              <div className={`mv-chg ${pctClass(chg)}`}>{fmtPct(chg)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StockHeader({ stock, prices, changes, quotesMap }) {
  const price  = prices[stock.sym]  ?? STOCK_PRICES[stock.sym]  ?? 0;
  const chg    = changes[stock.sym] ?? STOCK_CHANGES[stock.sym] ?? 0;
  const chgAbs = price * (chg / 100);
  const rsi    = 45 + Math.random() * 20;
  const rsiSig = rsi > 65 ? 'Overbought' : rsi < 35 ? 'Oversold' : 'Neutral';

  // live quote fields with static fallbacks
  const q = quotesMap?.[stock.sym];
  const high52 = q?.fiftyTwoWeekHigh   ? '$' + fmt(q.fiftyTwoWeekHigh, 2)   : '$' + stock.high52;
  const low52  = q?.fiftyTwoWeekLow    ? '$' + fmt(q.fiftyTwoWeekLow,  2)   : '$' + stock.low52;
  const mcap   = q?.marketCap          ? fmtCompact(q.marketCap)            : stock.mcap;
  const pe     = q?.trailingPE         ? fmt(q.trailingPE, 1)               : (stock.pe || '—');
  const eps    = q?.epsTrailingTwelveMonths != null ? '$' + fmt(q.epsTrailingTwelveMonths, 2) : '$' + stock.eps;
  const beta   = q?.beta               ? fmt(q.beta, 2)                     : stock.beta;
  const divYld = q?.trailingAnnualDividendYield != null
    ? (q.trailingAnnualDividendYield * 100).toFixed(2) + '%'
    : stock.div;
  const vol    = q?.averageDailyVolume3Month
    ? fmtCompact(q.averageDailyVolume3Month)
    : stock.avgvol;
  const isLive = !!q;

  return (
    <>
      <div className="coin-hdr">
        <div className="coin-id">
          <span className="stock-badge" style={{ fontSize:14, padding:'6px 10px' }}>{stock.sym}</span>
          <div>
            <div className="coin-name-txt">{stock.name}</div>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span className="coin-pair">{stock.tv.split(':')[0]} · {stock.sector}</span>
              {isLive && <span style={{ fontSize:9, background:'rgba(0,211,149,0.12)', color:'var(--green)', borderRadius:6, padding:'1px 6px', fontWeight:600 }}>● LIVE</span>}
            </div>
          </div>
          <div className="price-block">
            <div className="big-price">${fmt(price, 2)}</div>
            <div className={`price-chg ${pctClass(chg)}`}>
              {chgAbs >= 0 ? '+' : '-'}${fmt(Math.abs(chgAbs), 2)} ({fmtPct(chg)})
            </div>
          </div>
        </div>
        <div className="coin-metrics">
          {[
            ['52w High', high52],
            ['52w Low',  low52],
            ['Avg Vol',  vol],
            ['Mkt Cap',  mcap],
            ['P/E',      pe],
            ['EPS',      eps],
            ['Beta',     beta],
            ['Dividend', divYld],
          ].map(([k, v]) => (
            <div key={k} className="cm"><span>{k}</span><b>{v}</b></div>
          ))}
        </div>
      </div>
      <div className="ta-bar">
        <div className="ta-item">
          <span className="ta-label">RSI (14)</span>
          <span className="ta-val">{rsi.toFixed(1)}</span>
          <span className={`ta-signal ${rsi > 65 ? 'sell' : rsi < 35 ? 'buy' : 'neutral'}`}>{rsiSig}</span>
        </div>
        <div className="ta-sep" />
        <div className="ta-item"><span className="ta-label">Float</span><span className="ta-val">{stock.float}</span></div>
        <div className="ta-sep" />
        <div className="ta-item"><span className="ta-label">Short Int.</span><span className="ta-val">{stock.short}</span></div>
        <div className="ta-sep" />
        <div className="ta-item">
          <span className="ta-label">24h Chg</span>
          <span className={`ta-val ${pctClass(chg)}`}>{fmtPct(chg)}</span>
        </div>
      </div>
    </>
  );
}

function SectorPerf() {
  const max = Math.max(...SECTORS.map(s => Math.abs(s.chg)));
  return (
    <div className="panel-section">
      <div className="panel-hdr"><span>Sector Performance</span></div>
      <div className="sector-list">
        {SECTORS.map(s => (
          <div key={s.name} className="sector-row">
            <span className="sector-name">{s.name}</span>
            <div className="sector-bar-wrap">
              <div className={`sector-bar ${s.chg >= 0 ? 'pos' : 'neg'}`} style={{ width:(Math.abs(s.chg)/max*100)+'%' }} />
            </div>
            <span className={`sector-pct ${pctClass(s.chg)}`}>{fmtPct(s.chg)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EconCalendar() {
  return (
    <div className="panel-section">
      <div className="panel-hdr"><span>Economic Calendar</span></div>
      <div className="econ-list">
        {ECON_EVENTS.map(e => (
          <div key={e.event} className="econ-item">
            <span className="econ-time">{e.time}</span>
            <span className="econ-event">{e.event}</span>
            <span className={`econ-impact ${e.impact}`}>{e.impact.toUpperCase()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function OptionsFlow() {
  const pcr = (0.7 + Math.random() * 0.6).toFixed(2);
  const iv  = (15  + Math.random() * 35).toFixed(1);
  const unusual = Math.random() > 0.5 ? 'Bullish Calls' : 'Unusual Puts';
  return (
    <div className="panel-section">
      <div className="panel-hdr"><span>Options Flow</span></div>
      <div className="options-info">
        <div className="opt-row"><span>Put/Call Ratio</span><b className={parseFloat(pcr) < 1 ? 'green' : 'red'}>{pcr}</b></div>
        <div className="opt-row"><span>Implied Volatility</span><b>{iv}%</b></div>
        <div className="opt-row"><span>Unusual Activity</span><b className="green">{unusual}</b></div>
      </div>
    </div>
  );
}

function TopStocksTable({ stocks, onSelect, prices, changes }) {
  return (
    <div className="bottom-row">
      <div className="bottom-card" style={{ flex:1 }}>
        <div className="bc-hdr"><h3>Top Stocks & ETFs</h3></div>
        <div className="tbl-wrap">
          <table className="mkt-tbl">
            <thead>
              <tr><th>Symbol</th><th>Company</th><th>Price</th><th>Change</th><th>% Change</th><th>Mkt Cap</th><th>P/E</th><th>Sector</th></tr>
            </thead>
            <tbody>
              {stocks.map(s => {
                const price  = prices[s.sym]  ?? STOCK_PRICES[s.sym]  ?? 0;
                const chgPct = changes[s.sym] ?? STOCK_CHANGES[s.sym] ?? 0;
                const chgAbs = price * (chgPct / 100);
                return (
                  <tr key={s.sym} onClick={() => onSelect(s)} style={{ cursor:'pointer' }}>
                    <td><b>{s.sym}</b></td>
                    <td>{s.name}</td>
                    <td className="mono">${fmt(price, 2)}</td>
                    <td className={pctClass(chgAbs)}>{chgAbs >= 0 ? '+' : '-'}${fmt(Math.abs(chgAbs), 2)}</td>
                    <td className={pctClass(chgPct)}>{fmtPct(chgPct)}</td>
                    <td className="mono">{s.mcap}</td>
                    <td className="mono">{s.pe || '—'}</td>
                    <td style={{ color:'var(--txt3)' }}>{s.sector}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StockNews({ posts, loading, onRefresh }) {
  return (
    <div className="news-section">
      <div className="ns-hdr">
        <h3>Market & Stock News</h3>
        <button className="text-btn" onClick={onRefresh}>↻ Refresh</button>
      </div>
      <div className="news-grid">
        {loading
          ? Array(6).fill(0).map((_, i) => <div key={i} className="news-skeleton"><div className="skeleton-pulse" /></div>)
          : posts.slice(0, 12).map((p, i) => {
              const preview = p.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, '&');
              const url = p.url?.startsWith('http') ? p.url : `https://reddit.com${p.permalink}`;
              return (
                <a key={i} className="news-card" href={url} target="_blank" rel="noopener">
                  {preview
                    ? <img className="news-img" src={preview} alt="" loading="lazy" onError={e => e.target.style.display='none'} />
                    : <div className="news-img-placeholder">📈</div>
                  }
                  <div className="news-body">
                    <div className="news-source">
                      <span className="news-src">r/{p.subreddit}</span>
                      <span className="news-date">{timeAgo(p.created_utc)}</span>
                    </div>
                    <div className="news-title">{p.title}</div>
                    <div style={{ fontSize:10, color:'var(--txt3)', marginTop:4 }}>▲ {p.score} · 💬 {p.num_comments}</div>
                  </div>
                </a>
              );
            })
        }
      </div>
    </div>
  );
}

/* ── main view ──────────────────────────────────────────────────── */

export default function StocksView({ theme, onToast }) {
  const [selected,    setSelected]    = useState(STOCKS[0]);
  const [tvInterval,  setTvInterval]  = useState('D');
  const [news,        setNews]        = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [prices,      setPrices]      = useState({});
  const [changes,     setChanges]     = useState({});
  const [idxQuotes,   setIdxQuotes]   = useState({});
  const [quotesMap,   setQuotesMap]   = useState({});
  const [liveStatus,  setLiveStatus]  = useState('loading');

  const loadQuotes = useCallback(async () => {
    try {
      const quotes = await fetchStockQuotes(ALL_SYMS);
      const newPrices  = {};
      const newChanges = {};
      const newIdx     = {};
      const newQMap    = {};

      quotes.forEach(q => {
        const sym = q.symbol;
        if (STOCK_SYMS.includes(sym)) {
          newPrices[sym]  = q.regularMarketPrice;
          newChanges[sym] = q.regularMarketChangePercent;
          newQMap[sym]    = q;
        }
        if (INDEX_SYMS.includes(sym)) {
          newIdx[sym] = q;
        }
      });

      setPrices(newPrices);
      setChanges(newChanges);
      setIdxQuotes(newIdx);
      setQuotesMap(newQMap);
      setLiveStatus('live');
    } catch (err) {
      console.warn('Live stock quotes unavailable:', err.message);
      setLiveStatus('cached');
      if (onToast) onToast('Using cached stock prices — live feed unavailable', '📊');
    }
  }, [onToast]);

  useEffect(() => {
    loadQuotes();
    const id = setInterval(loadQuotes, 60000);
    return () => clearInterval(id);
  }, [loadQuotes]);

  useEffect(() => { loadNews(); }, []);

  async function loadNews() {
    setNewsLoading(true);
    try { setNews(await fetchNews('Trading')); } catch { setNews([]); }
    setNewsLoading(false);
  }

  const TF_LABELS = { '1':'1m','5':'5m','15':'15m','60':'1h','D':'1D','W':'1W','M':'1M','12M':'1Y' };

  return (
    <>
      <IndicesBar idxQuotes={idxQuotes} />

      {/* live indicator */}
      <div style={{ padding:'4px 16px', display:'flex', alignItems:'center', gap:6, borderBottom:'1px solid var(--border)', background:'var(--bg2)' }}>
        <span style={{
          width:7, height:7, borderRadius:'50%',
          background: liveStatus === 'live' ? 'var(--green)' : liveStatus === 'loading' ? 'var(--yellow)' : 'var(--red)',
          display:'inline-block',
        }} />
        <span style={{ fontSize:11, color:'var(--txt3)' }}>
          {liveStatus === 'live'    && 'Live prices via Yahoo Finance · refreshes every 60s'}
          {liveStatus === 'loading' && 'Loading live prices…'}
          {liveStatus === 'cached'  && 'Cached prices (live feed unavailable)'}
        </span>
      </div>

      <div className="dash-grid">
        <aside className="left-panel">
          <div className="panel-section">
            <div className="panel-hdr"><span>Stock Watchlist</span></div>
            <StockWatchlist stocks={STOCKS} selected={selected} onSelect={setSelected} prices={prices} changes={changes} />
          </div>
          <StockMovers stocks={STOCKS} onSelect={setSelected} prices={prices} changes={changes} />
        </aside>

        <main className="center-panel">
          <StockHeader stock={selected} prices={prices} changes={changes} quotesMap={quotesMap} />
          <div className="chart-ctrl-bar">
            <div className="tf-group">
              {Object.entries(TF_LABELS).map(([tf, label]) => (
                <button key={tf} className={`tf-btn${tvInterval === tf ? ' active' : ''}`} onClick={() => setTvInterval(tf)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <TVChart
            symbol={selected.tv}
            interval={tvInterval}
            theme={theme}
            timezone="America/New_York"
            studies={['RSI@tv-basicstudies','MACD@tv-basicstudies','Volume@tv-basicstudies']}
          />
        </main>

        <aside className="right-panel">
          <SectorPerf />
          <EconCalendar />
          <OptionsFlow />
        </aside>
      </div>

      <TopStocksTable stocks={STOCKS} onSelect={setSelected} prices={prices} changes={changes} />
      <StockNews posts={news} loading={newsLoading} onRefresh={loadNews} />
    </>
  );
}
