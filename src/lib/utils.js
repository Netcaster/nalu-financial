export function fmt(n, dec = 2) {
  if (n == null || isNaN(n)) return '—';
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

export function fmtCompact(n) {
  if (n == null || isNaN(n)) return '—';
  if (Math.abs(n) >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
  if (Math.abs(n) >= 1e9)  return '$' + (n / 1e9).toFixed(2)  + 'B';
  if (Math.abs(n) >= 1e6)  return '$' + (n / 1e6).toFixed(2)  + 'M';
  if (Math.abs(n) >= 1e3)  return '$' + (n / 1e3).toFixed(1)  + 'K';
  return '$' + n.toFixed(2);
}

export function fmtPct(n) {
  if (n == null || isNaN(n)) return '—';
  return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
}

export function pctClass(n) {
  return n >= 0 ? 'green' : 'red';
}

export function timeAgo(ts) {
  const s = Math.floor(Date.now() / 1000 - ts);
  if (s < 60)    return s + 's ago';
  if (s < 3600)  return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}

export function generateSparkline(prices, isPos, w = 70, h = 28) {
  if (!prices || prices.length < 2) return `<svg width="${w}" height="${h}"></svg>`;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const pts = prices.map((p, i) => {
    const x = (i / (prices.length - 1)) * w;
    const y = h - ((p - min) / range) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const color = isPos ? '#00d395' : '#ff4560';
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round"/>
  </svg>`;
}

export function sentimentColor(val) {
  if (val < 25) return '#ff4560';
  if (val < 45) return '#f59e0b';
  if (val < 56) return '#94a3b8';
  if (val < 76) return '#00d395';
  return '#14bcbd';
}

export function sentimentLabel(val) {
  if (val < 25) return 'Extreme Fear';
  if (val < 45) return 'Fear';
  if (val < 56) return 'Neutral';
  if (val < 76) return 'Greed';
  return 'Extreme Greed';
}

export function decimalPlaces(price) {
  if (price < 0.01) return 6;
  if (price < 1)    return 5;
  if (price < 100)  return 4;
  return 2;
}
