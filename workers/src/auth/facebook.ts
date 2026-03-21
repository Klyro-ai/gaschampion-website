export function buildFacebookAuthUrl(opts: {
  appId: string;
  redirectUri: string;
  state: string;
}): string {
  return `https://www.facebook.com/v21.0/dialog/oauth?client_id=${opts.appId}&redirect_uri=${encodeURIComponent(opts.redirectUri)}&config_id=1919381288945282&response_type=code&state=${opts.state}`;
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

  // Step 2: Try /me/accounts first, then fall back to business-owned pages
  let page: { id: string; name: string; access_token: string } | null = null;

  const pagesUrl = `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token&access_token=${tokenData.access_token}`;
  const pagesRes = await fetchFn(pagesUrl);
  if (pagesRes.ok) {
    const pagesData = await pagesRes.json() as { data: Array<{ id: string; name: string; access_token: string }> };
    if (pagesData.data?.length > 0) {
      page = pagesData.data[0];
    }
  }

  // Fallback: get pages via business manager
  if (!page) {
    const bizUrl = `https://graph.facebook.com/v21.0/me/businesses?access_token=${tokenData.access_token}`;
    const bizRes = await fetchFn(bizUrl);
    if (bizRes.ok) {
      const bizData = await bizRes.json() as { data: Array<{ id: string }> };
      for (const biz of bizData.data || []) {
        const ownedUrl = `https://graph.facebook.com/v21.0/${biz.id}/owned_pages?fields=id,name,access_token&access_token=${tokenData.access_token}`;
        const ownedRes = await fetchFn(ownedUrl);
        if (ownedRes.ok) {
          const ownedData = await ownedRes.json() as { data: Array<{ id: string; name: string; access_token: string }> };
          if (ownedData.data?.length > 0) {
            page = ownedData.data[0];
            break;
          }
        }
      }
    }
  }

  if (!page) {
    throw new Error('No Facebook Pages found for this account');
  }

  // Step 3: Exchange user token for long-lived token
  const longUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${opts.appId}&client_secret=${opts.appSecret}&fb_exchange_token=${tokenData.access_token}`;
  const longRes = await fetchFn(longUrl);
  if (!longRes.ok) throw new Error(`Long-lived token exchange failed: ${longRes.status}`);
  const longData = await longRes.json() as { access_token: string; expires_in: number };

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
