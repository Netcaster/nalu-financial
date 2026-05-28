export async function onRequest() {
  try {
    const [eqRes, idxRes] = await Promise.all([
      fetch('https://cdn.cboe.com/api/global/us_indices/daily_prices/PCCE_Data.json', { headers: { Accept: 'application/json' } }).catch(() => null),
      fetch('https://cdn.cboe.com/api/global/us_indices/daily_prices/PCCR_Data.json', { headers: { Accept: 'application/json' } }).catch(() => null),
    ]);

    const eq  = eqRes?.ok  ? await eqRes.json()  : null;
    const idx = idxRes?.ok ? await idxRes.json() : null;

    const latestEq  = eq?.length  ? eq[eq.length - 1]   : null;
    const latestIdx = idx?.length ? idx[idx.length - 1] : null;
    const historyEq = eq?.length  ? eq.slice(-20).map(([date, value]) => ({ date, value: parseFloat(value) })) : [];

    return new Response(JSON.stringify({
      equity:  latestEq  ? { date: latestEq[0],  value: parseFloat(latestEq[1])  } : null,
      index:   latestIdx ? { date: latestIdx[0], value: parseFloat(latestIdx[1]) } : null,
      history: historyEq,
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
