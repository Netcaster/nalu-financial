export async function onRequest(context) {
  const url = new URL(context.request.url);
  const symbols = (url.searchParams.get('symbols') || '').split(',').filter(Boolean).slice(0, 12);

  if (!symbols.length) return json({ error: 'No symbols' }, 400);

  const results = await Promise.allSettled(
    symbols.map(async sym => {
      const yf = sym.replace('.', '-');
      try {
        const r = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yf)}?interval=1d&range=1mo`,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
              'Accept': 'application/json',
              'Referer': 'https://finance.yahoo.com/',
              'Origin': 'https://finance.yahoo.com',
            },
          }
        );
        if (!r.ok) return null;
        const d = await r.json();
        const closes = (d?.chart?.result?.[0]?.indicators?.quote?.[0]?.close || []).filter(v => v != null);
        if (closes.length < 5) return null;
        // daily % returns
        const returns = closes.slice(1).map((c, i) => (c - closes[i]) / closes[i] * 100);
        return { symbol: sym.replace('-', '.'), returns };
      } catch { return null; }
    })
  );

  const data = results
    .filter(r => r.status === 'fulfilled' && r.value)
    .map(r => r.value);

  return json(data, 200, { 'Cache-Control': 'public, max-age=7200, s-maxage=7200' });
}

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', ...extra },
  });
}
