import React, { useState, useEffect } from 'react';
import { fetchMarketData, fetchFundingRates } from '../lib/api.js';
import { fmt, fmtPct, pctClass } from '../lib/utils.js';
import { DEFAI_TOKENS } from '../lib/constants.js';

/* ── Pearson correlation ─────────────────────────────────────────── */
function pearson(a, b) {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  const ax = a.slice(-n), bx = b.slice(-n);
  const ma = ax.reduce((s, v) => s + v, 0) / n;
  const mb = bx.reduce((s, v) => s + v, 0) / n;
  const num = ax.reduce((s, v, i) => s + (v - ma) * (bx[i] - mb), 0);
  const da = Math.sqrt(ax.reduce((s, v) => s + (v - ma) ** 2, 0));
  const db = Math.sqrt(bx.reduce((s, v) => s + (v - mb) ** 2, 0));
  return da && db ? num / (da * db) : 0;
}

function corrBg(v) {
  if (v >= 0.99) return 'var(--bg2)';
  if (v >= 0.7)  return 'rgba(255,69,96,0.50)';
  if (v >= 0.4)  return 'rgba(245,158,11,0.38)';
  if (v >= 0.1)  return 'rgba(20,188,189,0.22)';
  if (v >= -0.1) return 'var(--card2)';
  if (v >= -0.4) return 'rgba(99,102,241,0.22)';
  return 'rgba(0,211,149,0.38)';
}

const SETUPS      = ['Breakout','Pullback','Reversal','Momentum','Mean Reversion','News Play','Other'];
const ASSET_TYPES = ['crypto','stock','etf','defi','other'];

/* ── mini equity curve ───────────────────────────────────────────── */
function EquityCurve({ trades }) {
  if (trades.length < 2) return null;
  const cum = trades.slice().reverse().reduce((acc, t) => {
    acc.push((acc[acc.length - 1] ?? 0) + t.pnl);
    return acc;
  }, []);
  const W = 260, H = 44;
  const min = Math.min(0, ...cum), max = Math.max(0, ...cum);
  const range = max - min || 1;
  const pts = cum.map((v, i) => ({
    x: (i / (cum.length - 1)) * W,
    y: H - ((v - min) / range) * H,
  }));
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const final = cum[cum.length - 1];
  const lc = final >= 0 ? 'var(--green)' : 'var(--red)';
  const zeroY = H - ((0 - min) / range) * H;
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display:'block', marginTop:6 }}>
      <line x1="0" y1={zeroY.toFixed(1)} x2={W} y2={zeroY.toFixed(1)} stroke="var(--border)" strokeWidth="1" strokeDasharray="3,3" />
      <path d={d} fill="none" stroke={lc} strokeWidth="1.5" />
      <circle cx={pts[pts.length-1].x} cy={pts[pts.length-1].y} r="2.5" fill={lc} />
    </svg>
  );
}

/* ── main component ──────────────────────────────────────────────── */
export default function RiskView({ theme, onToast }) {
  /* position sizer */
  const [acct,    setAcct]    = useState('50000');
  const [riskPct, setRiskPct] = useState('2');
  const [entry,   setEntry]   = useState('');
  const [stop,    setStop]    = useState('');
  const [isLong,  setIsLong]  = useState(true);

  /* portfolio */
  const [holdings, setHoldings] = useState(() => { try { return JSON.parse(localStorage.getItem('nalu_holdings') || '[]'); } catch { return []; } });
  const [holdForm, setHoldForm] = useState({ sym:'', type:'crypto', shares:'', avgCost:'' });

  /* trade journal */
  const [trades, setTrades] = useState(() => { try { return JSON.parse(localStorage.getItem('nalu_trades') || '[]'); } catch { return []; } });
  const [tForm,  setTForm]  = useState({ sym:'', setup:'Breakout', entry:'', exit:'', shares:'', direction:'long', note:'' });
  const [jTab,   setJTab]   = useState('add');
  const [sfilt,  setSfilt]  = useState('All');

  /* correlation */
  const [corrAssets,  setCorrAssets]  = useState([]);
  const [corrLoading, setCorrLoading] = useState(true);

  /* funding rates */
  const [funding, setFunding] = useState([]);

  /* ── fetches ── */
  useEffect(() => {
    const ids = [...DEFAI_TOKENS.map(t => t.id), 'bitcoin', 'ethereum'];
    fetchMarketData(ids)
      .then(data => {
        setCorrAssets(
          data
            .filter(c => c.sparkline_in_7d?.price?.length > 10)
            .map(c => ({ id: c.id, sym: c.symbol.toUpperCase(), prices: c.sparkline_in_7d.price }))
        );
        setCorrLoading(false);
      })
      .catch(() => setCorrLoading(false));
  }, []);

  useEffect(() => {
    const load = () => fetchFundingRates().then(setFunding).catch(() => {});
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  /* ── persist ── */
  useEffect(() => { localStorage.setItem('nalu_holdings', JSON.stringify(holdings)); }, [holdings]);
  useEffect(() => { localStorage.setItem('nalu_trades',   JSON.stringify(trades));   }, [trades]);

  /* ── position sizer math ── */
  const acctN   = parseFloat(acct.replace(/,/g,'')) || 0;
  const riskN   = parseFloat(riskPct)   || 0;
  const entryN  = parseFloat(entry)     || 0;
  const stopN   = parseFloat(stop)      || 0;
  const riskDollar = acctN * riskN / 100;
  const stopDist   = Math.abs(entryN - stopN);
  const maxShares  = stopDist > 0 ? Math.floor(riskDollar / stopDist) : 0;
  const posSize    = maxShares * entryN;
  const actualRisk = maxShares * stopDist;
  const pctOfAcct  = acctN > 0 ? posSize / acctN * 100 : 0;
  const dir        = isLong ? 1 : -1;
  const t1p = entryN + dir * stopDist;
  const t2p = entryN + dir * stopDist * 2;
  const t3p = entryN + dir * stopDist * 3;

  /* ── portfolio math ── */
  const totalVal = holdings.reduce((s, h) => s + parseFloat(h.shares||0) * parseFloat(h.avgCost||0), 0);
  const byType   = holdings.reduce((m, h) => {
    const v = parseFloat(h.shares||0) * parseFloat(h.avgCost||0);
    m[h.type] = (m[h.type] || 0) + v;
    return m;
  }, {});
  const topHoldVal = holdings.reduce((best, h) => {
    const v = parseFloat(h.shares||0) * parseFloat(h.avgCost||0);
    return Math.max(best, v);
  }, 0);
  const topPct     = totalVal > 0 ? topHoldVal / totalVal * 100 : 0;
  const concRisk   = topPct > 25 ? 'high' : topPct > 15 ? 'med' : 'ok';

  function addHolding() {
    if (!holdForm.sym || !holdForm.shares || !holdForm.avgCost) return;
    setHoldings(p => [...p, { ...holdForm, id: Date.now() }]);
    setHoldForm({ sym:'', type:'crypto', shares:'', avgCost:'' });
  }

  /* ── trade journal ── */
  function addTrade() {
    if (!tForm.sym || !tForm.entry || !tForm.exit || !tForm.shares) return;
    const eP = parseFloat(tForm.entry), xP = parseFloat(tForm.exit), sh = parseFloat(tForm.shares);
    const pnl = tForm.direction === 'long' ? (xP - eP) * sh : (eP - xP) * sh;
    setTrades(p => [{ ...tForm, pnl, date: new Date().toISOString(), id: Date.now() }, ...p]);
    setTForm({ sym:'', setup:'Breakout', entry:'', exit:'', shares:'', direction:'long', note:'' });
    if (onToast) onToast(`${tForm.sym} — ${pnl >= 0 ? '+' : ''}$${fmt(Math.abs(pnl), 2)}`, pnl >= 0 ? '✅' : '📉');
  }

  /* ── stats ── */
  const ft    = sfilt === 'All' ? trades : trades.filter(t => t.setup === sfilt);
  const wins  = ft.filter(t => t.pnl > 0);
  const loss  = ft.filter(t => t.pnl <= 0);
  const wr    = ft.length ? wins.length / ft.length * 100 : 0;
  const avgW  = wins.length  ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length  : 0;
  const avgL  = loss.length  ? loss.reduce((s, t) => s + t.pnl, 0) / loss.length  : 0;
  const pf    = avgL !== 0   ? Math.abs(avgW / avgL) : 0;
  const totPnl = ft.reduce((s, t) => s + t.pnl, 0);
  const expect = ft.length ? (wr/100) * avgW + ((100-wr)/100) * avgL : 0;
  const maxStreak = trades.slice().reverse().reduce((acc, t) => {
    if (t.pnl <= 0) { acc.cur++; acc.max = Math.max(acc.max, acc.cur); } else { acc.cur = 0; }
    return acc;
  }, { cur:0, max:0 }).max;

  /* ── correlation matrix ── */
  const matrix = corrAssets.length > 1
    ? corrAssets.map((a, i) => corrAssets.map((b, j) => i === j ? 1 : pearson(a.prices, b.prices)))
    : [];

  /* ── shared styles ── */
  const inp = { width:'100%', padding:'6px 10px', background:'var(--card2)', border:'1px solid var(--border)', borderRadius:6, color:'var(--txt)', fontSize:12, outline:'none', boxSizing:'border-box' };
  const lbl = { fontSize:10, color:'var(--txt3)', marginBottom:2, display:'block' };
  const btn = { width:'100%', padding:'8px', background:'var(--teal)', color:'#000', border:'none', borderRadius:6, fontSize:12, fontWeight:700, cursor:'pointer', marginTop:4 };

  return (
    <div style={{ paddingBottom:40 }}>

      {/* ── Hero ── */}
      <div style={{ background:'linear-gradient(135deg, var(--bg2) 0%, rgba(20,188,189,0.06) 100%)', borderBottom:'1px solid var(--border)', padding:'14px 20px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
          <span style={{ fontSize:11, background:'rgba(20,188,189,0.12)', border:'1px solid rgba(20,188,189,0.3)', borderRadius:12, padding:'2px 10px', color:'var(--teal)', fontWeight:600 }}>⚖️ Risk Management</span>
          <span style={{ fontSize:11, background:'rgba(0,211,149,0.10)', border:'1px solid rgba(0,211,149,0.25)', borderRadius:12, padding:'2px 8px', color:'var(--green)' }}>Pre-Trade Toolkit</span>
        </div>
        <h1 style={{ fontSize:19, fontWeight:700, marginBottom:3 }}>Risk & Analytics Hub</h1>
        <p style={{ fontSize:12, color:'var(--txt2)' }}>Position sizing · Portfolio concentration · Correlation analysis · Trade journal · Performance tracking · Funding rates</p>
      </div>

      {/* ── 3-column grid ── */}
      <div style={{ display:'grid', gridTemplateColumns:'268px 1fr 292px', gap:0, alignItems:'start' }}>

        {/* ═══════════════════════════════
            LEFT: Position Sizer + Funding
            ═══════════════════════════════ */}
        <aside className="left-panel" style={{ overflowY:'auto', maxHeight:'calc(100vh - 170px)' }}>

          {/* Position Sizer */}
          <div className="panel-section">
            <div className="panel-hdr"><span>Position Sizer</span></div>
            <div style={{ padding:'10px 12px', display:'flex', flexDirection:'column', gap:7 }}>

              {/* Long / Short toggle */}
              <div style={{ display:'flex', gap:4 }}>
                {['Long','Short'].map(d => (
                  <button key={d} onClick={() => setIsLong(d === 'Long')} style={{
                    flex:1, padding:'5px', borderRadius:5, border:'1px solid var(--border)', cursor:'pointer', fontSize:11, fontWeight:600,
                    background: (isLong === (d === 'Long')) ? (d === 'Long' ? 'rgba(0,211,149,0.15)' : 'rgba(255,69,96,0.15)') : 'var(--card2)',
                    color:      (isLong === (d === 'Long')) ? (d === 'Long' ? 'var(--green)' : 'var(--red)') : 'var(--txt3)',
                  }}>{d}</button>
                ))}
              </div>

              <div>
                <label style={lbl}>Account Size ($)</label>
                <input style={inp} type="number" value={acct} onChange={e => setAcct(e.target.value)} placeholder="50000" />
              </div>

              <div>
                <label style={lbl}>Max Risk per Trade</label>
                <div style={{ display:'flex', gap:3, marginBottom:3 }}>
                  {['0.5','1','2','3'].map(v => (
                    <button key={v} onClick={() => setRiskPct(v)} style={{
                      flex:1, padding:'3px', borderRadius:4, border:'1px solid var(--border)', cursor:'pointer', fontSize:10,
                      background: riskPct === v ? 'var(--teal)' : 'var(--card2)',
                      color:      riskPct === v ? '#000' : 'var(--txt3)',
                    }}>{v}%</button>
                  ))}
                </div>
                <input style={inp} type="number" value={riskPct} onChange={e => setRiskPct(e.target.value)} placeholder="2" />
              </div>

              <div style={{ display:'flex', gap:6 }}>
                <div style={{ flex:1 }}>
                  <label style={lbl}>Entry Price</label>
                  <input style={inp} type="number" value={entry} onChange={e => setEntry(e.target.value)} placeholder="0.00" />
                </div>
                <div style={{ flex:1 }}>
                  <label style={lbl}>Stop Price</label>
                  <input style={inp} type="number" value={stop} onChange={e => setStop(e.target.value)} placeholder="0.00" />
                </div>
              </div>

              {/* Output card */}
              {entryN > 0 && stopN > 0 && stopDist > 0 && (
                <div style={{ background:'var(--card)', borderRadius:8, padding:'10px 12px', border:'1px solid var(--border)' }}>
                  <div style={{ display:'flex', flexDirection:'column', gap:4, marginBottom:8 }}>
                    {[
                      ['Max Shares/Units',  maxShares.toLocaleString()],
                      ['Position Size',     '$' + fmt(posSize, 2)],
                      ['% of Account',      pctOfAcct.toFixed(1) + '%'],
                      ['Risk $',            '$' + fmt(actualRisk, 2)],
                      ['Stop Distance',     '$' + fmt(stopDist, stopDist < 1 ? 4 : 2)],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:11 }}>
                        <span style={{ color:'var(--txt3)' }}>{k}</span>
                        <b style={{ fontFamily:'monospace' }}>{v}</b>
                      </div>
                    ))}
                  </div>

                  <div style={{ borderTop:'1px solid var(--border)', paddingTop:7 }}>
                    <div style={{ fontSize:9, color:'var(--txt3)', fontWeight:700, letterSpacing:1, marginBottom:4 }}>R-MULTIPLE TARGETS</div>
                    {[
                      ['1R (Break-even rule)',  t1p, actualRisk],
                      ['2R (Minimum target)',   t2p, actualRisk * 2],
                      ['3R (Full target)',      t3p, actualRisk * 3],
                    ].map(([label, price, pnl]) => (
                      <div key={label} style={{ display:'flex', justifyContent:'space-between', fontSize:10, marginBottom:3 }}>
                        <span style={{ color:'var(--txt3)' }}>{label}</span>
                        <div>
                          <span style={{ fontFamily:'monospace', color: isLong ? 'var(--green)' : 'var(--red)' }}>${fmt(price, price < 1 ? 4 : 2)}</span>
                          <span style={{ color:'var(--green)', marginLeft:6, fontFamily:'monospace' }}>+${fmt(pnl, 0)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {pctOfAcct > 30 && (
                    <div style={{ background:'rgba(255,69,96,0.10)', border:'1px solid rgba(255,69,96,0.25)', borderRadius:5, padding:'5px 8px', fontSize:10, color:'var(--red)', marginTop:6 }}>
                      ⚠️ Position is {pctOfAcct.toFixed(0)}% of account — consider reducing.
                    </div>
                  )}
                  {riskN > 3 && (
                    <div style={{ background:'rgba(245,158,11,0.10)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:5, padding:'5px 8px', fontSize:10, color:'var(--yellow)', marginTop:4 }}>
                      ⚠️ Risking {riskN}% per trade — professional max is 1–2%.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Funding Rates */}
          <div className="panel-section">
            <div className="panel-hdr">
              <span>Crypto Funding Rates</span>
              {funding.length > 0 && <span style={{ fontSize:9, color:'var(--green)', marginLeft:6 }}>● LIVE</span>}
            </div>
            <div style={{ padding:'6px 12px', display:'flex', flexDirection:'column', gap:5 }}>
              {funding.length === 0
                ? <div style={{ fontSize:11, color:'var(--txt3)', padding:'8px 0' }}>Connecting to Binance Futures…</div>
                : funding.map(f => {
                    const pct = f.fundingRate * 100;
                    const ann = pct * 3 * 365;
                    const sig = pct > 0.05 ? 'Longs paying — crowded' : pct < -0.05 ? 'Shorts paying — squeeze risk' : 'Balanced';
                    const sc  = pct > 0.05 ? 'var(--red)' : pct < -0.05 ? 'var(--green)' : 'var(--txt3)';
                    return (
                      <div key={f.symbol} style={{ paddingBottom:5, borderBottom:'1px solid var(--border)' }}>
                        <div style={{ display:'flex', justifyContent:'space-between' }}>
                          <span style={{ fontSize:11, fontWeight:700 }}>{f.symbol}/USDT</span>
                          <span style={{ fontSize:11, fontFamily:'monospace', color: pct >= 0 ? 'var(--red)' : 'var(--green)' }}>
                            {pct >= 0 ? '+' : ''}{pct.toFixed(4)}%
                          </span>
                        </div>
                        <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, marginTop:1 }}>
                          <span style={{ color:sc }}>{sig}</span>
                          <span style={{ color:'var(--txt3)' }}>Ann ~{ann.toFixed(0)}%</span>
                        </div>
                      </div>
                    );
                  })
              }
              <p style={{ fontSize:9, color:'var(--txt3)', marginTop:2, fontStyle:'italic', lineHeight:1.4 }}>
                Funding paid every 8h. Extreme positive → crowded longs, squeeze risk. Extreme negative → crowded shorts, bounce risk.
              </p>
            </div>
          </div>

        </aside>

        {/* ═══════════════════════════════════════
            CENTER: Portfolio Heat Map + Correlation
            ═══════════════════════════════════════ */}
        <main className="center-panel" style={{ overflowY:'auto', maxHeight:'calc(100vh - 170px)' }}>

          {/* Portfolio Heat Map */}
          <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <h3 style={{ fontSize:13, fontWeight:700 }}>Portfolio Concentration</h3>
              {topPct > 15 && (
                <span style={{ fontSize:10, padding:'2px 8px', borderRadius:8,
                  background: concRisk === 'high' ? 'rgba(255,69,96,0.12)' : 'rgba(245,158,11,0.12)',
                  color:      concRisk === 'high' ? 'var(--red)' : 'var(--yellow)',
                  border:     concRisk === 'high' ? '1px solid rgba(255,69,96,0.3)' : '1px solid rgba(245,158,11,0.3)',
                }}>
                  {concRisk === 'high' ? '🔴 High Concentration Risk' : '🟡 Moderate Concentration'}
                </span>
              )}
            </div>

            {/* Add holding form */}
            <div style={{ display:'flex', gap:5, marginBottom:10, flexWrap:'wrap' }}>
              <input style={{ ...inp, flex:'2 1 90px' }} placeholder="Symbol (BTC, AAPL…)" value={holdForm.sym} onChange={e => setHoldForm(p => ({...p, sym: e.target.value.toUpperCase()}))} onKeyDown={e => e.key === 'Enter' && addHolding()} />
              <select style={{ ...inp, flex:'1 1 70px' }} value={holdForm.type} onChange={e => setHoldForm(p => ({...p, type: e.target.value}))}>
                {ASSET_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
              <input style={{ ...inp, flex:'1 1 70px' }} type="number" placeholder="Units" value={holdForm.shares} onChange={e => setHoldForm(p => ({...p, shares: e.target.value}))} />
              <input style={{ ...inp, flex:'1 1 70px' }} type="number" placeholder="Avg Cost $" value={holdForm.avgCost} onChange={e => setHoldForm(p => ({...p, avgCost: e.target.value}))} />
              <button onClick={addHolding} style={{ padding:'6px 12px', background:'var(--teal)', color:'#000', border:'none', borderRadius:6, fontSize:11, fontWeight:700, cursor:'pointer' }}>+ Add</button>
            </div>

            {holdings.length === 0
              ? <div style={{ textAlign:'center', padding:'28px', color:'var(--txt3)', fontSize:12 }}>Add your holdings above to see your concentration heat map.</div>
              : (
                <>
                  {/* By asset type */}
                  {Object.entries(byType).sort((a,b) => b[1]-a[1]).map(([type, val]) => {
                    const pct = totalVal > 0 ? val / totalVal * 100 : 0;
                    return (
                      <div key={type} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                        <span style={{ width:48, fontSize:10, color:'var(--txt2)' }}>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                        <div style={{ flex:1, height:13, background:'var(--card2)', borderRadius:4, overflow:'hidden' }}>
                          <div style={{ height:'100%', width: pct + '%', background: pct > 50 ? 'var(--red)' : pct > 30 ? 'var(--yellow)' : 'var(--teal)', borderRadius:4, transition:'width .3s' }} />
                        </div>
                        <span style={{ width:38, fontSize:10, fontFamily:'monospace', textAlign:'right', color: pct > 50 ? 'var(--red)' : pct > 30 ? 'var(--yellow)' : 'var(--txt)' }}>{pct.toFixed(1)}%</span>
                        <span style={{ width:60, fontSize:10, fontFamily:'monospace', textAlign:'right', color:'var(--txt3)' }}>${fmt(val, 0)}</span>
                      </div>
                    );
                  })}

                  <div style={{ fontSize:9, color:'var(--txt3)', fontWeight:700, letterSpacing:1, margin:'10px 0 5px', textTransform:'uppercase' }}>Individual Holdings</div>
                  {holdings
                    .slice()
                    .sort((a,b) => (parseFloat(b.shares||0)*parseFloat(b.avgCost||0)) - (parseFloat(a.shares||0)*parseFloat(a.avgCost||0)))
                    .map(h => {
                      const val = parseFloat(h.shares||0) * parseFloat(h.avgCost||0);
                      const pct = totalVal > 0 ? val / totalVal * 100 : 0;
                      return (
                        <div key={h.id} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                          <span style={{ width:48, fontSize:10, fontWeight:700 }}>{h.sym}</span>
                          <div style={{ flex:1, height:11, background:'var(--card2)', borderRadius:3, overflow:'hidden' }}>
                            <div style={{ height:'100%', width: pct + '%', background: pct > 25 ? 'var(--red)' : pct > 15 ? 'var(--yellow)' : 'var(--teal)', borderRadius:3, transition:'width .3s' }} />
                          </div>
                          <span style={{ width:34, fontSize:9, fontFamily:'monospace', textAlign:'right', color: pct > 25 ? 'var(--red)' : pct > 15 ? 'var(--yellow)' : 'var(--txt)' }}>{pct.toFixed(1)}%</span>
                          <span style={{ width:56, fontSize:9, fontFamily:'monospace', textAlign:'right', color:'var(--txt3)' }}>${fmt(val, 0)}</span>
                          <button onClick={() => setHoldings(p => p.filter(x => x.id !== h.id))} style={{ background:'none', border:'none', color:'var(--txt3)', cursor:'pointer', fontSize:11, padding:'0 2px' }}>✕</button>
                        </div>
                      );
                    })
                  }
                  <div style={{ display:'flex', justifyContent:'flex-end', fontSize:11, fontWeight:700, marginTop:8, borderTop:'1px solid var(--border)', paddingTop:6 }}>
                    Total: ${fmt(totalVal, 2)}
                  </div>
                </>
              )
            }
          </div>

          {/* Correlation Matrix */}
          <div style={{ padding:'14px 16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <h3 style={{ fontSize:13, fontWeight:700 }}>7-Day Correlation Matrix</h3>
              {!corrLoading && corrAssets.length > 0 && <span style={{ fontSize:9, color:'var(--green)' }}>● LIVE — CoinGecko 168h</span>}
            </div>
            <p style={{ fontSize:11, color:'var(--txt3)', marginBottom:10 }}>High correlation (&gt;0.7) means assets move together — adding them both doesn't reduce risk.</p>

            {corrLoading
              ? <div style={{ fontSize:11, color:'var(--txt3)', padding:'16px 0' }}>Computing correlations from live price data…</div>
              : corrAssets.length < 2
              ? <div style={{ fontSize:11, color:'var(--txt3)' }}>Insufficient sparkline data.</div>
              : (
                <>
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ borderCollapse:'collapse', fontSize:9 }}>
                      <thead>
                        <tr>
                          <th style={{ padding:'3px 5px', color:'var(--txt3)', width:44 }}></th>
                          {corrAssets.map(a => <th key={a.id} style={{ padding:'3px 5px', color:'var(--txt2)', fontWeight:600 }}>{a.sym}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {corrAssets.map((a, i) => (
                          <tr key={a.id}>
                            <td style={{ padding:'3px 5px', color:'var(--txt2)', fontWeight:700, whiteSpace:'nowrap' }}>{a.sym}</td>
                            {matrix[i]?.map((v, j) => (
                              <td key={j} style={{
                                padding:'4px 5px', textAlign:'center', borderRadius:2,
                                background: corrBg(v),
                                color: i === j ? 'var(--txt3)' : 'var(--txt)',
                                fontFamily:'monospace', fontWeight: i === j ? 400 : 600,
                                fontSize: i === j ? 8 : 9,
                              }}>
                                {i === j ? '—' : v.toFixed(2)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Legend */}
                  <div style={{ display:'flex', gap:10, marginTop:8, flexWrap:'wrap' }}>
                    {[
                      ['rgba(255,69,96,0.50)',   '> 0.7  High (moves together)'],
                      ['rgba(245,158,11,0.38)',   '0.4–0.7  Moderate'],
                      ['rgba(20,188,189,0.22)',   '0.1–0.4  Low'],
                      ['rgba(0,211,149,0.38)',    '< 0  Negative (diversifier)'],
                    ].map(([bg, label]) => (
                      <div key={label} style={{ display:'flex', alignItems:'center', gap:4, fontSize:9, color:'var(--txt3)' }}>
                        <div style={{ width:11, height:11, borderRadius:2, background:bg, flexShrink:0 }} />
                        {label}
                      </div>
                    ))}
                  </div>
                </>
              )
            }
          </div>

        </main>

        {/* ═══════════════════════════════════
            RIGHT: Trade Journal + Perf Stats
            ═══════════════════════════════════ */}
        <aside className="right-panel" style={{ overflowY:'auto', maxHeight:'calc(100vh - 170px)' }}>

          {/* Performance Stats */}
          <div className="panel-section">
            <div className="panel-hdr">
              <span>Performance Stats</span>
              <span style={{ fontSize:9, color:'var(--txt3)', marginLeft:'auto' }}>{trades.length} trades total</span>
            </div>
            <div style={{ padding:'8px 10px' }}>

              {/* Setup filter */}
              <div style={{ display:'flex', gap:3, flexWrap:'wrap', marginBottom:8 }}>
                {['All', ...SETUPS].map(s => (
                  <button key={s} onClick={() => setSfilt(s)} style={{
                    padding:'2px 6px', borderRadius:10, border:'1px solid var(--border)', fontSize:8, cursor:'pointer',
                    background: sfilt === s ? 'var(--teal)' : 'var(--card2)',
                    color:      sfilt === s ? '#000' : 'var(--txt3)',
                  }}>{s}</button>
                ))}
              </div>

              {ft.length === 0
                ? <div style={{ fontSize:11, color:'var(--txt3)', textAlign:'center', padding:'12px 0' }}>No trades logged yet.</div>
                : (
                  <>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
                      {[
                        ['Trades',          ft.length,                                                 'var(--txt)'],
                        ['Win Rate',         wr.toFixed(1) + '%',                                      wr >= 50 ? 'var(--green)' : 'var(--red)'],
                        ['Avg Win',         '+$' + fmt(avgW, 2),                                       'var(--green)'],
                        ['Avg Loss',         '$' + fmt(avgL, 2),                                       'var(--red)'],
                        ['Profit Factor',    pf.toFixed(2),                                            pf >= 1.5 ? 'var(--green)' : pf >= 1 ? 'var(--yellow)' : 'var(--red)'],
                        ['Expectancy/trade', (expect >= 0 ? '+' : '') + '$' + fmt(Math.abs(expect),2), expect >= 0 ? 'var(--green)' : 'var(--red)'],
                        ['Total P&L',        (totPnl >= 0 ? '+' : '') + '$' + fmt(Math.abs(totPnl),2), totPnl >= 0 ? 'var(--green)' : 'var(--red)'],
                        ['Max Loss Streak',  maxStreak + ' L',                                         maxStreak >= 4 ? 'var(--red)' : maxStreak >= 2 ? 'var(--yellow)' : 'var(--txt3)'],
                      ].map(([k, v, c]) => (
                        <div key={k} style={{ background:'var(--card2)', borderRadius:7, padding:'7px 9px' }}>
                          <div style={{ fontSize:9, color:'var(--txt3)', marginBottom:2 }}>{k}</div>
                          <div style={{ fontSize:13, fontWeight:700, fontFamily:'monospace', color:c }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    {/* Equity curve */}
                    <div style={{ marginTop:8, padding:'8px', background:'var(--card2)', borderRadius:6 }}>
                      <div style={{ fontSize:9, color:'var(--txt3)', marginBottom:2 }}>Equity Curve</div>
                      <EquityCurve trades={ft} />
                    </div>
                  </>
                )
              }
            </div>
          </div>

          {/* Trade Journal */}
          <div className="panel-section">
            <div className="panel-hdr">
              <span>Trade Journal</span>
            </div>

            <div style={{ display:'flex', borderBottom:'1px solid var(--border)' }}>
              {[['add','+ Log Trade'],['history','📋 History']].map(([t, label]) => (
                <button key={t} onClick={() => setJTab(t)} style={{
                  flex:1, padding:'7px', background:'none', border:'none', cursor:'pointer', fontSize:11,
                  fontWeight: jTab === t ? 700 : 400,
                  color:      jTab === t ? 'var(--teal)' : 'var(--txt3)',
                  borderBottom: jTab === t ? '2px solid var(--teal)' : '2px solid transparent',
                }}>{label}</button>
              ))}
            </div>

            {jTab === 'add' ? (
              <div style={{ padding:'10px 12px', display:'flex', flexDirection:'column', gap:6 }}>
                {/* Long / Short */}
                <div style={{ display:'flex', gap:4 }}>
                  {['long','short'].map(d => (
                    <button key={d} onClick={() => setTForm(p => ({...p, direction:d}))} style={{
                      flex:1, padding:'4px', borderRadius:5, border:'1px solid var(--border)', cursor:'pointer', fontSize:10, fontWeight:600,
                      background: tForm.direction === d ? (d === 'long' ? 'rgba(0,211,149,0.15)' : 'rgba(255,69,96,0.15)') : 'var(--card2)',
                      color:      tForm.direction === d ? (d === 'long' ? 'var(--green)' : 'var(--red)') : 'var(--txt3)',
                    }}>{d === 'long' ? '▲ Long' : '▼ Short'}</button>
                  ))}
                </div>

                <input style={inp} placeholder="Symbol (BTC, NVDA, TSLA…)" value={tForm.sym} onChange={e => setTForm(p => ({...p, sym: e.target.value.toUpperCase()}))} />

                <select style={inp} value={tForm.setup} onChange={e => setTForm(p => ({...p, setup: e.target.value}))}>
                  {SETUPS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                <div style={{ display:'flex', gap:5 }}>
                  <div style={{ flex:1 }}>
                    <label style={lbl}>Entry $</label>
                    <input style={inp} type="number" step="any" value={tForm.entry} onChange={e => setTForm(p => ({...p, entry: e.target.value}))} />
                  </div>
                  <div style={{ flex:1 }}>
                    <label style={lbl}>Exit $</label>
                    <input style={inp} type="number" step="any" value={tForm.exit} onChange={e => setTForm(p => ({...p, exit: e.target.value}))} />
                  </div>
                </div>

                <div>
                  <label style={lbl}>Shares / Units</label>
                  <input style={inp} type="number" step="any" value={tForm.shares} onChange={e => setTForm(p => ({...p, shares: e.target.value}))} />
                </div>

                {/* Projected P&L preview */}
                {tForm.entry && tForm.exit && tForm.shares && (() => {
                  const ep = parseFloat(tForm.entry), xp = parseFloat(tForm.exit), sh = parseFloat(tForm.shares);
                  const pnl = tForm.direction === 'long' ? (xp - ep) * sh : (ep - xp) * sh;
                  return (
                    <div style={{ background: pnl >= 0 ? 'rgba(0,211,149,0.08)' : 'rgba(255,69,96,0.08)', border: `1px solid ${pnl >= 0 ? 'rgba(0,211,149,0.2)' : 'rgba(255,69,96,0.2)'}`, borderRadius:6, padding:'5px 9px', fontSize:11, color: pnl >= 0 ? 'var(--green)' : 'var(--red)', fontWeight:700, fontFamily:'monospace' }}>
                      Projected: {pnl >= 0 ? '+' : ''}${fmt(Math.abs(pnl), 2)}
                    </div>
                  );
                })()}

                <textarea style={{ ...inp, resize:'vertical', minHeight:44, fontFamily:'inherit', lineHeight:1.4 }} placeholder="Notes — setup rationale, what you learned…" value={tForm.note} onChange={e => setTForm(p => ({...p, note: e.target.value}))} />
                <button onClick={addTrade} style={btn}>Log Trade</button>
              </div>
            ) : (
              <div style={{ maxHeight:420, overflowY:'auto' }}>
                {trades.length === 0
                  ? <div style={{ padding:'20px', textAlign:'center', fontSize:11, color:'var(--txt3)' }}>No trades logged yet.</div>
                  : trades.map(t => (
                    <div key={t.id} style={{ padding:'8px 12px', borderBottom:'1px solid var(--border)' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:2 }}>
                        <div style={{ display:'flex', gap:5, alignItems:'center' }}>
                          <span style={{ fontWeight:700, fontSize:12 }}>{t.sym}</span>
                          <span style={{ fontSize:8, color:'var(--txt3)', background:'var(--card2)', borderRadius:4, padding:'1px 5px' }}>{t.setup}</span>
                          <span style={{ fontSize:8, color: t.direction === 'long' ? 'var(--green)' : 'var(--red)' }}>{t.direction}</span>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <span style={{ fontSize:12, fontFamily:'monospace', fontWeight:700, color: t.pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                            {t.pnl >= 0 ? '+' : '-'}${fmt(Math.abs(t.pnl), 2)}
                          </span>
                          <button onClick={() => setTrades(p => p.filter(x => x.id !== t.id))} style={{ background:'none', border:'none', color:'var(--txt3)', cursor:'pointer', fontSize:11, lineHeight:1 }}>✕</button>
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:8, fontSize:9, color:'var(--txt3)' }}>
                        <span>In: ${parseFloat(t.entry).toFixed(4)}</span>
                        <span>Out: ${parseFloat(t.exit).toFixed(4)}</span>
                        <span>{parseFloat(t.shares).toLocaleString()} units</span>
                      </div>
                      {t.note && <p style={{ fontSize:10, color:'var(--txt2)', fontStyle:'italic', marginTop:3 }}>{t.note}</p>}
                      <div style={{ fontSize:8, color:'var(--txt3)', marginTop:2 }}>{new Date(t.date).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}</div>
                    </div>
                  ))
                }
              </div>
            )}
          </div>

        </aside>
      </div>

      {/* Risk Rules footer */}
      <div style={{ margin:'0 0', padding:'12px 20px', background:'var(--bg2)', borderTop:'1px solid var(--border)' }}>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
          {[
            ['📏 1–2% Rule',           'Never risk more than 1–2% of total account on any single trade.'],
            ['📦 Position Sizing',     'Use the sizer above before every trade. Consistent sizing protects from single blowups.'],
            ['🔀 Correlation Risk',    'If assets are >0.7 correlated, they\'re essentially the same trade. Diversify accordingly.'],
            ['📓 Journal Every Trade', 'Winners and losers. The journal reveals your edge — or lack of one.'],
          ].map(r => (
            <div key={r[0]} style={{ flex:'1 1 200px', background:'var(--card)', border:'1px solid var(--border)', borderRadius:8, padding:'8px 12px' }}>
              <div style={{ fontSize:11, fontWeight:700, marginBottom:3 }}>{r[0]}</div>
              <p style={{ fontSize:10, color:'var(--txt2)' }}>{r[1]}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
