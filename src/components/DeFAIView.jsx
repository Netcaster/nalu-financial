import React, { useState, useEffect } from 'react';
import TVChart from './TVChart.jsx';
import { fetchMarketData, fetchDefiLlamaTVL } from '../lib/api.js';
import { fmt, fmtCompact, fmtPct, pctClass, decimalPlaces } from '../lib/utils.js';
import { DEFAI_TOKENS, CG_TO_TV, APPROVAL_QUEUE } from '../lib/constants.js';

const DEFAI_IDS = DEFAI_TOKENS.map(t => t.id);

const SCANNER_DATA = [
  { protocol:'Bittensor (TAO)',    metric:'Validator APY',      value:'~18-24%', signal:'Bullish',  color:'#00d395' },
  { protocol:'Ocean Protocol',     metric:'Staking APY',        value:'~12%',    signal:'Neutral',  color:'#94a3b8' },
  { protocol:'Autonolas (OLAS)',   metric:'Agent Activity',     value:'↑ +34%',  signal:'Bullish',  color:'#00d395' },
  { protocol:'Fetch.ai / ASI',     metric:'TVL Growth (7d)',    value:'+8.2%',   signal:'Bullish',  color:'#00d395' },
  { protocol:'SingularityNET',     metric:'Token Unlocks',      value:'None 30d',signal:'Neutral',  color:'#94a3b8' },
  { protocol:'Render Network',     metric:'GPU Compute Demand', value:'↑ +21%',  signal:'Bullish',  color:'#00d395' },
  { protocol:'Worldcoin (WLD)',    metric:'Governance Activity',value:'Low',     signal:'Bearish',  color:'#ff4560' },
];

const DILIGENCE_ITEMS = [
  { item:'Team & advisors publicly known', checked: true  },
  { item:'Token utility clearly defined',  checked: true  },
  { item:'No major unlocks in 30 days',    checked: true  },
  { item:'Active GitHub / dev activity',   checked: true  },
  { item:'Adequate on-chain liquidity',    checked: null  },
  { item:'TVL growth trend positive',      checked: null  },
  { item:'Regulatory exposure reviewed',   checked: false },
];

const RISK_ALERTS = [
  { title:'High concentration risk',  detail:'AI tokens represent a significant portion of tracked DeFAI exposure. Consider diversification.', sev:'High'   },
  { title:'AI sector momentum',       detail:'DeFAI tokens outperforming large-cap crypto over last 7 days. Momentum may reverse.', sev:'Medium' },
  { title:'Stablecoin yield signal',  detail:'Monitored stablecoin pool APY moved outside target range. Review before depositing.', sev:'Medium' },
  { title:'Governance token exposure',detail:'WLD governance activity is low — may indicate low community engagement risk.', sev:'Low'    },
];

export default function DeFAIView({ theme, onToast }) {
  const [marketData,   setMarketData]   = useState([]);
  const [defiTVL,      setDefiTVL]      = useState([]);
  const [selected,     setSelected]     = useState(DEFAI_TOKENS[0]);
  const [tvInterval,   setTvInterval]   = useState('D');
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    fetchMarketData(DEFAI_IDS)
      .then(data => { setMarketData(data); setLoading(false); })
      .catch(() => setLoading(false));

    const t = setInterval(() => {
      fetchMarketData(DEFAI_IDS).then(data => setMarketData(data)).catch(() => {});
    }, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetchDefiLlamaTVL()
      .then(data => setDefiTVL(data))
      .catch(() => {});
  }, []);

  const marketMap = Object.fromEntries(marketData.map(c => [c.id, c]));

  // Build live scanner rows: 7d price change from CoinGecko + TVL from DefiLlama
  const tvlMap = Object.fromEntries(
    defiTVL.map(p => [p.slug?.toLowerCase() || p.name?.toLowerCase(), p])
  );
  const liveScanner = DEFAI_TOKENS.map(token => {
    const c   = marketMap[token.id];
    const chg = c?.price_change_percentage_7d_in_currency ?? null;
    // match DefiLlama by various slug/name patterns
    const llamaKey = Object.keys(tvlMap).find(k =>
      k.includes(token.id.replace('-org','').replace('-2','').replace('-network','').replace('-protocol','')) ||
      k.includes(token.sym.toLowerCase()) ||
      k.includes(token.name.toLowerCase().split(' ')[0])
    );
    const llama = llamaKey ? tvlMap[llamaKey] : null;
    const tvl   = llama?.tvl ?? null;

    let signal = 'Neutral';
    let color  = '#94a3b8';
    if (chg !== null) {
      if (chg >= 5)       { signal = 'Bullish'; color = '#00d395'; }
      else if (chg <= -5) { signal = 'Bearish'; color = '#ff4560'; }
    }

    const metric = tvl != null ? 'TVL (DefiLlama)' : '7d Price Change';
    const value  = tvl != null
      ? '$' + fmtCompact(tvl)
      : chg !== null ? fmtPct(chg) : '—';

    return { protocol: token.name, metric, value, signal, color, live: !!(c || llama) };
  });
  const tvSym = CG_TO_TV[selected.id] || `BINANCE:${selected.sym}USDT`;

  return (
    <div style={{ padding: '0 0 40px' }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, var(--bg2) 0%, rgba(99,102,241,0.08) 100%)', borderBottom: '1px solid var(--border)', padding: '20px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span className="defai-tag">🤖 DeFAI Intelligence</span>
              <span style={{ fontSize: 11, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, padding: '2px 8px', color: '#fde68a' }}>Phase 2 — Scanner Active</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>AI Token Command Center</h1>
            <p style={{ fontSize: 13, color: 'var(--txt2)', maxWidth: 600 }}>
              Monitor AI infrastructure tokens, DeFAI protocols, staking yields, governance activity, and smart-contract risk signals. No autonomous actions — human approval required for all moves.
            </p>
          </div>
          <div style={{ background: 'rgba(255,69,96,0.08)', border: '1px solid rgba(255,69,96,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fca5a5', fontWeight: 600 }}>
              🔒 Security Rule
            </div>
            <p style={{ color: 'var(--txt2)', fontSize: 11, marginTop: 4 }}>No seed phrases. No private keys.<br />No autonomous DeFi actions. Ever.</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 260px', gap: 0, height: 'calc(100vh - 260px)', minHeight: 500 }}>
        {/* LEFT — DeFAI Watchlist */}
        <aside className="left-panel">
          <div className="panel-section">
            <div className="panel-hdr"><span>AI Token Watchlist</span></div>
            <div className="watchlist-list">
              {DEFAI_TOKENS.map(token => {
                const c = marketMap[token.id];
                const chg = c?.price_change_percentage_24h || 0;
                const p   = c?.current_price || 0;
                return (
                  <div key={token.id} className={`wl-item${selected.id === token.id ? ' active' : ''}`} onClick={() => setSelected(token)}>
                    <div className="wl-left" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: 12 }}>{token.sym}</span>
                        <span style={{ fontSize: 9, color: 'var(--txt3)', background: 'var(--card2)', borderRadius: 4, padding: '1px 5px' }}>{token.tag}</span>
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--txt3)' }}>{token.name}</div>
                    </div>
                    <div className="wl-right">
                      <div className="wl-price">{p ? '$' + fmt(p, decimalPlaces(p)) : '—'}</div>
                      <div className={`wl-chg ${pctClass(chg)}`}>{fmtPct(chg)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Risk Alerts */}
          <div className="panel-section">
            <div className="panel-hdr"><span>Risk Alerts</span></div>
            <div style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {RISK_ALERTS.map(a => (
                <div key={a.title} style={{ background: 'var(--card2)', borderRadius: 8, padding: '7px 9px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{a.title}</span>
                    <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 8,
                      background: a.sev === 'High' ? 'rgba(255,69,96,0.15)' : a.sev === 'Medium' ? 'rgba(245,158,11,0.15)' : 'rgba(148,163,184,0.15)',
                      color:      a.sev === 'High' ? 'var(--red)' : a.sev === 'Medium' ? 'var(--yellow)' : 'var(--txt2)'
                    }}>{a.sev}</span>
                  </div>
                  <p style={{ fontSize: 10, color: 'var(--txt2)' }}>{a.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* CENTER — Chart */}
        <main className="center-panel">
          <div className="coin-hdr">
            <div className="coin-id">
              <span className="defai-tag" style={{ fontSize: 14, padding: '4px 10px' }}>🤖 {selected.sym}</span>
              <div>
                <div className="coin-name-txt">{selected.name}</div>
                <div className="coin-pair">{selected.tag}</div>
              </div>
              {marketMap[selected.id] && (
                <div className="price-block">
                  <div className="big-price">${fmt(marketMap[selected.id].current_price, decimalPlaces(marketMap[selected.id].current_price))}</div>
                  <div className={`price-chg ${pctClass(marketMap[selected.id].price_change_percentage_24h)}`}>
                    {fmtPct(marketMap[selected.id].price_change_percentage_24h)}
                  </div>
                </div>
              )}
            </div>
            {marketMap[selected.id] && (
              <div className="coin-metrics">
                {[
                  ['24h High',   '$' + fmt(marketMap[selected.id].high_24h, 2)],
                  ['24h Low',    '$' + fmt(marketMap[selected.id].low_24h, 2)],
                  ['Volume',     fmtCompact(marketMap[selected.id].total_volume)],
                  ['Market Cap', fmtCompact(marketMap[selected.id].market_cap)],
                  ['Rank',       '#' + marketMap[selected.id].market_cap_rank],
                  ['7d Chg',     fmtPct(marketMap[selected.id].price_change_percentage_7d_in_currency)],
                ].map(([k, v]) => <div key={k} className="cm"><span>{k}</span><b>{v}</b></div>)}
              </div>
            )}
          </div>

          <div className="chart-ctrl-bar">
            <div className="tf-group">
              {[['1','1m'],['5','5m'],['15','15m'],['60','1h'],['D','1D'],['W','1W'],['M','1M']].map(([tf, label]) => (
                <button key={tf} className={`tf-btn${tvInterval === tf ? ' active' : ''}`} onClick={() => setTvInterval(tf)}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <TVChart symbol={tvSym} interval={tvInterval} theme={theme} />

          {/* Market summary table */}
          <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)', background: 'var(--bg2)' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt2)', marginBottom: 8, textTransform: 'uppercase' }}>AI Token Market Summary</div>
            <div style={{ overflowX: 'auto' }}>
              <table className="mkt-tbl" style={{ minWidth: 500 }}>
                <thead>
                  <tr><th>Token</th><th>Price</th><th>24h%</th><th>7d%</th><th>Volume</th><th>MCap</th><th>Category</th></tr>
                </thead>
                <tbody>
                  {DEFAI_TOKENS.map(token => {
                    const c = marketMap[token.id];
                    if (!c) return <tr key={token.id}><td colSpan={7}><span style={{ color: 'var(--txt3)', fontSize: 11 }}>{token.sym} — loading…</span></td></tr>;
                    return (
                      <tr key={token.id} onClick={() => setSelected(token)} style={{ cursor: 'pointer' }}>
                        <td><b style={{ color: 'var(--teal)' }}>{token.sym}</b></td>
                        <td className="mono">${fmt(c.current_price, decimalPlaces(c.current_price))}</td>
                        <td className={pctClass(c.price_change_percentage_24h)}>{fmtPct(c.price_change_percentage_24h)}</td>
                        <td className={pctClass(c.price_change_percentage_7d_in_currency)}>{fmtPct(c.price_change_percentage_7d_in_currency)}</td>
                        <td className="mono">{fmtCompact(c.total_volume)}</td>
                        <td className="mono">{fmtCompact(c.market_cap)}</td>
                        <td style={{ color: 'var(--txt3)', fontSize: 11 }}>{token.tag}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        {/* RIGHT — Scanner + Diligence */}
        <aside className="right-panel">
          {/* Protocol Scanner */}
          <div className="panel-section">
            <div className="panel-hdr">
              <span>Protocol Scanner</span>
              {liveScanner.some(s => s.live) &&
                <span style={{ fontSize:9, color:'var(--green)', marginLeft:6 }}>● LIVE</span>}
            </div>
            <div style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
              {liveScanner.map(s => (
                <div key={s.protocol} style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: 'var(--txt2)', fontWeight: 500 }}>{s.protocol}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: s.color }}>{s.signal}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 10, color: 'var(--txt3)' }}>{s.metric}</span>
                    <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 600 }}>{s.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Token Diligence Checklist */}
          <div className="panel-section">
            <div className="panel-hdr"><span>Diligence Checklist</span></div>
            <div style={{ padding: '6px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
              {DILIGENCE_ITEMS.map(d => (
                <div key={d.item} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 14,
                    color: d.checked === true ? 'var(--green)' : d.checked === false ? 'var(--red)' : 'var(--txt3)'
                  }}>
                    {d.checked === true ? '✓' : d.checked === false ? '✕' : '○'}
                  </span>
                  <span style={{ fontSize: 11, color: d.checked === null ? 'var(--txt3)' : 'var(--txt)' }}>{d.item}</span>
                </div>
              ))}
              <p style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 6, fontStyle: 'italic' }}>
                ○ = pending manual review
              </p>
            </div>
          </div>

          {/* Human Approval Queue */}
          <div className="panel-section">
            <div className="panel-hdr"><span>Approval Queue</span></div>
            <div style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {APPROVAL_QUEUE.map(a => (
                <div key={a.action} className="queue-item">
                  <div className="queue-item-hdr">
                    <span>{a.action}</span>
                    <span className="decision-badge">{a.decision}</span>
                  </div>
                  <p style={{ fontSize: 10, color: 'var(--txt2)', marginTop: 3 }}>{a.note}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Bottom — Roadmap note */}
      <div style={{ padding: '14px 20px', background: 'var(--bg2)', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { phase:'Phase 1 ✓', title:'AI Token Watchlist', done: true,  desc:'Live prices, charts, market data for DeFAI tokens.' },
            { phase:'Phase 2 ✓', title:'Protocol Scanner',   done: true,  desc:'Yield monitoring, TVL tracking, governance signals.' },
            { phase:'Phase 3',   title:'Full DeFAI Scanner', done: false, desc:'On-chain wallet flows, token unlock calendars, contract risk scores.' },
            { phase:'Phase 4',   title:'NaluAsk Integration', done: false, desc:'AI research queries on DeFAI protocol data and opportunity discovery.' },
          ].map(r => (
            <div key={r.phase} style={{ flex: '1 1 180px', background: r.done ? 'rgba(20,188,189,0.06)' : 'var(--card)', border: `1px solid ${r.done ? 'rgba(20,188,189,0.2)' : 'var(--border)'}`, borderRadius: 10, padding: '10px 12px' }}>
              <span style={{ fontSize: 10, color: r.done ? 'var(--teal)' : 'var(--txt3)', fontWeight: 600 }}>{r.phase}</span>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{r.title}</div>
              <p style={{ fontSize: 11, color: 'var(--txt2)', marginTop: 4 }}>{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
