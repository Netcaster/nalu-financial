// Coinbase Advanced Trade API — ES256 JWT-authenticated portfolio fetch

function sec1ToPkcs8(pemStr) {
  const pem = pemStr.replace(/\\n/g, '\n');
  const b64 = pem.replace(/-----[^\n-]+-----/g, '').replace(/\s/g, '');
  const sec1 = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const N = sec1.length;

  const algId = new Uint8Array([
    0x30, 0x13,
    0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01,
    0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07,
  ]);
  const version = new Uint8Array([0x02, 0x01, 0x00]);
  const octetHdr = N < 0x80
    ? new Uint8Array([0x04, N])
    : new Uint8Array([0x04, 0x81, N]);

  const innerLen = version.length + algId.length + octetHdr.length + N;
  const outerHdr = innerLen < 0x80
    ? new Uint8Array([0x30, innerLen])
    : innerLen < 0x100
      ? new Uint8Array([0x30, 0x81, innerLen])
      : new Uint8Array([0x30, 0x82, (innerLen >> 8) & 0xff, innerLen & 0xff]);

  const result = new Uint8Array(outerHdr.length + innerLen);
  let pos = 0;
  result.set(outerHdr,  pos); pos += outerHdr.length;
  result.set(version,   pos); pos += version.length;
  result.set(algId,     pos); pos += algId.length;
  result.set(octetHdr,  pos); pos += octetHdr.length;
  result.set(sec1,      pos);
  return result.buffer;
}

function b64url(bytes) {
  const arr = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes;
  let s = '';
  for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function b64urlStr(str) {
  return b64url(new TextEncoder().encode(str));
}

async function buildJWT(keyName, pemKey) {
  const pkcs8 = sec1ToPkcs8(pemKey);
  const privKey = await crypto.subtle.importKey(
    'pkcs8', pkcs8,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false, ['sign']
  );

  const now = Math.floor(Date.now() / 1000);
  const hdr = b64urlStr(JSON.stringify({ typ: 'JWT', alg: 'ES256', kid: keyName }));
  const pay = b64urlStr(JSON.stringify({
    sub: keyName,
    iss: 'cdp',
    nbf: now,
    exp: now + 120,
    uri: 'GET api.coinbase.com/api/v3/brokerage/accounts',
  }));

  const input = `${hdr}.${pay}`;
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: { name: 'SHA-256' } },
    privKey,
    new TextEncoder().encode(input)
  );

  return `${input}.${b64url(new Uint8Array(sig))}`;
}

export async function onRequest(context) {
  const keyName = context.env.COINBASE_KEY_NAME;
  const pemKey  = context.env.COINBASE_PRIVATE_KEY;
  if (!keyName || !pemKey) {
    return json({ error: 'Coinbase credentials not configured (COINBASE_KEY_NAME / COINBASE_PRIVATE_KEY).' }, 500);
  }

  let jwt;
  try {
    jwt = await buildJWT(keyName, pemKey);
  } catch (e) {
    return json({ error: `JWT signing failed: ${e.message}` }, 500);
  }

  const r = await fetch('https://api.coinbase.com/api/v3/brokerage/accounts?limit=250', {
    headers: { Authorization: `Bearer ${jwt}`, Accept: 'application/json' },
  });

  if (!r.ok) {
    const txt = await r.text().catch(() => '');
    return json({ error: `Coinbase API ${r.status}: ${txt.slice(0, 200)}` }, r.status);
  }

  const data = await r.json();
  const holdings = (data.accounts || [])
    .map(a => ({
      currency: a.currency,
      balance: parseFloat(a.available_balance?.value ?? '0') + parseFloat(a.hold?.value ?? '0'),
      available: parseFloat(a.available_balance?.value ?? '0'),
      hold: parseFloat(a.hold?.value ?? '0'),
      name: a.name,
    }))
    .filter(h => h.balance > 0.000001)
    .sort((a, b) => b.balance - a.balance);

  return json({ holdings }, 200, { 'Cache-Control': 'private, max-age=60' });
}

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', ...extra },
  });
}
