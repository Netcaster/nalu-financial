import React, { useState, useEffect } from 'react';
import TVChart from './TVChart.jsx';
import { fetchNews } from '../lib/api.js';
import { fmt, fmtCompact, fmtPct, pctClass, timeAgo } from '../lib/utils.js';
import { STOCKS, STOCK_PRICES, STOCK_CHANGES, SECTORS, ECON_EVENTS } from '../lib/constants.js';

function IndicesBar() {
  const indices = [
    { name:'S&P 500',     val:'5,820', chg:+0.34 },
    { name:'NASDAQ 100',  val:'20,340',chg:+0.52 },
    { name:'Dow Jones',   val:'43,280',chg:+0.18 },
    { name:'VIX',         val:'16.82', chg:-0.40 },
    { name:'Gold',        val:'2,485', chg:+0.22 },
    { name:'Crude Oil',   val:'78.45', chg:-0.15 },
    { name:'USD Index',   val:'104.2', chg:+0.08 },
    { name:'10Y Yield',   val:'4.42%', chg:+0.02 },
  ];
  const now = new Date();
  const utcH = now.getUTCHours();
  const open = utcH >= 14 && utcH < 21;
  return (
    <div className="indices-bar">
      {indices.map(idx => (
        <div key={idx.name} className="idx-chip">
          <span className="idx-name">{idx.name}</span>
          <span className="idx-val">{idx.val}</span>
          <span className={`idx-chg ${pctClass(idx.chg)}`}>{fmtPct(idx.chg)}</span>
        </div>
      ))}
      <div className="ms-wrap" style={{ marginLeft: 'auto' }}>
        <span className={`ms-dot ${open ? 'open' : 'closed'}`} />
        <span style={{ fontSize: 11, color: 'var(--txt2)' }}>{open ? 'NYSE/NASDAQ Open' : 'Market Closed'}</span>
      </div>
    </div>
  );
}

function StockWatchlist({ stocks, selected, onSelect }) {
  return (
    <div className="watchlist-list">
      {stocks.map(s => {
        const p   = STOCK_PRICES[s.sym] || 0;
        const chg = STOCK_CHANGES[s.sym] || 0;
        return (
          <div key={s.sym} className={`wl-item${s === selected ? ' active' : ''}`} onClick={() => onSelect(s)}>
            <div className="wl-left">
              <span className="stock-badge" style={{ width: 30, height: 24, fontSize: 9, borderRadius: 4 }}>{s.sym.slice(0, 4)}</span>
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

function StockMovers({ stocks, onSelect }) {
  const [tab, setTab] = useState('gainers');
  const gainers = [...stocks].sort((a, b) => (STOCK_CHANGES[b.sym] || 0) - (STOCK_CHANGES[a.sym] || 0)).slice(0, 6);
  const losers  = [...stocks].sort((a, b) => (STOCK_CHANGES[a.sym] || 0) - (STOCK_CHANGES[b.sym] || 0)).slice(0, 6);
  const byVol   = stocks.slice(0, 6);
  const list = tab === 'gainers' ? gainers : tab === 'losers' ? losers : byVol;
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
          const chg = STOCK_CHANGES[s.sym] || 0;
          return (
            <div key={s.sym} className="mover-item" onClick={() => onSelect(s)}>
              <div className="mv-left">
                <span className="stock-badge" style={{ width: 28, height: 24, fontSize: 8, borderRadius: 4 }}>{s.sym.slice(0, 4)}</span>
                <div>
                  <div className="mv-sym">{s.sym}</div>
                  <div className="mv-price">${fmt(STOCK_PRICES[s.sym] || 0, 2)}</div>
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

function StockHeader({ stock }) {
  const price = STOCK_PRICES[stock.sym] || 0;
  const chg   = STOCK_CHANGES[stock.sym] || 0;
  const chgAbs = price * (chg / 100);
  const rsi = 45 + Math.random() * 20;
  const rsiSig = rsi > 65 ? 'Overbought' : rsi < 35 ? 'Oversold' : 'Neutral';
  return (
    <>
      <div className="coin-hdr">
        <div className="coin-id">
          <span className="stock-badge" style={{ fontSize: 14, padding: '6px 10px' }}>{stock.sym}</span>
          <div>
            <div className="coin-name-txt">{stock.name}</div>
            <div className="coin-pair">{stock.tv.split(':')[0]} · {stock.sector}</div>
          </div>
          <div className="price-block">
            <div className="big-price">${fmt(price, 2)}</div>
            <div className={`price-chg ${pctClass(chg)}`}>{chgAbs >= 0 ? '+' : ''}${fmt(Math.abs(chgAbs), 2)} ({fmtPct(chg)})</div>
          </div>
        </div>
        <div className="coin-metrics">
          {[
            ['52w High', '$' + stock.high52],
            ['52w Low',  '$' + stock.low52],
            ['Avg Vol',  stock.avgvol],
            ['Mkt Cap',  stock.mcap],
            ['P/E',      stock.pe || '—'],
            ['EPS',      '$' + stock.eps],
            ['Beta',     stock.beta],
            ['Dividend', stock.div],
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
        <div className="ta-item"><span className="ta-label">24h Chg</span><span className={`ta-val ${pctClass(chg)}`}>{fmtPct(chg)}</span></div>
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
              <div className={`sector-bar ${s.chg >= 0 ? 'pos' : 'neg'}`} style={{ width: (Math.abs(s.chg) / max * 100) + '%' }} />
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
  const iv  = (15 + Math.random() * 35).toFixed(1);
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

function TopStocksTable({ stocks, onSelect }) {
  const STOCK_DATA = stocks.map(s => ({
    ...s,
    price: STOCK_PRICES[s.sym] || 0,
    chgAbs: (STOCK_PRICES[s.sym] || 0) * ((STOCK_CHANGES[s.sym] || 0) / 100),
    chgPct: STOCK_CHANGES[s.sym] || 0,
  }));
  return (
    <div className="bottom-row">
      <div className="bottom-card" style={{ flex: 1 }}>
        <div className="bc-hdr"><h3>Top Stocks & ETFs</h3></div>
        <div className="tbl-wrap">
          <table className="mkt-tbl">
            <thead>
              <tr><th>Symbol</th><th>Company</th><th>Price</th><th>Change</th><th>% Change</th><th>Mkt Cap</th><th>P/E</th><th>Sector</th></tr>
            </thead>
            <tbody>
              {STOCK_DATA.map(r => (
                <tr key={r.sym} onClick={() => onSelect(r)} style={{ cursor: 'pointer' }}>
                  <td><b>{r.sym}</b></td>
                  <td>{r.name}</td>
                  <td className="mono">${fmt(r.price, 2)}</td>
                  <td className={pctClass(r.chgAbs)}>{r.chgAbs >= 0 ? '+' : '-'}${fmt(Math.abs(r.chgAbs), 2)}</td>
                  <td className={pctClass(r.chgPct)}>{fmtPct(r.chgPct)}</td>
                  <td className="mono">{r.mcap}</td>
                  <td className="mono">{r.pe || '—'}</td>
                  <td style={{ color: 'var(--txt3)' }}>{r.sector}</td>
                </tr>
              ))}
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
                  {preview ? <img className="news-img" src={preview} alt="" loading="lazy" onError={e => e.target.style.display='none'} /> : <div className="news-img-placeholder">📈</div>}
                  <div className="news-body">
                    <div className="news-source"><span className="news-src">r/{p.subreddit}</span><span className="news-date">{timeAgo(p.created_utc)}</span></div>
                    <div className="news-title">{p.title}</div>
                    <div style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 4 }}>▲ {p.score} · 💬 {p.num_comments}</div>
                  </div>
                </a>
              );
            })
        }
      </div>
    </div>
  );
}

export default function StocksView({ theme, onToast }) {
  const [selected, setSelected] = useState(STOCKS[0]);
  const [tvInterval, setTvInterval] = useState('D');
  const [news, setNews]     = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);

  useEffect(() => { loadNews(); }, []);

  async function loadNews() {
    setNewsLoading(true);
    try {
      const posts = await fetchNews('Trading');
      setNews(posts);
    } catch { setNews([]); }
    setNewsLoading(false);
  }

  const TF_LABELS = { '1':'1m','5':'5m','15':'15m','60':'1h','D':'1D','W':'1W','M':'1M','12M':'1Y' };

  return (
    <>
      <IndicesBar />
      <div className="dash-grid">
        <aside className="left-panel">
          <div className="panel-section">
            <div className="panel-hdr"><span>Stock Watchlist</span></div>
            <StockWatchlist stocks={STOCKS} selected={selected} onSelect={setSelected} />
          </div>
          <StockMovers stocks={STOCKS} onSelect={setSelected} />
        </aside>

        <main className="center-panel">
          <StockHeader stock={selected} />
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

      <TopStocksTable stocks={STOCKS} onSelect={setSelected} />
      <StockNews posts={news} loading={newsLoading} onRefresh={loadNews} />
    </>
  );
}
