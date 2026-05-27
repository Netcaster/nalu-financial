import { CFG, NEWS_SUBREDDITS } from './constants.js';

async function apiFetch(url) {
  const r = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export async function fetchGlobalStats() {
  const d = await apiFetch(`${CFG.COINGECKO}/global`);
  return d.data;
}

export async function fetchFearGreed() {
  const d = await apiFetch(CFG.FEAR_GREED);
  return {
    value: parseInt(d.data[0].value),
    label: d.data[0].value_classification,
  };
}

export async function fetchMarketData(ids) {
  const idStr = [...new Set([...ids, 'bitcoin', 'ethereum', 'solana', 'binancecoin', 'ripple'])].join(',');
  return apiFetch(
    `${CFG.COINGECKO}/coins/markets?vs_currency=usd&ids=${idStr}&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=1h,24h,7d,30d`
  );
}

export async function fetchTopCoins() {
  return apiFetch(
    `${CFG.COINGECKO}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=1h,24h,7d`
  );
}

export async function fetchCoinDetail(id) {
  return apiFetch(
    `${CFG.COINGECKO}/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`
  );
}

export async function fetchOrderBook(symbol) {
  return apiFetch(`${CFG.BINANCE_REST}/depth?symbol=${symbol.toUpperCase()}&limit=12`);
}

export async function fetchRecentTrades(symbol) {
  return apiFetch(`${CFG.BINANCE_REST}/trades?symbol=${symbol.toUpperCase()}&limit=30`);
}

export async function fetchSimplePrices(ids) {
  return apiFetch(`${CFG.COINGECKO}/simple/price?ids=${ids.join(',')}&vs_currencies=usd`);
}

export async function fetchRedditNews(subreddit, limit = 15) {
  const url = `https://www.reddit.com/r/${subreddit}/new.json?limit=${limit}`;
  const r = await fetch(url, { headers: { 'User-Agent': 'NaluFinancial:v1.0 (personal trading dashboard)' } });
  if (!r.ok) throw new Error(`Reddit HTTP ${r.status}`);
  const d = await r.json();
  return d.data.children.map(c => c.data);
}

export async function fetchNews(cat = '') {
  const sub = NEWS_SUBREDDITS[cat] || NEWS_SUBREDDITS[''];
  const posts = await fetchRedditNews(sub, 18);
  if (cat === 'Regulation') {
    const filtered = posts.filter(p => /regulat|sec |ban |law |legal|govern|policy|tax/i.test(p.title));
    return filtered.length ? filtered : posts;
  }
  return posts;
}

export function createBinanceWS(streamPath, onMessage) {
  const ws = new WebSocket(`${CFG.BINANCE_WS}/${streamPath}`);
  ws.onmessage = evt => {
    try { onMessage(JSON.parse(evt.data)); } catch (e) {}
  };
  return ws;
}

export async function searchCoinGecko(query) {
  const d = await apiFetch(`${CFG.COINGECKO}/search?query=${encodeURIComponent(query)}`);
  return d.coins?.slice(0, 6) || [];
}
