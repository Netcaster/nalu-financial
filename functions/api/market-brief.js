export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' } });
  }

  const key = context.env.ANTHROPIC_API_KEY;
  if (!key) return json({ error: 'ANTHROPIC_API_KEY not set in Cloudflare Pages environment variables.' }, 500);

  const body = await context.request.json().catch(() => ({}));
  const { crypto = {}, stocks = {} } = body;

  const fmtPrice = (v) => v != null ? Number(v).toLocaleString('en-US', { maximumFractionDigits: 2 }) : '?';
  const fmtChg   = (v) => v != null ? `${Number(v) >= 0 ? '+' : ''}${Number(v).toFixed(2)}%` : '?';

  const cryptoLines = [
    crypto.bitcoin  ? `BTC:    $${fmtPrice(crypto.bitcoin.usd)}  (${fmtChg(crypto.bitcoin.usd_24h_change)} 24h)` : null,
    crypto.ethereum ? `ETH:    $${fmtPrice(crypto.ethereum.usd)}  (${fmtChg(crypto.ethereum.usd_24h_change)} 24h)` : null,
    crypto.solana   ? `SOL:    $${fmtPrice(crypto.solana.usd)}  (${fmtChg(crypto.solana.usd_24h_change)} 24h)` : null,
  ].filter(Boolean).join('\n');

  const stockLines = Object.entries(stocks)
    .filter(([, q]) => q?.price != null)
    .map(([sym, q]) => `${sym.padEnd(5)} $${fmtPrice(q.price)}  (${fmtChg(q.changePercent)})`)
    .join('\n');

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const hasData = cryptoLines.length > 0 || stockLines.length > 0;

  const prompt = hasData
    ? `You are an institutional AI market analyst for Nalu Financial Intelligence. Today is ${today}.

The following prices were captured live from market feeds moments ago. Use this exact data to write your analysis — do not say data is unavailable.

CRYPTO (live):
${cryptoLines}

STOCKS / ETFs (live):
${stockLines}

Write a 4–6 sentence institutional market intelligence brief. Specifically reference the actual prices and percentage moves above. Cover: overall risk-on/risk-off tone, the most significant move, the AI infrastructure narrative (NVDA + AI tokens), and one key risk or opportunity. Plain prose only — no markdown, no headers, no bullet points.`
    : `You are an institutional AI market analyst for Nalu Financial Intelligence. Today is ${today}. Market data was not available for this brief. Write 2 sentences acknowledging this and advising the user to refresh and try again.`;

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
    return json({ error: `Anthropic API ${r.status}: ${txt.slice(0, 200)}` }, 500);
  }

  const data = await r.json();
  const raw = data?.content?.[0]?.text?.trim() ?? '';
  // Strip markdown formatting that Haiku inserts despite instructions
  const brief = raw
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^[-]{3,}$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  // no CDN cache — each brief is unique per-request
  return json({ brief, generated: new Date().toISOString(), hasData }, 200, {
    'Cache-Control': 'no-store',
  });
}

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', ...extra },
  });
}
