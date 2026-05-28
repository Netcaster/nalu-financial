// E*TRADE OAuth 1.0a — Step 2: Exchange PIN verifier for access token

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

async function oauthHeader(method, url, consumerKey, consumerSecret, token, tokenSecret, extra = {}) {
  const rb = new Uint8Array(16);
  crypto.getRandomValues(rb);
  const nonce = Array.from(rb).map(b => b.toString(16).padStart(2, '0')).join('');
  const ts    = Math.floor(Date.now() / 1000).toString();

  const op = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: ts,
    oauth_token: token,
    oauth_version: '1.0',
    ...extra,
  };

  const paramStr = Object.keys(op).sort().map(k => `${pct(k)}=${pct(op[k])}`).join('&');
  const parsed = new URL(url);
  const base   = `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
  const sigBase = `${method.toUpperCase()}&${pct(base)}&${pct(paramStr)}`;
  const sigKey  = `${pct(consumerSecret)}&${pct(tokenSecret)}`;

  op.oauth_signature = await hmacSha1B64(sigKey, sigBase);
  return 'OAuth ' + Object.keys(op).sort().map(k => `${pct(k)}="${pct(op[k])}"`).join(', ');
}

export async function onRequest(context) {
  if (context.request.method !== 'POST') return json({ error: 'POST required' }, 405);

  const body = await context.request.json().catch(() => ({}));
  const { oauthToken, oauthTokenSecret, pin } = body;
  if (!oauthToken || !oauthTokenSecret || !pin) return json({ error: 'Missing oauthToken / oauthTokenSecret / pin' }, 400);

  const key     = context.env.ETRADE_KEY;
  const secret  = context.env.ETRADE_SECRET;
  const sandbox = context.env.ETRADE_SANDBOX !== 'false';
  if (!key || !secret) return json({ error: 'E*TRADE credentials not configured.' }, 500);

  const apiBase   = sandbox ? 'https://apisb.etrade.com' : 'https://api.etrade.com';
  const accessUrl = `${apiBase}/oauth/access_token`;
  const header    = await oauthHeader(
    'GET', accessUrl, key, secret, oauthToken, oauthTokenSecret,
    { oauth_verifier: pin.trim() }
  );

  const r    = await fetch(accessUrl, { headers: { Authorization: header } });
  const txt  = await r.text();
  if (!r.ok) return json({ error: `E*TRADE ${r.status}: ${txt.slice(0, 200)}` }, r.status);

  const p = Object.fromEntries(new URLSearchParams(txt));
  return json({ token: p.oauth_token, secret: p.oauth_token_secret });
}

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', ...extra },
  });
}
