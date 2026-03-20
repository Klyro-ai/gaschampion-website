export function buildFacebookAuthUrl(opts: {
  appId: string;
  redirectUri: string;
  state: string;
}): string {
  const scopes = 'pages_read_engagement,instagram_basic,instagram_manage_insights';
  return `https://www.facebook.com/v21.0/dialog/oauth?client_id=${opts.appId}&redirect_uri=${encodeURIComponent(opts.redirectUri)}&scope=${scopes}&state=${opts.state}`;
}

export async function handleFacebookCallback(opts: {
  code: string;
  appId: string;
  appSecret: string;
  redirectUri: string;
  fetchFn?: typeof fetch;
}): Promise<{
  pageId: string;
  instagramId: string | null;
  longLivedToken: string;
  pageAccessToken: string;
  expiresIn: number;
}> {
  const fetchFn = opts.fetchFn ?? fetch;

  // Step 1: Exchange code for short-lived token
  const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${opts.appId}&redirect_uri=${encodeURIComponent(opts.redirectUri)}&client_secret=${opts.appSecret}&code=${opts.code}`;
  const tokenRes = await fetchFn(tokenUrl);
  if (!tokenRes.ok) throw new Error(`Token exchange failed: ${tokenRes.status}`);
  const tokenData = await tokenRes.json() as { access_token: string };

  // Step 2: Exchange for long-lived token
  const longUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${opts.appId}&client_secret=${opts.appSecret}&fb_exchange_token=${tokenData.access_token}`;
  const longRes = await fetchFn(longUrl);
  if (!longRes.ok) throw new Error(`Long-lived token exchange failed: ${longRes.status}`);
  const longData = await longRes.json() as { access_token: string; expires_in: number };

  // Step 3: Get user's Facebook pages
  const pagesUrl = `https://graph.facebook.com/v21.0/me/accounts?access_token=${longData.access_token}`;
  const pagesRes = await fetchFn(pagesUrl);
  if (!pagesRes.ok) throw new Error(`Pages fetch failed: ${pagesRes.status}`);
  const pagesData = await pagesRes.json() as { data: Array<{ id: string; name: string; access_token: string }> };

  if (!pagesData.data || pagesData.data.length === 0) {
    throw new Error('No Facebook Pages found for this account');
  }

  // Use first page (most clients have one)
  const page = pagesData.data[0];

  // Step 4: Get Instagram Business Account linked to the page
  const igUrl = `https://graph.facebook.com/v21.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`;
  const igRes = await fetchFn(igUrl);
  const igData = await igRes.json() as { instagram_business_account?: { id: string } };

  return {
    pageId: page.id,
    instagramId: igData.instagram_business_account?.id ?? null,
    longLivedToken: longData.access_token,
    pageAccessToken: page.access_token,
    expiresIn: longData.expires_in,
  };
}

/** Extract Google Place ID from a Google Maps URL */
export function extractPlaceIdFromUrl(url: string): string | null {
  // Try CID parameter: ?cid=1234567890
  const cidMatch = url.match(/[?&]cid=(\d+)/);
  if (cidMatch) return cidMatch[1];

  // Try ftid parameter: &ftid=0x47d8...
  const ftidMatch = url.match(/[?&]ftid=([^&]+)/);
  if (ftidMatch) return ftidMatch[1];

  // Try place_id parameter
  const pidMatch = url.match(/[?&]place_id=([^&]+)/);
  if (pidMatch) return pidMatch[1];

  // Try /place/ path with data segment: !1s0x...
  const dataMatch = url.match(/!1s(0x[a-f0-9]+:[a-f0-9]+)/i);
  if (dataMatch) return dataMatch[1];

  return null;
}
