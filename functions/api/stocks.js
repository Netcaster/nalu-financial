export async function onRequest(context) {
  const url = new URL(context.request.url);
  const symbols = url.searchParams.get('symbols') || '';

  if (!symbols) {
    return json({ error: 'No symbols provided' }, 400);
  }

  const fields = [
    'regularMarketPrice', 'regularMarketChange', 'regularMarketChangePercent',
    'regularMarketDayHigh', 'regularMarketDayLow', 'regularMarketVolume',
    'marketCap', 'fiftyTwoWeekHigh', 'fiftyTwoWeekLow',
    'regularMarketPreviousClose', 'shortName',
  ].join(',');

  const yahooUrl =
    `https://query1.finance.yahoo.com/v7/finance/quote` +
    `?symbols=${encodeURIComponent(symbols)}&fields=${fields}`;

  try {
    const r = await fetch(yahooUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://finance.yahoo.com/',
        'Origin': 'https://finance.yahoo.com',
      },
    });

    if (!r.ok) throw new Error(`Yahoo HTTP ${r.status}`);

    const data = await r.json();
    return json(data, 200, { 'Cache-Control': 'public, max-age=60, s-maxage=60' });
  } catch (err) {
    return json({ error: err.message }, 502);
  }
}

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      ...extra,
    },
  });
}
