// E*TRADE API — Fetch portfolio using stored OAuth access token

function pct(s) {
  return encodeURIComponent(String(s))
    .replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

async function hmacSha1B64(key, msg) {
  const ck = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(key),
    { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', ck, new TextEncoder().encode(msg));
  let s = '';
  for (const b of new Uint8Array(sig)) s += String.fromCharCode(b);
  return btoa(s);
}

async function signedGet(url, consumerKey, consumerSecret, accessToken, accessSecret) {
  const rb = new Uint8Array(16);
  crypto.getRandomValues(rb);
  const nonce = Array.from(rb).map(b => b.toString(16).padStart(2, '0')).join('');
  const ts    = Math.floor(Date.now() / 1000).toString();

  const op = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: ts,
    oauth_token: accessToken,
    oauth_version: '1.0',
  };

  const parsed = new URL(url);
  const queryParams = {};
  parsed.searchParams.forEach((v, k) => { queryParams[k] = v; });
  const allParams = { ...op, ...queryParams };

  const paramStr = Object.keys(allParams).sort().map(k => `${pct(k)}=${pct(allParams[k])}`).join('&');
  const base     = `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
  const sigBase  = `GET&${pct(base)}&${pct(paramStr)}`;
  const sigKey   = `${pct(consumerSecret)}&${pct(accessSecret)}`;

  op.oauth_signature = await hmacSha1B64(sigKey, sigBase);
  const header = 'OAuth ' + Object.keys(op).sort().map(k => `${pct(k)}="${pct(op[k])}"`).join(', ');

  return fetch(url, { headers: { Authorization: header, Accept: 'application/json' } });
}

export async function onRequest(context) {
  if (context.request.method !== 'POST') return json({ error: 'POST required' }, 405);

  const body = await context.request.json().catch(() => ({}));
  const { token, secret: tokenSecret } = body;
  if (!token || !tokenSecret) return json({ error: 'Missing token or secret' }, 400);

  const key     = context.env.ETRADE_KEY;
  const secret  = context.env.ETRADE_SECRET;
  const sandbox = context.env.ETRADE_SANDBOX !== 'false';
  if (!key || !secret) return json({ error: 'E*TRADE credentials not configured.' }, 500);

  const apiBase = sandbox ? 'https://apisb.etrade.com' : 'https://api.etrade.com';

  // Step 1: get account list
  const acctR  = await signedGet(`${apiBase}/v1/accounts/list`, key, secret, token, tokenSecret);
  const acctTxt = await acctR.text();
  if (!acctR.ok) return json({ error: `Accounts ${acctR.status}: ${acctTxt.slice(0, 200)}` }, acctR.status);

  let accountIdKey;
  try {
    const d = JSON.parse(acctTxt);
    accountIdKey = d?.AccountListResponse?.Accounts?.Account?.[0]?.accountIdKey;
  } catch { return json({ error: 'Could not parse accounts response' }, 500); }

  if (!accountIdKey) return json({ positions: [] }, 200);

  // Step 2: get portfolio
  const portR   = await signedGet(
    `${apiBase}/v1/accounts/${accountIdKey}/portfolio?count=50`,
    key, secret, token, tokenSecret
  );
  const portTxt = await portR.text();
  if (!portR.ok) return json({ error: `Portfolio ${portR.status}: ${portTxt.slice(0, 200)}` }, portR.status);

  let positions = [];
  try {
    const d = JSON.parse(portTxt);
    const raw = d?.PortfolioResponse?.AccountPortfolio?.[0]?.Position || [];
    positions = raw.map(p => ({
      symbol:       p.symbolDescription,
      qty:          p.quantity,
      pricePaid:    p.pricePaid,
      marketValue:  p.marketValue,
      totalGain:    p.totalGain,
      totalGainPct: p.totalGainPct,
    }));
  } catch { return json({ error: 'Could not parse portfolio response' }, 500); }

  return json({ positions }, 200, { 'Cache-Control': 'private, max-age=60' });
}

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', ...extra },
  });
}
