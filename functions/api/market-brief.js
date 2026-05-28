export async function onRequest(context) {
  const key = context.env.ANTHROPIC_API_KEY;
  if (!key) return json({ error: 'ANTHROPIC_API_KEY not set in Cloudflare Pages environment variables.' }, 500);

  const [cryptoRes, stockRes] = await Promise.allSettled([
    fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,bittensor,fetch-ai,render-token&vs_currencies=usd&include_24hr_change=true',
      { headers: { Accept: 'application/json' } }
    ),
    fetch(
      'https://query1.finance.yahoo.com/v7/finance/quote?symbols=SPY,QQQ,NVDA,AAPL,MSFT,COIN,MSTR',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'application/json',
          Referer: 'https://finance.yahoo.com/',
          Origin: 'https://finance.yahoo.com',
        },
      }
    ),
  ]);

  const n = (v) => v != null ? v.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '?';
  const p = (v) => v != null ? `${v >= 0 ? '+' : ''}${v.toFixed(1)}%` : '?';

  let cryptoCtx = '';
  if (cryptoRes.status === 'fulfilled' && cryptoRes.value.ok) {
    const d = await cryptoRes.value.json();
    cryptoCtx = [
      ['bitcoin',      'BTC'],
      ['ethereum',     'ETH'],
      ['solana',       'SOL'],
      ['bittensor',    'TAO'],
      ['fetch-ai',     'FET'],
      ['render-token', 'RENDER'],
    ]
      .map(([id, sym]) => {
        const c = d[id];
        return c ? `${sym}: $${n(c.usd)} (${p(c.usd_24h_change)} 24h)` : null;
      })
      .filter(Boolean)
      .join('\n');
  }

  let stockCtx = '';
  if (stockRes.status === 'fulfilled' && stockRes.value.ok) {
    const d = await stockRes.value.json();
    stockCtx = (d?.quoteResponse?.result || [])
      .map(q => `${q.symbol}: $${n(q.regularMarketPrice)} (${p(q.regularMarketChangePercent)})`)
      .join('\n');
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const prompt = `You are an institutional AI market analyst for Nalu Financial Intelligence. Today is ${today}.

LIVE MARKET DATA:

Crypto:
${cryptoCtx || 'Unavailable'}

Stocks / ETFs:
${stockCtx || 'Unavailable'}

Write a concise institutional market intelligence brief (4–6 sentences). Cover: overall market tone and risk-on/risk-off sentiment, the most significant move and what it signals for positioning, the AI infrastructure narrative across NVDA/tech stocks and AI tokens, and one key risk or opportunity to watch. Be direct and professional — flowing prose only, no bullet points, no headers.`;

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 450,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!r.ok) {
    const txt = await r.text().catch(() => '');
    return json({ error: `Anthropic API ${r.status}: ${txt.slice(0, 120)}` }, 500);
  }

  const data = await r.json();
  const brief = data?.content?.[0]?.text?.trim() ?? '';
  return json({ brief, generated: new Date().toISOString() }, 200, {
    'Cache-Control': 'public, max-age=1800, s-maxage=1800',
  });
}

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', ...extra },
  });
}
