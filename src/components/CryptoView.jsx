import React, { useState, useEffect, useRef, useCallback } from 'react';
import TVChart from './TVChart.jsx';
import {
  fetchGlobalStats, fetchFearGreed, fetchMarketData, fetchTopCoins,
  fetchCoinDetail, fetchOrderBook, fetchRecentTrades, fetchSimplePrices,
  fetchNews, createBinanceWS,
} from '../lib/api.js';
import {
  fmt, fmtCompact, fmtPct, pctClass, timeAgo,
  generateSparkline, sentimentColor, sentimentLabel, decimalPlaces,
} from '../lib/utils.js';
import {
  CFG, CG_TO_BINANCE, CG_TO_TV, DEFAULT_WATCHLIST, NEWS_SUBREDDITS,
} from '../lib/constants.js';

// ── Ticker Bar ──────────────────────────────────────────────────────
function TickerBar({ coins }) {
  if (!coins.length) return null;
  const items = coins.slice(0, 30).map(c => {
    const chg = c.price_change_percentage_24h;
    const p = c.current_price;
    return (
      <div key={c.id} className="ticker-item">
        <span className="ticker-sym">{c.symbol.toUpperCase()}</span>
        <span className="ticker-price">${fmt(p, decimalPlaces(p))}</span>
        <span className={`ticker-chg ${chg >= 0 ? 'up' : 'dn'}`}>{fmtPct(chg)}</span>
      </div>
    );
  });
  return (
    <div className="ticker-bar">
      <div className="ticker-track">
        <div className="ticker-content">{items}</div>
        <div className="ticker-content" aria-hidden="true">{items}</div>
      </div>
    </div>
  );
}

// ── Global Stats ────────────────────────────────────────────────────
function GlobalStatsBar({ stats, fg }) {
  if (!stats) return <div style={{ height: 38, background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }} />;
  const chg = stats.market_cap_change_percentage_24h_usd;
  const fgVal = fg?.value || 50;
  const fgColor = sentimentColor(fgVal);
  const fgFill = `linear-gradient(90deg, ${fgColor} ${fgVal}%, var(--card2) ${fgVal}%)`;
  return (
    <div className="global-stats">
      <div className="gstat">
        <span className="gstat-label">Global MCap</span>
        <span className="gstat-val">{fmtCompact(stats.total_market_cap?.usd)}</span>
        <span className={`gstat-chg ${pctClass(chg)}`}>{fmtPct(chg)}</span>
      </div>
      <div className="gstat-sep" />
      <div className="gstat">
        <span className="gstat-label">24h Volume</span>
        <span className="gstat-val">{fmtCompact(stats.total_volume?.usd)}</span>
      </div>
      <div className="gstat-sep" />
      <div className="gstat">
        <span className="gstat-label">BTC Dom</span>
        <span className="gstat-val">{stats.market_cap_percentage?.btc?.toFixed(1)}%</span>
      </div>
      <div className="gstat-sep" />
      <div className="gstat">
        <span className="gstat-label">ETH Dom</span>
        <span className="gstat-val">{stats.market_cap_percentage?.eth?.toFixed(1)}%</span>
      </div>
      <div className="gstat-sep" />
      <div className="gstat">
        <span className="gstat-label">Fear & Greed</span>
        <div className="fg-wrap">
          <div className="fg-meter"><div className="fg-fill" style={{ width: fgVal + '%', background: fgColor }} /></div>
          <span className="fg-val" style={{ color: fgColor }}>{fgVal}</span>
          <span className="fg-text">{fg?.label}</span>
        </div>
      </div>
      <div className="gstat-sep" />
      <div className="gstat">
        <span className="gstat-label">Active Coins</span>
        <span className="gstat-val">{stats.active_cryptocurrencies?.toLocaleString()}</span>
      </div>
      <div className="gstat-sep" />
      <div className="gstat">
        <span className="gstat-label">Markets</span>
        <span className="gstat-val">{stats.markets?.toLocaleString()}</span>
      </div>
    </div>
  );
}

// ── Watchlist ───────────────────────────────────────────────────────
function CryptoWatchlist({ watchlist, marketMap, selectedCoin, onSelect }) {
  return (
    <div className="watchlist-list">
      {watchlist.map(id => {
        const c = marketMap[id];
        if (!c) return null;
        const chg = c.price_change_percentage_24h;
        const p = c.current_price;
        return (
          <div key={id} className={`wl-item${id === selectedCoin ? ' active' : ''}`} onClick={() => onSelect(id)}>
            <div className="wl-left">
              <img className="wl-img" src={c.image} alt={c.symbol} loading="lazy" />
              <div>
                <div className="wl-sym">{c.symbol.toUpperCase()}</div>
                <div className="wl-name">{c.name}</div>
              </div>
            </div>
            <div className="wl-right">
              <div className="wl-price">${fmt(p, decimalPlaces(p))}</div>
              <div className={`wl-chg ${pctClass(chg)}`}>{fmtPct(chg)}</div>
            </div>
            <div className="wl-spark" dangerouslySetInnerHTML={{ __html: generateSparkline(c.sparkline_in_7d?.price, chg >= 0) }} />
          </div>
        );
      })}
    </div>
  );
}

// ── Movers ──────────────────────────────────────────────────────────
function MoversPanel({ data, onSelect }) {
  const [activeTab, setActiveTab] = useState('gainers');
  const sorted = [...data].sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0));
  const gainers  = sorted.filter(c => (c.price_change_percentage_24h || 0) > 0).slice(0, 8);
  const losers   = sorted.filter(c => (c.price_change_percentage_24h || 0) < 0).reverse().slice(0, 8);
  const trending = [...data].sort((a, b) => b.total_volume - a.total_volume).slice(0, 8);
  const list = activeTab === 'gainers' ? gainers : activeTab === 'losers' ? losers : trending;
  return (
    <div className="panel-section">
      <div className="stab-bar">
        {['gainers','losers','trending'].map(t => (
          <button key={t} className={`stab${activeTab === t ? ' active' : ''}`} onClick={() => setActiveTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <div className="mover-list">
        {list.map(c => {
          const chg = c.price_change_percentage_24h;
          return (
            <div key={c.id} className="mover-item" onClick={() => onSelect(c.id)}>
              <div className="mv-left">
                <img className="mv-img" src={c.image} alt={c.symbol} loading="lazy" />
                <div>
                  <div className="mv-sym">{c.symbol.toUpperCase()}</div>
                  <div className="mv-price">${fmt(c.current_price, decimalPlaces(c.current_price))}</div>
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

// ── Coin Header ─────────────────────────────────────────────────────
function CoinHeader({ detail }) {
  if (!detail) return <div style={{ height: 80, background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }} />;
  const md = detail.market_data;
  const price = md.current_price.usd;
  const chg24 = md.price_change_percentage_24h;
  const sym = detail.symbol.toUpperCase();
  return (
    <div className="coin-hdr">
      <div className="coin-id">
        <div className="coin-icon-wrap"><img src={detail.image.small} alt={detail.name} /></div>
        <div>
          <div className="coin-name-txt">{detail.name}</div>
          <div className="coin-pair">{sym} / USDT</div>
        </div>
        <div className="price-block">
          <div className="big-price">${fmt(price, decimalPlaces(price))}</div>
          <div className={`price-chg ${pctClass(chg24)}`}>{fmtPct(chg24)}</div>
        </div>
      </div>
      <div className="coin-metrics">
        {[
          ['24h High',     '$' + fmt(md.high_24h.usd, 2)],
          ['24h Low',      '$' + fmt(md.low_24h.usd, 2)],
          ['Volume',       fmtCompact(md.total_volume.usd)],
          ['Market Cap',   fmtCompact(md.market_cap.usd)],
          ['Rank',         '#' + detail.market_cap_rank],
          ['Circulating',  md.circulating_supply ? fmt(md.circulating_supply, 0) + ' ' + sym : '—'],
          ['ATH',          '$' + fmt(md.ath.usd, 2)],
          ['ATH Chg',      fmtPct(md.ath_change_percentage.usd)],
        ].map(([label, val]) => (
          <div key={label} className="cm">
            <span>{label}</span>
            <b>{val}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── TA Bar ──────────────────────────────────────────────────────────
function TABar({ detail }) {
  if (!detail) return null;
  const md = detail.market_data;
  const chg24 = md.price_change_percentage_24h || 0;
  const chg7d  = md.price_change_percentage_7d_in_currency?.usd || 0;
  const chg1h  = md.price_change_percentage_1h_in_currency?.usd;
  const chg30d = md.price_change_percentage_30d_in_currency?.usd;
  let rsi = 50 + chg24 * 1.8 + chg7d * 0.5;
  rsi = Math.max(10, Math.min(90, rsi));
  const macdBull = chg24 > 0 && chg7d > 0;
  const support  = '$' + fmt(md.low_24h.usd * 0.98, 2);
  const resist   = '$' + fmt(md.high_24h.usd * 1.02, 2);
  const rsiSig   = rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral';
  const rsiCls   = rsi > 70 ? 'sell' : rsi < 30 ? 'buy' : 'neutral';
  return (
    <div className="ta-bar">
      <div className="ta-item">
        <span className="ta-label">RSI (14)</span>
        <span className="ta-val">{rsi.toFixed(1)}</span>
        <span className={`ta-signal ${rsiCls}`}>{rsiSig}</span>
      </div>
      <div className="ta-sep" />
      <div className="ta-item">
        <span className="ta-label">MACD</span>
        <span className={`ta-val ${macdBull ? 'green' : 'red'}`}>{macdBull ? '▲ Bullish' : '▼ Bearish'}</span>
        <span className={`ta-signal ${macdBull ? 'buy' : 'sell'}`}>{macdBull ? 'Buy' : 'Sell'}</span>
      </div>
      <div className="ta-sep" />
      <div className="ta-item"><span className="ta-label">Support</span><span className="ta-val green">{support}</span></div>
      <div className="ta-sep" />
      <div className="ta-item"><span className="ta-label">Resistance</span><span className="ta-val red">{resist}</span></div>
      <div className="ta-sep" />
      {chg1h != null && <><div className="ta-item"><span className="ta-label">1h Chg</span><span className={`ta-val ${pctClass(chg1h)}`}>{fmtPct(chg1h)}</span></div><div className="ta-sep" /></>}
      {chg7d != null && <><div className="ta-item"><span className="ta-label">7d Chg</span><span className={`ta-val ${pctClass(chg7d)}`}>{fmtPct(chg7d)}</span></div><div className="ta-sep" /></>}
      {chg30d != null && <div className="ta-item"><span className="ta-label">30d Chg</span><span className={`ta-val ${pctClass(chg30d)}`}>{fmtPct(chg30d)}</span></div>}
    </div>
  );
}

// ── Order Book ──────────────────────────────────────────────────────
function OrderBook({ bids, asks, midPrice }) {
  const topAsks = (asks || []).slice(0, 10).reverse();
  const topBids = (bids || []).slice(0, 10);
  const bidMax  = topBids.reduce((s, r) => s + parseFloat(r[1]), 0) || 1;
  const askMax  = topAsks.reduce((s, r) => s + parseFloat(r[1]), 0) || 1;
  const renderRows = (rows, isBid, max) => rows.map((r, i) => {
    const price = parseFloat(r[0]);
    const size  = parseFloat(r[1]);
    const total = price * size;
    const pct   = Math.min(100, (size / max) * 100);
    const dec   = decimalPlaces(price);
    return (
      <div key={i} className={`ob-row ${isBid ? 'bid-row' : 'ask-row'}`}>
        <span>{fmt(price, dec)}</span>
        <span>{size < 0.001 ? size.toFixed(6) : fmt(size, 4)}</span>
        <span>{fmtCompact(total)}</span>
        <div className="ob-depth-bar" style={{ width: pct + '%' }} />
      </div>
    );
  });

  const spread = asks[0] && bids[0] ? (parseFloat(asks[0][0]) - parseFloat(bids[0][0])).toFixed(2) : '—';
  const mid    = midPrice ? '$' + fmt(midPrice, decimalPlaces(midPrice)) : '—';

  return (
    <div className="panel-section ob-section">
      <div className="panel-hdr">
        <span>Order Book</span>
        <span className="spread-label">Spread: <b>${spread}</b></span>
      </div>
      <div className="ob-cols-hdr"><span>Price (USD)</span><span>Size</span><span>Total</span></div>
      {renderRows(topAsks, false, askMax)}
      <div className="ob-midprice"><span>{mid}</span></div>
      {renderRows(topBids, true, bidMax)}
    </div>
  );
}

// ── Recent Trades ───────────────────────────────────────────────────
function RecentTrades({ trades }) {
  return (
    <div className="panel-section trades-section">
      <div className="panel-hdr"><span>Recent Trades</span></div>
      <div className="trades-hdr"><span>Price</span><span>Size</span><span>Time</span></div>
      <div className="trades-list">
        {trades.map((t, i) => {
          const isBuy = t.isBuyerMaker === false;
          const price = parseFloat(t.price || t.p || 0);
          const qty   = parseFloat(t.qty || t.q || 0);
          const ts = t.time
            ? (() => { const d = new Date(t.time); return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0') + ':' + d.getSeconds().toString().padStart(2,'0'); })()
            : '—';
          return (
            <div key={i} className={`trade-row ${isBuy ? 'buy' : 'sell'}`}>
              <span>{fmt(price, decimalPlaces(price))}</span>
              <span>{qty.toFixed(4)}</span>
              <span>{ts}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Funding Rate (simulated) ────────────────────────────────────────
function FundingInfo({ price }) {
  const rate   = ((Math.random() * 0.08) - 0.04).toFixed(4);
  const isPos  = parseFloat(rate) >= 0;
  const h = Math.floor(Math.random() * 8);
  const m = Math.floor(Math.random() * 60);
  const oi = price * (Math.random() * 50000 + 30000);
  const ratio = (0.9 + Math.random() * 0.2).toFixed(2);
  return (
    <div className="panel-section">
      <div className="panel-hdr"><span>Derivatives</span></div>
      <div className="funding-grid">
        <div className="funding-item"><span>Funding Rate</span><b className={isPos ? 'green' : 'red'}>{rate}%</b></div>
        <div className="funding-item"><span>Next Funding</span><b>{h}h {m}m</b></div>
        <div className="funding-item"><span>Open Interest</span><b>{fmtCompact(oi)}</b></div>
        <div className="funding-item"><span>L/S Ratio</span><b className={parseFloat(ratio) > 1 ? 'green' : 'red'}>{ratio}</b></div>
      </div>
    </div>
  );
}

// ── Portfolio ───────────────────────────────────────────────────────
function PortfolioPanel({ portfolio, prices, marketMap, onRemove, onAdd }) {
  let totalVal = 0, totalCost = 0, bestPct = -Infinity, bestSym = '—';
  const rows = portfolio.map((p, idx) => {
    const price = prices[p.id] || 0;
    const val   = price * p.qty;
    const cost  = p.entry * p.qty;
    const pnl   = val - cost;
    const pct   = cost ? (pnl / cost) * 100 : 0;
    totalVal  += val;
    totalCost += cost;
    if (pct > bestPct) { bestPct = pct; bestSym = p.id.toUpperCase(); }
    const img = marketMap[p.id]?.image || '';
    return { p, idx, price, val, cost, pnl, pct, img };
  });
  const totalPnl = totalVal - totalCost;
  const totalPct = totalCost ? (totalPnl / totalCost) * 100 : 0;
  return (
    <div className="bottom-card portfolio-card">
      <div className="bc-hdr">
        <h3>Portfolio</h3>
        <button className="text-btn" onClick={onAdd}>+ Add Position</button>
      </div>
      <div className="pf-summary-row">
        <div className="pf-sum-item"><span>Total Value</span><b>${fmt(totalVal, 2)}</b></div>
        <div className="pf-sum-item"><span>Total P&L</span><b className={pctClass(totalPnl)}>{totalPnl >= 0 ? '+$' : '-$'}{fmt(Math.abs(totalPnl), 2)}</b></div>
        <div className="pf-sum-item"><span>P&L %</span><b className={pctClass(totalPct)}>{fmtPct(totalPct)}</b></div>
        <div className="pf-sum-item"><span>Best</span><b>{bestSym !== '—' && bestPct > -Infinity ? `${bestSym} ${fmtPct(bestPct)}` : '—'}</b></div>
      </div>
      <div className="pf-holdings">
        {!rows.length
          ? <p className="empty-msg">Add positions to track P&L in real time.</p>
          : rows.map(({ p, idx, img, val, pnl, pct }) => (
              <div key={idx} className="pf-row">
                {img ? <img className="pf-coin-img" src={img} alt="" loading="lazy" /> : <div className="pf-coin-img" />}
                <div className="pf-coin-info">
                  <div className="sym">{p.id.toUpperCase()}</div>
                  <div className="qty">{p.qty} @ ${fmt(p.entry, 2)}</div>
                </div>
                <div className="pf-value">${fmt(val, 2)}</div>
                <div className={`pf-pnl ${pctClass(pnl)}`}>{pnl >= 0 ? '+' : '-'}${fmt(Math.abs(pnl), 2)}<br /><small>{fmtPct(pct)}</small></div>
                <button className="pf-del" onClick={() => onRemove(idx)}>✕</button>
              </div>
            ))
        }
      </div>
    </div>
  );
}

// ── Market Table ────────────────────────────────────────────────────
function MarketTable({ coins, onSelect }) {
  const [sort, setSort] = useState('market_cap');
  const sorted = [...coins].sort((a, b) => (b[sort] || 0) - (a[sort] || 0));
  return (
    <div className="bottom-card market-card" style={{ flex: 2 }}>
      <div className="bc-hdr">
        <h3>Market Overview</h3>
        <div className="sort-tabs">
          {[['market_cap','Cap'],['total_volume','Volume'],['price_change_percentage_24h','24h%']].map(([k,l]) => (
            <button key={k} className={`sort-btn${sort === k ? ' active' : ''}`} onClick={() => setSort(k)}>{l}</button>
          ))}
        </div>
      </div>
      <div className="tbl-wrap">
        <table className="mkt-tbl">
          <thead>
            <tr><th>#</th><th>Coin</th><th>Price</th><th>1h%</th><th>24h%</th><th>7d%</th><th>Volume</th><th>MCap</th><th>7d</th></tr>
          </thead>
          <tbody>
            {sorted.slice(0, 50).map((c, i) => {
              const p   = c.current_price;
              const c1  = c.price_change_percentage_1h_in_currency;
              const c24 = c.price_change_percentage_24h;
              const c7  = c.price_change_percentage_7d_in_currency;
              return (
                <tr key={c.id} onClick={() => onSelect(c.id)} style={{ cursor: 'pointer' }}>
                  <td className="rank-cell">{c.market_cap_rank || i + 1}</td>
                  <td>
                    <div className="coin-cell">
                      <img src={c.image} alt={c.symbol} loading="lazy" />
                      <div><div className="sym">{c.symbol.toUpperCase()}</div><div className="nm">{c.name}</div></div>
                    </div>
                  </td>
                  <td className="mono">${fmt(p, decimalPlaces(p))}</td>
                  <td className={pctClass(c1)}>{fmtPct(c1)}</td>
                  <td className={pctClass(c24)}>{fmtPct(c24)}</td>
                  <td className={pctClass(c7)}>{fmtPct(c7)}</td>
                  <td className="mono">{fmtCompact(c.total_volume)}</td>
                  <td className="mono">{fmtCompact(c.market_cap)}</td>
                  <td className="spark-cell" dangerouslySetInnerHTML={{ __html: generateSparkline(c.sparkline_in_7d?.price, c24 >= 0, 80, 28) }} />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Sentiment Gauges ────────────────────────────────────────────────
function SentimentGauges({ fg, marketData }) {
  const fgVal = fg?.value || 50;
  const calcScore = (coin) => {
    if (!coin) return 50;
    const c24 = coin.price_change_percentage_24h || 0;
    const c7  = coin.price_change_percentage_7d_in_currency || 0;
    return Math.max(3, Math.min(97, 50 + c24 * 2.5 + c7 * 1.0));
  };
  const btc    = marketData.find(c => c.id === 'bitcoin');
  const eth    = marketData.find(c => c.id === 'ethereum');
  const green  = marketData.filter(c => (c.price_change_percentage_24h || 0) > 0).length;
  const breadth = marketData.length ? Math.round(green / marketData.length * 100) : 50;
  const gauges = [
    { title:'Fear & Greed', val: fgVal, sub: fg?.label || '—' },
    { title:'Bitcoin',      val: calcScore(btc), sub: btc ? fmtPct(btc.price_change_percentage_24h) + ' 24h' : '—' },
    { title:'Ethereum',     val: calcScore(eth), sub: eth ? fmtPct(eth.price_change_percentage_24h) + ' 24h' : '—' },
    { title:'Market Breadth',val: breadth, sub: `${breadth}% of top coins bullish` },
  ];
  return (
    <div className="sentiment-section">
      <div className="snt-hdr">
        <h3>Market Sentiment</h3>
        <span style={{ fontSize: 11, color: 'var(--txt3)' }}>Updated live</span>
      </div>
      <div className="snt-gauges">
        {gauges.map(g => {
          const color = sentimentColor(g.val);
          const label = sentimentLabel(g.val);
          return (
            <div key={g.title} className={`gauge-card ${g.title === 'Fear & Greed' ? 'large' : 'mini'}`}>
              <div className="gauge-title">{g.title}</div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ fontSize: 32, fontWeight: 700, color, fontFamily: 'monospace' }}>{g.val}</div>
                <div style={{ fontSize: 12, color, fontWeight: 600 }}>{label}</div>
              </div>
              <div style={{ width: '100%', background: 'var(--card2)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                <div style={{ width: g.val + '%', height: '100%', background: color, borderRadius: 4 }} />
              </div>
              <div className="gauge-scale"><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div>
              <div style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 2 }}>{g.sub}</div>
            </div>
          );
        })}
      </div>
      <div className="snt-legend">
        {[['#ff4560','Extreme Fear (0-24)'],['#f59e0b','Fear (25-44)'],['#94a3b8','Neutral (45-55)'],['#00d395','Greed (56-75)'],['#14bcbd','Extreme Greed (76-100)']].map(([color, label]) => (
          <span key={label} className="leg-item">
            <span className="leg-dot" style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── News Grid ───────────────────────────────────────────────────────
function NewsGrid({ posts, loading, categories, activeCat, onCatChange, onRefresh }) {
  const fallbackSources = [
    { name:'CryptoSlate',   url:'https://cryptoslate.com/news/',   icon:'🗞' },
    { name:'CoinDesk',      url:'https://www.coindesk.com/',       icon:'📰' },
    { name:'The Block',     url:'https://www.theblock.co/',        icon:'🔗' },
    { name:'Decrypt',       url:'https://decrypt.co/',             icon:'🔓' },
    { name:'Cointelegraph', url:'https://cointelegraph.com/',      icon:'📡' },
  ];
  return (
    <div className="news-section">
      <div className="ns-hdr">
        <h3>News Feed</h3>
        <div className="news-tabs">
          {categories.map(c => (
            <button key={c} className={`ntab${activeCat === c ? ' active' : ''}`} onClick={() => onCatChange(c)}>
              {c || 'Latest'}
            </button>
          ))}
        </div>
        <button className="text-btn" onClick={onRefresh}>↻ Refresh</button>
      </div>
      <div className="news-grid">
        {loading
          ? Array(9).fill(0).map((_, i) => (
              <div key={i} className="news-skeleton"><div className="skeleton-pulse" /></div>
            ))
          : !posts.length
            ? fallbackSources.map(s => (
                <a key={s.name} className="news-card" href={s.url} target="_blank" rel="noopener">
                  <div className="news-img-placeholder">{s.icon}</div>
                  <div className="news-body">
                    <div className="news-source"><span className="news-src">{s.name}</span><span className="news-date">Live Feed</span></div>
                    <div className="news-title">Visit {s.name} for the latest news</div>
                  </div>
                </a>
              ))
            : posts.slice(0, 15).map((p, i) => {
                const preview = p.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, '&');
                const thumb   = p.thumbnail?.startsWith('http') ? p.thumbnail : null;
                const url     = p.url?.startsWith('http') ? p.url : `https://reddit.com${p.permalink}`;
                const upvotes = p.score > 1000 ? (p.score / 1000).toFixed(1) + 'k' : p.score;
                return (
                  <a key={i} className="news-card" href={url} target="_blank" rel="noopener">
                    {preview || thumb
                      ? <img className="news-img" src={preview || thumb} alt="" loading="lazy" onError={e => e.target.style.display='none'} />
                      : <div className="news-img-placeholder">📰</div>
                    }
                    <div className="news-body">
                      <div className="news-source">
                        <span className="news-src">r/{p.subreddit}</span>
                        <span className="news-date">{timeAgo(p.created_utc)}</span>
                      </div>
                      <div className="news-title">{p.title}</div>
                      <p>{p.selftext ? p.selftext.substring(0, 120) + '…' : p.title}</p>
                      <div style={{ display:'flex', gap:10, marginTop:4, fontSize:10, color:'var(--txt3)' }}>
                        <span>▲ {upvotes}</span>
                        <span>💬 {p.num_comments}</span>
                        <span>u/{p.author}</span>
                      </div>
                    </div>
                  </a>
                );
              })
        }
      </div>
    </div>
  );
}

// ── Portfolio Modal ─────────────────────────────────────────────────
function PortfolioModal({ onClose, onSave }) {
  const [coin, setCoin]   = useState('');
  const [qty, setQty]     = useState('');
  const [entry, setEntry] = useState('');
  function handleSave() {
    if (!coin.trim() || !qty || !entry) return;
    onSave({ id: coin.trim().toLowerCase(), qty: parseFloat(qty), entry: parseFloat(entry) });
    onClose();
  }
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-hdr">Add Position <button className="close-modal-btn" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          <div className="form-grp"><label>Coin (CoinGecko ID)</label><input value={coin} onChange={e => setCoin(e.target.value)} placeholder="e.g. bitcoin, ethereum" /></div>
          <div className="form-grp"><label>Quantity</label><input type="number" value={qty} onChange={e => setQty(e.target.value)} placeholder="e.g. 0.5" /></div>
          <div className="form-grp"><label>Entry Price (USD)</label><input type="number" value={entry} onChange={e => setEntry(e.target.value)} placeholder="e.g. 42000" /></div>
          <button className="btn-primary" onClick={handleSave}>Add to Portfolio</button>
        </div>
      </div>
    </div>
  );
}

// ── Alerts Modal ────────────────────────────────────────────────────
function AlertsModal({ alerts, onClose, onAdd, onRemove }) {
  const [coin, setCoin]   = useState('');
  const [type, setType]   = useState('above');
  const [price, setPrice] = useState('');
  function handleSave() {
    if (!coin.trim() || !price) return;
    onAdd({ id: coin.trim().toLowerCase(), type, price: parseFloat(price) });
    setCoin(''); setPrice('');
  }
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-hdr">Price Alerts <button className="close-modal-btn" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          <div className="form-grp"><label>Coin (CoinGecko ID)</label><input value={coin} onChange={e => setCoin(e.target.value)} placeholder="e.g. bitcoin" /></div>
          <div className="form-grp"><label>Condition</label><select value={type} onChange={e => setType(e.target.value)}><option value="above">Price above</option><option value="below">Price below</option></select></div>
          <div className="form-grp"><label>Target Price (USD)</label><input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 50000" /></div>
          <button className="btn-primary" onClick={handleSave}>Set Alert</button>
          <div className="divider" />
          <h4 style={{ fontSize: 12, fontWeight: 600 }}>Active Alerts</h4>
          {!alerts.length
            ? <p style={{ fontSize: 12, color: 'var(--txt3)' }}>No alerts set.</p>
            : alerts.map((a, i) => (
                <div key={i} className="alert-item">
                  <span>{a.id.toUpperCase()} {a.type} ${fmt(a.price, 2)}</span>
                  <span style={{ fontSize: 10, color: a.triggered ? 'var(--green)' : 'var(--txt3)' }}>{a.triggered ? '✓ Triggered' : 'Active'}</span>
                  <button className="alert-del" onClick={() => onRemove(i)}>✕</button>
                </div>
              ))
          }
        </div>
      </div>
    </div>
  );
}

// ── Sim order book (fallback) ───────────────────────────────────────
function simOrderBook(price) {
  const bids = Array.from({ length: 12 }, (_, i) => [String((price * (1 - 0.0003 * (i + 1))).toFixed(2)), String((Math.random() * 2).toFixed(4))]);
  const asks = Array.from({ length: 12 }, (_, i) => [String((price * (1 + 0.0003 * (i + 1))).toFixed(2)), String((Math.random() * 2).toFixed(4))]);
  return { bids, asks };
}

function simTrades(price) {
  const now = Date.now();
  return Array.from({ length: 25 }, (_, i) => ({
    isBuyerMaker: Math.random() > 0.5,
    price: String((price * (1 + (Math.random() - 0.5) * 0.002)).toFixed(2)),
    qty: String((Math.random() * 0.5 + 0.001).toFixed(4)),
    time: now - i * 800,
  }));
}

// ══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════
export default function CryptoView({ theme, onToast, onAlertCountChange }) {
  const [globalStats, setGlobalStats]   = useState(null);
  const [fearGreed,   setFearGreed]     = useState(null);
  const [marketData,  setMarketData]    = useState([]);
  const [topCoins,    setTopCoins]      = useState([]);
  const [coinDetail,  setCoinDetail]    = useState(null);
  const [selectedCoin, setSelectedCoin] = useState('bitcoin');
  const [tvInterval,  setTvInterval]    = useState('D');
  const [tvSymbol,    setTvSymbol]      = useState('BINANCE:BTCUSDT');
  const [watchlist,   setWatchlist]     = useState(() => {
    try { return JSON.parse(localStorage.getItem('nalu_watchlist')) || DEFAULT_WATCHLIST; } catch { return DEFAULT_WATCHLIST; }
  });
  const [portfolio, setPortfolio]       = useState(() => {
    try { return JSON.parse(localStorage.getItem('nalu_portfolio')) || []; } catch { return []; }
  });
  const [alerts, setAlerts]             = useState(() => {
    try { return JSON.parse(localStorage.getItem('nalu_alerts')) || []; } catch { return []; }
  });
  const [prices, setPrices]             = useState({});
  const [orderBook, setOrderBook]       = useState({ bids: [], asks: [] });
  const [trades,    setTrades]          = useState([]);
  const [midPrice,  setMidPrice]        = useState(0);
  const [news,      setNews]            = useState([]);
  const [newsLoading, setNewsLoading]   = useState(false);
  const [newsCat,   setNewsCat]         = useState('');
  const [showPortModal,   setShowPortModal]   = useState(false);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [showCoinTrader,  setShowCoinTrader]  = useState(false);
  const wsRef = useRef(null);

  const marketMap = Object.fromEntries(marketData.map(c => [c.id, c]));

  // Persist portfolio/alerts/watchlist
  useEffect(() => { localStorage.setItem('nalu_portfolio', JSON.stringify(portfolio)); }, [portfolio]);
  useEffect(() => { localStorage.setItem('nalu_alerts',   JSON.stringify(alerts));    }, [alerts]);
  useEffect(() => { localStorage.setItem('nalu_watchlist', JSON.stringify(watchlist)); }, [watchlist]);

  // Sync alert count to parent
  useEffect(() => {
    const active = alerts.filter(a => !a.triggered).length;
    onAlertCountChange?.(active);
  }, [alerts]);

  // Initial fetch
  useEffect(() => {
    loadAll();
    const timer = setInterval(loadAll, CFG.REFRESH_MS);
    return () => clearInterval(timer);
  }, [watchlist]);

  async function loadAll() {
    try {
      const [stats, fg, md, top] = await Promise.allSettled([
        fetchGlobalStats(),
        fetchFearGreed(),
        fetchMarketData(watchlist),
        fetchTopCoins(),
      ]);
      if (stats.status === 'fulfilled') setGlobalStats(stats.value);
      if (fg.status    === 'fulfilled') setFearGreed(fg.value);
      if (md.status    === 'fulfilled') {
        setMarketData(md.value);
        const priceMap = {};
        md.value.forEach(c => { priceMap[c.id] = c.current_price; });
        setPrices(p => ({ ...p, ...priceMap }));
        checkAlertsAgainst(priceMap);
      }
      if (top.status   === 'fulfilled') setTopCoins(top.value);
    } catch {}
  }

  // Coin detail fetch
  useEffect(() => {
    setTvSymbol(CG_TO_TV[selectedCoin] || `COINBASE:${selectedCoin.toUpperCase()}USD`);
    fetchCoinDetail(selectedCoin).then(d => {
      setCoinDetail(d);
      const price = d.market_data.current_price.usd;
      setPrices(p => ({ ...p, [selectedCoin]: price }));
      setMidPrice(price);
      setOrderBook(simOrderBook(price));
      setTrades(simTrades(price));
    }).catch(() => {});
  }, [selectedCoin]);

  // Binance WebSocket for order book
  useEffect(() => {
    if (wsRef.current) { try { wsRef.current.close(); } catch {} }
    const binSym = CG_TO_BINANCE[selectedCoin];
    if (!binSym) return;

    // Fetch real order book
    fetchOrderBook(binSym).then(d => setOrderBook({ bids: d.bids, asks: d.asks })).catch(() => {});
    fetchRecentTrades(binSym).then(d => setTrades([...d].reverse().slice(0, 25))).catch(() => {});

    // WS for live order book
    const ws = createBinanceWS(`${binSym}@depth20@500ms`, data => {
      if (data.bids && data.asks) {
        setOrderBook({ bids: data.bids, asks: data.asks });
        const mid = (parseFloat(data.bids[0]?.[0] || 0) + parseFloat(data.asks[0]?.[0] || 0)) / 2;
        if (mid) setMidPrice(mid);
      }
    });
    wsRef.current = ws;
    return () => { try { ws.close(); } catch {} };
  }, [selectedCoin]);

  // Trade poll
  useEffect(() => {
    const binSym = CG_TO_BINANCE[selectedCoin];
    if (!binSym) return;
    const tid = setInterval(() => {
      fetchRecentTrades(binSym).then(d => setTrades([...d].reverse().slice(0, 25))).catch(() => {});
    }, 4000);
    return () => clearInterval(tid);
  }, [selectedCoin]);

  // News
  useEffect(() => { loadNews(newsCat); }, [newsCat]);

  async function loadNews(cat) {
    setNewsLoading(true);
    try {
      const posts = await fetchNews(cat);
      setNews(posts);
    } catch { setNews([]); }
    setNewsLoading(false);
  }

  // Missing portfolio prices
  useEffect(() => {
    const missing = portfolio.filter(p => !prices[p.id]).map(p => p.id);
    if (!missing.length) return;
    fetchSimplePrices(missing).then(d => {
      const updates = {};
      Object.entries(d).forEach(([id, v]) => { updates[id] = v.usd; });
      setPrices(p => ({ ...p, ...updates }));
    }).catch(() => {});
  }, [portfolio, prices]);

  function checkAlertsAgainst(priceMap) {
    let changed = false;
    const updated = alerts.map(a => {
      if (a.triggered) return a;
      const price = priceMap[a.id];
      if (!price) return a;
      const triggered = (a.type === 'above' && price >= a.price) || (a.type === 'below' && price <= a.price);
      if (triggered) {
        onToast?.(`🎯 Alert: ${a.id.toUpperCase()} is ${a.type} $${fmt(a.price, 2)}! Current: $${fmt(price, 2)}`, '🚨');
        changed = true;
        return { ...a, triggered: true };
      }
      return a;
    });
    if (changed) setAlerts(updated);
  }

  function selectCoin(id) {
    setSelectedCoin(id);
  }

  function addPortfolioPosition(pos) {
    setPortfolio(prev => [...prev, { ...pos, addedAt: Date.now() }]);
    onToast?.(`Added ${pos.qty} ${pos.id} to portfolio.`, '💼');
  }

  function removePortfolioPosition(idx) {
    setPortfolio(prev => prev.filter((_, i) => i !== idx));
  }

  function addAlert(alert) {
    setAlerts(prev => [...prev, { ...alert, triggered: false, addedAt: Date.now() }]);
    onToast?.(`Alert set: ${alert.id.toUpperCase()} ${alert.type} $${fmt(alert.price, 2)}`, '🔔');
  }

  function removeAlert(idx) {
    setAlerts(prev => prev.filter((_, i) => i !== idx));
  }

  const NEWS_CATS = ['', 'BTC', 'ETH', 'DeFi', 'NFT', 'Regulation', 'Trading', 'DeFAI'];

  return (
    <>
      <TickerBar coins={topCoins.length ? topCoins : marketData} />
      <GlobalStatsBar stats={globalStats} fg={fearGreed} />

      <div className="dash-grid">
        {/* LEFT */}
        <aside className="left-panel">
          <div className="panel-section">
            <div className="panel-hdr"><span>Watchlist</span></div>
            <CryptoWatchlist watchlist={watchlist} marketMap={marketMap} selectedCoin={selectedCoin} onSelect={selectCoin} />
          </div>
          <MoversPanel data={marketData} onSelect={selectCoin} />
        </aside>

        {/* CENTER */}
        <main className="center-panel">
          <CoinHeader detail={coinDetail} />

          <div className="chart-ctrl-bar">
            <div className="tf-group">
              {['1','5','15','60','240','D','W','M'].map(tf => (
                <button key={tf} className={`tf-btn${tvInterval === tf ? ' active' : ''}`} onClick={() => setTvInterval(tf)}>
                  {tf === '1' ? '1m' : tf === '5' ? '5m' : tf === '15' ? '15m' : tf === '60' ? '1h' : tf === '240' ? '4h' : '1' + tf.toLowerCase()}
                </button>
              ))}
            </div>
            <div className="chart-actions">
              <button className="act-btn" onClick={() => setShowCoinTrader(v => !v)}>
                <svg viewBox="0 0 16 16" fill="none"><path d="M8 2v4l3 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2"/></svg>
                CoinTrader Pro
              </button>
            </div>
          </div>

          <TVChart symbol={tvSymbol} interval={tvInterval} theme={theme} />

          {showCoinTrader && (
            <div className="cointrader-panel">
              <div className="ct-panel-hdr">
                <span>CoinTrader Pro — Price Comparison</span>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <a className="ext-link" href="https://charts.cointrader.pro/" target="_blank" rel="noopener">Open Full ↗</a>
                  <button className="close-btn" onClick={() => setShowCoinTrader(false)}>✕</button>
                </div>
              </div>
              <div className="ct-iframe-wrap">
                <iframe src="https://charts.cointrader.pro/" title="CoinTrader Pro" frameBorder="0" allowFullScreen sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
              </div>
            </div>
          )}

          <TABar detail={coinDetail} />
        </main>

        {/* RIGHT */}
        <aside className="right-panel">
          <OrderBook bids={orderBook.bids} asks={orderBook.asks} midPrice={midPrice} />
          <RecentTrades trades={trades} />
          <FundingInfo price={midPrice || prices[selectedCoin] || 40000} />

          {/* AI Alerts Panel */}
          <div className="panel-section" style={{ padding: '10px 12px' }}>
            <div className="panel-hdr"><span>Nalu AI Alerts</span><button className="text-btn" onClick={() => setShowAlertsModal(true)}>+ Add</button></div>
            {[
              { title:'Portfolio concentration', detail:'AI tokens > 30% of tracked exposure.', sev:'Medium' },
              { title:'AI sector momentum', detail:'DeFAI tokens outperforming large-cap 7d.', sev:'Medium' },
              { title:'Stablecoin yield signal', detail:'Monitored pool APY moved outside range.', sev:'Low' },
            ].map(a => (
              <div key={a.title} style={{ padding:'8px', background:'var(--card2)', borderRadius:8, marginBottom:6, border:'1px solid var(--border)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:11, fontWeight:600 }}>{a.title}</span>
                  <span style={{ fontSize:9, padding:'2px 6px', borderRadius:8, background: a.sev==='Medium' ? 'rgba(245,158,11,0.15)' : 'rgba(148,163,184,0.15)', color: a.sev==='Medium' ? 'var(--yellow)' : 'var(--txt2)' }}>{a.sev}</span>
                </div>
                <p style={{ fontSize:10, color:'var(--txt2)', marginTop:3 }}>{a.detail}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* BOTTOM */}
      <div className="bottom-row">
        <PortfolioPanel portfolio={portfolio} prices={prices} marketMap={marketMap} onAdd={() => setShowPortModal(true)} onRemove={removePortfolioPosition} />
        <MarketTable coins={topCoins.length ? topCoins : marketData} onSelect={selectCoin} />
      </div>

      <SentimentGauges fg={fearGreed} marketData={marketData} />

      <NewsGrid
        posts={news}
        loading={newsLoading}
        categories={NEWS_CATS}
        activeCat={newsCat}
        onCatChange={setNewsCat}
        onRefresh={() => loadNews(newsCat)}
      />

      {showPortModal   && <PortfolioModal onClose={() => setShowPortModal(false)} onSave={addPortfolioPosition} />}
      {showAlertsModal && <AlertsModal alerts={alerts} onClose={() => setShowAlertsModal(false)} onAdd={addAlert} onRemove={removeAlert} />}
    </>
  );
}
