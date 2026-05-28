import React, { useState, useEffect, useCallback } from 'react';

/* ── helpers ─────────────────────────────────────────────────────── */
function fmt(n, d = 2) {
  if (n == null) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}
function pctColor(n) { return n >= 0 ? 'var(--green)' : 'var(--red)'; }

/* ── primitives ──────────────────────────────────────────────────── */
function Card({ children, style = {} }) {
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '1rem', ...style,
    }}>
      {children}
    </div>
  );
}

function CardHeader({ title, badge, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--txt)' }}>{title}</span>
        {badge && (
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '.06em', padding: '2px 7px',
            borderRadius: 999, background: 'rgba(20,188,189,0.15)', color: 'var(--teal)',
            border: '1px solid rgba(20,188,189,0.25)',
          }}>{badge}</span>
        )}
      </div>
      {right}
    </div>
  );
}

/* ── market strip ────────────────────────────────────────────────── */
function MarketStrip({ prices }) {
  const items = [
    { sym: 'BTC',  price: prices.crypto.bitcoin?.usd,  chg: prices.crypto.bitcoin?.usd_24h_change,  sep: true },
    { sym: 'ETH',  price: prices.crypto.ethereum?.usd, chg: prices.crypto.ethereum?.usd_24h_change },
    { sym: 'SOL',  price: prices.crypto.solana?.usd,   chg: prices.crypto.solana?.usd_24h_change,   sep: true },
    { sym: 'SPY',  price: prices.stocks.SPY?.price,    chg: prices.stocks.SPY?.changePercent },
    { sym: 'QQQ',  price: prices.stocks.QQQ?.price,    chg: prices.stocks.QQQ?.changePercent },
    { sym: 'NVDA', price: prices.stocks.NVDA?.price,   chg: prices.stocks.NVDA?.changePercent },
    { sym: 'COIN', price: prices.stocks.COIN?.price,   chg: prices.stocks.COIN?.changePercent },
  ];
  return (
    <div style={{
      display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center',
      padding: '10px 14px', marginBottom: 18,
      background: 'var(--card)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.85rem',
    }}>
      {items.map(({ sym, price, chg, sep }) => (
        <React.Fragment key={sym}>
          {sep && <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.08)', margin: '0 4px' }} />}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 7,
            background: 'var(--card2)', border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--txt3)', letterSpacing: '.04em' }}>{sym}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt)' }}>
              {price != null ? `$${price < 10 ? fmt(price, 4) : price < 100 ? fmt(price, 2) : price.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : '—'}
            </span>
            {chg != null && (
              <span style={{ fontSize: 10, fontWeight: 600, color: pctColor(chg) }}>
                {chg >= 0 ? '+' : ''}{chg.toFixed(2)}%
              </span>
            )}
          </div>
        </React.Fragment>
      ))}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
        <span style={{ fontSize: 10, color: 'var(--txt3)' }}>Live</span>
      </div>
    </div>
  );
}

/* ── AI brief card ───────────────────────────────────────────────── */
function AIBriefCard({ brief, loading, onGenerate }) {
  const ts = brief?.generated
    ? new Date(brief.generated).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : null;
  return (
    <Card style={{ padding: 22, display: 'flex', flexDirection: 'column', minHeight: 260 }}>
      <CardHeader
        title="AI Market Intelligence Brief"
        badge="CLAUDE"
        right={
          <button onClick={onGenerate} disabled={loading} style={{
            padding: '5px 13px', borderRadius: 7, border: '1px solid var(--teal)',
            background: 'transparent', color: 'var(--teal)', fontSize: 12,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
          }}>
            {loading ? 'Generating…' : brief ? '↻ Refresh' : 'Generate Brief'}
          </button>
        }
      />
      {!brief && !loading && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <div style={{ fontSize: 36 }}>🧠</div>
          <p style={{ fontSize: 13, color: 'var(--txt2)', textAlign: 'center', maxWidth: 340, lineHeight: 1.65, margin: 0 }}>
            Generate an institutional AI market brief from live crypto + equity data.
          </p>
          <button onClick={onGenerate} style={{
            padding: '10px 28px', borderRadius: 10, border: 'none',
            background: 'var(--teal)', color: '#040d14', fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}>Generate Brief</button>
        </div>
      )}
      {loading && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--txt2)', fontSize: 13 }}>
          ⟳ &nbsp;Analyzing live market data…
        </div>
      )}
      {brief && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
          <div style={{
            flex: 1, background: 'var(--card2)', border: '1px solid rgba(20,188,189,0.15)', borderRadius: 10,
            padding: '16px 18px', fontSize: 14, lineHeight: 1.8, color: 'var(--txt)',
          }}>
            {brief.brief}
          </div>
          {ts && <p style={{ fontSize: 11, color: 'var(--txt3)', margin: 0 }}>Generated {ts} · Claude Haiku · Refreshes every 30 min</p>}
        </div>
      )}
    </Card>
  );
}

/* ── coinbase card ───────────────────────────────────────────────── */
const CB_IDS = { BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', USDC: null, USDT: null, DAI: null, GUSD: null };

function CoinbaseCard({ holdings, loading, error, prices, onRefresh }) {
  const getUsd = (currency) => {
    if (['USDC','USDT','DAI','GUSD','USDB','BUSD'].includes(currency)) return 1;
    const id = CB_IDS[currency];
    return id ? prices.crypto[id]?.usd ?? null : null;
  };

  const rows = (holdings || []).map(h => ({
    ...h, usdPx: getUsd(h.currency),
    usdVal: getUsd(h.currency) != null ? h.balance * getUsd(h.currency) : null,
  }));
  const totalUsd = rows.reduce((s, r) => s + (r.usdVal ?? 0), 0);

  return (
    <Card style={{ padding: 22, display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title="Coinbase Portfolio"
        badge={holdings && !error ? 'LIVE' : undefined}
        right={totalUsd > 0 ? (
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--teal)' }}>
            ${totalUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </span>
        ) : (
          <button onClick={onRefresh} style={{ fontSize: 11, color: 'var(--txt3)', background: 'none', border: 'none', cursor: 'pointer' }}>↻ Retry</button>
        )}
      />
      {loading && <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--txt2)', fontSize: 13 }}>⟳ Connecting to Coinbase…</div>}
      {error && !loading && (
        <div style={{ background: 'rgba(255,69,96,0.07)', border: '1px solid rgba(255,69,96,0.2)', borderRadius: 8, padding: '12px', fontSize: 12, color: '#ff8fa0' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      {!loading && !error && rows.length === 0 && (
        <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--txt2)', fontSize: 13 }}>No balances found.</div>
      )}
      {!loading && !error && rows.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {rows.map(h => (
            <div key={h.currency} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 11px', borderRadius: 8, background: 'var(--card2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', background: 'rgba(20,188,189,0.14)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 800, color: 'var(--teal)', flexShrink: 0,
                }}>{h.currency.slice(0, 3)}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{h.currency}</div>
                  {h.hold > 0 && <div style={{ fontSize: 10, color: 'var(--txt3)' }}>{h.hold.toFixed(4)} held</div>}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>
                  {h.balance < 0.0001 ? h.balance.toExponential(2) : h.balance < 100 ? h.balance.toFixed(4) : h.balance.toFixed(2)}
                </div>
                {h.usdVal != null && <div style={{ fontSize: 11, color: 'var(--txt2)' }}>${h.usdVal.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ── wallet card ─────────────────────────────────────────────────── */
function WalletCard({ wallet, loading, onConnect, onDisconnect, ethPrice }) {
  const usd = wallet?.balance != null && ethPrice ? wallet.balance * ethPrice : null;
  return (
    <Card style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <CardHeader title="Wallet Intelligence" />
      {!wallet && !loading && (
        <>
          <div style={{
            background: 'rgba(20,188,189,0.06)', border: '1px solid rgba(20,188,189,0.14)',
            borderRadius: 8, padding: '10px 12px', fontSize: 12, color: 'var(--txt2)', lineHeight: 1.6,
          }}>
            🔒 Read-only. No seed phrases or private keys requested — ever.
          </div>
          <button onClick={onConnect} style={{
            padding: '10px', borderRadius: 9, border: 'none',
            background: 'var(--teal)', color: '#040d14', fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}>Connect MetaMask</button>
          <p style={{ fontSize: 11, color: 'var(--txt3)', textAlign: 'center', margin: 0 }}>Browser extension required</p>
        </>
      )}
      {loading && <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--txt2)', fontSize: 13 }}>⟳ Connecting…</div>}
      {wallet && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div style={{ padding: '9px 11px', borderRadius: 8, background: 'var(--card2)' }}>
              <div style={{ fontSize: 10, color: 'var(--txt3)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '.05em' }}>Address</div>
              <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--txt)' }}>{wallet.address.slice(0, 10)}…{wallet.address.slice(-8)}</div>
            </div>
            <div style={{ padding: '9px 11px', borderRadius: 8, background: 'var(--card2)' }}>
              <div style={{ fontSize: 10, color: 'var(--txt3)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '.05em' }}>ETH Balance</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--txt)' }}>
                {wallet.balance != null ? `${wallet.balance.toFixed(4)} ETH` : '—'}
              </div>
              {usd != null && <div style={{ fontSize: 12, color: 'var(--txt2)' }}>${usd.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>}
            </div>
          </div>
          <button onClick={onDisconnect} style={{
            padding: '7px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
            background: 'none', color: 'var(--txt3)', fontSize: 12, cursor: 'pointer', marginTop: 4,
          }}>Disconnect</button>
        </>
      )}
    </Card>
  );
}

/* ── E*TRADE card ────────────────────────────────────────────────── */
function ETradeCard({ step, authData, pin, onSetPin, onConnect, onVerify, onDisconnect, portfolio, loading, error }) {
  return (
    <Card style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <CardHeader title="E*TRADE Portfolio" badge={step === 'done' ? 'LIVE' : undefined} />
      {error && (
        <div style={{ background: 'rgba(255,69,96,0.07)', border: '1px solid rgba(255,69,96,0.2)', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#ff8fa0' }}>
          {error}
        </div>
      )}
      {step === 'idle' && (
        <>
          <p style={{ fontSize: 13, color: 'var(--txt2)', lineHeight: 1.65, margin: 0 }}>
            Connect your E*TRADE brokerage for live portfolio data. Authorized read-only via OAuth — no password stored.
          </p>
          <button onClick={onConnect} style={{
            padding: '10px', borderRadius: 9,
            border: '1px solid rgba(20,188,189,0.3)',
            background: 'rgba(20,188,189,0.12)', color: 'var(--teal)', fontWeight: 700,
            fontSize: 13, cursor: 'pointer',
          }}>Connect E*TRADE</button>
        </>
      )}
      {step === 'loading' && (
        <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--txt2)', fontSize: 13 }}>⟳ Requesting authorization…</div>
      )}
      {step === 'authorize' && authData && (
        <>
          <div style={{ background: 'rgba(20,188,189,0.06)', border: '1px solid rgba(20,188,189,0.15)', borderRadius: 8, padding: '11px 12px', fontSize: 12, color: 'var(--txt2)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--txt)' }}>Step 1:</strong> Click below, log in to E*TRADE, and copy the PIN you receive.
          </div>
          <a href={authData.authUrl} target="_blank" rel="noopener noreferrer" style={{
            display: 'block', textAlign: 'center', padding: '9px', borderRadius: 8,
            background: 'rgba(20,188,189,0.12)', color: 'var(--teal)', fontWeight: 600,
            fontSize: 13, textDecoration: 'none', border: '1px solid rgba(20,188,189,0.3)',
          }}>Open E*TRADE Authorization ↗</a>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div style={{ fontSize: 12, color: 'var(--txt2)', fontWeight: 600 }}>Step 2: Enter your PIN</div>
            <input
              value={pin} onChange={e => onSetPin(e.target.value)}
              placeholder="Enter PIN from E*TRADE"
              style={{ background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 11px', color: 'var(--txt)', fontSize: 13, outline: 'none' }}
            />
            <button onClick={onVerify} disabled={!pin} style={{
              padding: '8px', borderRadius: 8, border: 'none',
              background: pin ? 'var(--teal)' : 'var(--card2)',
              color: pin ? '#040d14' : 'var(--txt3)',
              fontWeight: 700, fontSize: 13, cursor: pin ? 'pointer' : 'not-allowed',
            }}>Verify PIN</button>
          </div>
        </>
      )}
      {step === 'verifying' && (
        <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--txt2)', fontSize: 13 }}>⟳ Verifying PIN…</div>
      )}
      {step === 'done' && (
        <>
          {loading && <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--txt2)', fontSize: 13 }}>⟳ Loading portfolio…</div>}
          {!loading && portfolio && portfolio.length === 0 && (
            <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--txt2)', fontSize: 13 }}>No positions found.</div>
          )}
          {!loading && portfolio && portfolio.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
              {portfolio.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, background: 'var(--card2)' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{p.symbol}</div>
                    <div style={{ fontSize: 10, color: 'var(--txt3)' }}>×{p.qty}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>${(p.marketValue ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
                    {p.totalGain != null && (
                      <div style={{ fontSize: 11, color: pctColor(p.totalGain) }}>{p.totalGain >= 0 ? '+' : ''}${Math.abs(p.totalGain ?? 0).toFixed(0)}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <button onClick={onDisconnect} style={{ padding: '7px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: 'var(--txt3)', fontSize: 12, cursor: 'pointer', marginTop: 4 }}>
            Disconnect
          </button>
        </>
      )}
    </Card>
  );
}

/* ── live alerts ─────────────────────────────────────────────────── */
function computeAlerts(prices, cbHoldings) {
  const alerts = [];
  const btc = prices.crypto.bitcoin?.usd_24h_change;
  const eth = prices.crypto.ethereum?.usd_24h_change;
  const nvda = prices.stocks.NVDA?.changePercent;
  const spy  = prices.stocks.SPY?.changePercent;

  if (btc != null) {
    if (btc >= 5)  alerts.push({ type: 'Opportunity', sev: 'green', text: `BTC +${btc.toFixed(1)}% today — risk-on momentum signal` });
    if (btc <= -5) alerts.push({ type: 'Risk', sev: 'red', text: `BTC ${btc.toFixed(1)}% today — risk-off signal, watch altcoin follow-through` });
  }
  if (eth != null && Math.abs(eth) >= 5)
    alerts.push({ type: eth > 0 ? 'Opportunity' : 'Risk', sev: eth > 0 ? 'green' : 'red', text: `ETH ${eth > 0 ? '+' : ''}${eth.toFixed(1)}% — altcoin market ${eth > 0 ? 'strengthening' : 'weakening'}` });
  if (nvda != null && Math.abs(nvda) >= 3)
    alerts.push({ type: nvda > 0 ? 'Opportunity' : 'Risk', sev: nvda > 0 ? 'green' : 'yellow', text: `NVDA ${nvda > 0 ? '+' : ''}${nvda.toFixed(1)}% — AI infrastructure narrative ${nvda > 0 ? 'strengthening' : 'under pressure'}` });
  if (btc != null && spy != null && btc < -3 && spy < -1)
    alerts.push({ type: 'Risk', sev: 'red', text: 'Crypto + equities both declining — broad risk-off environment' });
  if (btc != null && spy != null && btc > 3 && spy > 1)
    alerts.push({ type: 'Opportunity', sev: 'green', text: 'Crypto + equities both rising — coordinated risk-on phase' });

  if (cbHoldings && cbHoldings.length > 1) {
    const tot = cbHoldings.reduce((s, h) => s + h.balance, 0);
    const pct = tot > 0 ? (cbHoldings[0].balance / tot) * 100 : 0;
    if (pct >= 65)
      alerts.push({ type: 'Concentration', sev: 'yellow', text: `${cbHoldings[0].currency} is ${pct.toFixed(0)}% of Coinbase holdings — high concentration risk` });
  }

  if (!alerts.length)
    alerts.push({ type: 'Status', sev: 'neutral', text: 'Markets calm — no active alerts at this time' });

  return alerts;
}

const SEV_STYLE = {
  red:     { bg: 'rgba(255,69,96,0.07)',  border: 'rgba(255,69,96,0.2)',  label: '#ff8fa0' },
  green:   { bg: 'rgba(0,211,149,0.07)',  border: 'rgba(0,211,149,0.2)',  label: 'var(--green)' },
  yellow:  { bg: 'rgba(251,191,36,0.07)', border: 'rgba(251,191,36,0.2)', label: '#fde68a' },
  neutral: { bg: 'rgba(20,188,189,0.05)', border: 'rgba(20,188,189,0.15)', label: 'var(--txt2)' },
};

function AlertsCard({ prices, cbHoldings }) {
  const alerts = computeAlerts(prices, cbHoldings);
  return (
    <Card style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <CardHeader title="Live Alerts" />
      {alerts.map((a, i) => {
        const s = SEV_STYLE[a.sev] || SEV_STYLE.neutral;
        return (
          <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '9px 12px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: s.label, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>{a.type}</div>
            <div style={{ fontSize: 12, color: 'var(--txt)', lineHeight: 1.55 }}>{a.text}</div>
          </div>
        );
      })}
    </Card>
  );
}

/* ── quick nav ───────────────────────────────────────────────────── */
function QuickNav({ onTabChange, prices }) {
  const tabs = [
    { id: 'crypto',   icon: '₿',  label: 'Crypto',   stat: prices.crypto.bitcoin?.usd ? `BTC $${prices.crypto.bitcoin.usd.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : 'Live prices' },
    { id: 'stocks',   icon: '📈', label: 'Stocks',   stat: prices.stocks.NVDA?.price ? `NVDA $${prices.stocks.NVDA.price.toFixed(2)}` : 'Watchlist + charts' },
    { id: 'defai',    icon: '🤖', label: 'DeFAI',    stat: 'AI token scanner' },
    { id: 'risk',     icon: '⚖️', label: 'Risk',     stat: 'Portfolio analysis' },
    { id: 'research', icon: '🧠', label: 'Research', stat: 'AI research notes' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginTop: 18 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onTabChange(t.id)} style={{
          padding: '14px 12px', borderRadius: '0.85rem',
          border: '1px solid rgba(255,255,255,0.07)', background: 'var(--card)',
          cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 5,
          transition: 'border-color .15s',
        }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(20,188,189,0.35)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
        >
          <span style={{ fontSize: 18 }}>{t.icon}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)' }}>{t.label}</span>
          <span style={{ fontSize: 11, color: 'var(--txt3)' }}>{t.stat}</span>
        </button>
      ))}
    </div>
  );
}

/* ── main export ─────────────────────────────────────────────────── */
export default function HubView({ theme, onTabChange }) {
  const [prices, setPrices]         = useState({ crypto: {}, stocks: {} });
  const [brief, setBrief]           = useState(null);
  const [briefLoading, setBL]       = useState(false);
  const [cbHoldings, setCbH]        = useState(null);
  const [cbLoading, setCbL]         = useState(true);
  const [cbError, setCbErr]         = useState(null);
  const [wallet, setWallet]         = useState(null);
  const [walletLoading, setWL]      = useState(false);
  const [etStep, setEtStep]         = useState('idle');
  const [etAuthData, setEtAuth]     = useState(null);
  const [etPin, setEtPin]           = useState('');
  const [etPortfolio, setEtPort]    = useState(null);
  const [etLoading, setEtL]         = useState(false);
  const [etError, setEtErr]         = useState(null);

  const loadPrices = useCallback(async () => {
    const [cr, sr] = await Promise.allSettled([
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true').then(r => r.json()),
      fetch('/api/stocks?symbols=SPY,QQQ,NVDA,COIN,MSFT').then(r => r.json()),
    ]);
    setPrices(prev => {
      const next = { ...prev };
      if (cr.status === 'fulfilled') next.crypto = cr.value;
      if (sr.status === 'fulfilled') {
        const map = {};
        (sr.value?.quoteResponse?.result || []).forEach(q => {
          map[q.symbol] = { price: q.regularMarketPrice, changePercent: q.regularMarketChangePercent };
        });
        next.stocks = map;
      }
      return next;
    });
  }, []);

  const loadCoinbase = useCallback(async () => {
    setCbL(true); setCbErr(null);
    try {
      const r = await fetch('/api/coinbase-portfolio');
      const d = await r.json();
      if (d.error) setCbErr(d.error);
      else setCbH(d.holdings || []);
    } catch { setCbErr('Network error'); }
    finally { setCbL(false); }
  }, []);

  const loadEtradePortfolio = useCallback(async (token, secret) => {
    setEtL(true);
    try {
      const r = await fetch('/api/etrade-portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, secret }),
      });
      const d = await r.json();
      if (d.error) { setEtErr(d.error); setEtStep('idle'); localStorage.removeItem('nalu_etrade_token'); }
      else setEtPort(d.positions || []);
    } catch { setEtStep('idle'); localStorage.removeItem('nalu_etrade_token'); }
    finally { setEtL(false); }
  }, []);

  useEffect(() => {
    // restore wallet addr display
    const addr = localStorage.getItem('nalu_wallet_addr');
    if (addr) setWallet({ address: addr, balance: null });

    // restore E*TRADE token
    try {
      const saved = JSON.parse(localStorage.getItem('nalu_etrade_token') || 'null');
      if (saved && Date.now() < saved.expiry) {
        setEtStep('done');
        loadEtradePortfolio(saved.token, saved.secret);
      } else if (saved) {
        localStorage.removeItem('nalu_etrade_token');
      }
    } catch { localStorage.removeItem('nalu_etrade_token'); }

    loadPrices();
    loadCoinbase();
    const t1 = setInterval(loadPrices, 60000);
    const t2 = setInterval(loadCoinbase, 120000);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, [loadPrices, loadCoinbase, loadEtradePortfolio]);

  const generateBrief = useCallback(async () => {
    setBL(true);
    try {
      const r = await fetch('/api/market-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crypto: prices.crypto, stocks: prices.stocks }),
      });
      const d = await r.json();
      if (d.error) console.error('Brief error:', d.error);
      else setBrief(d);
    } catch (e) { console.error('Brief fetch failed:', e); }
    finally { setBL(false); }
  }, [prices]);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) { alert('MetaMask not detected. Please install the browser extension.'); return; }
    setWL(true);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address  = accounts[0];
      const hex      = await window.ethereum.request({ method: 'eth_getBalance', params: [address, 'latest'] });
      const balance  = parseInt(hex, 16) / 1e18;
      setWallet({ address, balance });
      localStorage.setItem('nalu_wallet_addr', address);
    } catch (e) { alert(e.message || 'Wallet connection failed'); }
    finally { setWL(false); }
  }, []);

  const disconnectWallet = useCallback(() => {
    setWallet(null);
    localStorage.removeItem('nalu_wallet_addr');
  }, []);

  const startEtrade = useCallback(async () => {
    setEtStep('loading'); setEtErr(null);
    try {
      const r = await fetch('/api/etrade-auth');
      const d = await r.json();
      if (d.error) { setEtErr(d.error); setEtStep('idle'); return; }
      setEtAuth(d);
      setEtStep('authorize');
    } catch { setEtErr('Network error'); setEtStep('idle'); }
  }, []);

  const verifyEtrade = useCallback(async () => {
    if (!etPin || !etAuthData) return;
    setEtStep('verifying'); setEtErr(null);
    try {
      const r = await fetch('/api/etrade-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oauthToken: etAuthData.oauthToken, oauthTokenSecret: etAuthData.oauthTokenSecret, pin: etPin }),
      });
      const d = await r.json();
      if (d.error) { setEtErr(d.error); setEtStep('authorize'); return; }
      localStorage.setItem('nalu_etrade_token', JSON.stringify({ token: d.token, secret: d.secret, expiry: Date.now() + 23 * 3600 * 1000 }));
      setEtStep('done');
      loadEtradePortfolio(d.token, d.secret);
    } catch { setEtErr('Network error'); setEtStep('authorize'); }
  }, [etPin, etAuthData, loadEtradePortfolio]);

  const disconnectEtrade = useCallback(() => {
    localStorage.removeItem('nalu_etrade_token');
    setEtStep('idle'); setEtPort(null); setEtAuth(null); setEtPin(''); setEtErr(null);
  }, []);

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 24px 60px' }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--txt)', margin: '0 0 3px' }}>Nalu Intelligence Hub</h1>
        <p style={{ fontSize: 13, color: 'var(--txt2)', margin: 0 }}>Live market data · AI research briefs · Connected portfolios</p>
      </div>

      <MarketStrip prices={prices} />

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 14, marginBottom: 14 }}>
        <AIBriefCard brief={brief} loading={briefLoading} onGenerate={generateBrief} />
        <CoinbaseCard holdings={cbHoldings} loading={cbLoading} error={cbError} prices={prices} onRefresh={loadCoinbase} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
        <WalletCard
          wallet={wallet} loading={walletLoading}
          onConnect={connectWallet} onDisconnect={disconnectWallet}
          ethPrice={prices.crypto.ethereum?.usd}
        />
        <ETradeCard
          step={etStep} authData={etAuthData} pin={etPin} onSetPin={setEtPin}
          onConnect={startEtrade} onVerify={verifyEtrade} onDisconnect={disconnectEtrade}
          portfolio={etPortfolio} loading={etLoading} error={etError}
        />
        <AlertsCard prices={prices} cbHoldings={cbHoldings} />
      </div>

      <QuickNav onTabChange={onTabChange || (() => {})} prices={prices} />
    </div>
  );
}
