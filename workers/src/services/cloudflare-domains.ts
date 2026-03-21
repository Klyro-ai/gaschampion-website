/**
 * Cloudflare for SaaS — Custom Hostname management
 *
 * Prerequisites (manual setup):
 * 1. klyro.co.uk zone added to Cloudflare
 * 2. Cloudflare for SaaS enabled on the zone
 * 3. Fallback origin: proxy-fallback.klyro.co.uk → AAAA 100::
 * 4. Wildcard DNS: *.klyro.co.uk → AAAA 100::
 * 5. Worker route: */* → klyro-site
 * 6. Secrets: CF_API_TOKEN, CF_ZONE_ID
 */

export interface CustomHostnameResult {
  id: string;
  hostname: string;
  status: string;
  sslStatus: string;
  cnameTarget: string;
}

export class CloudflareDomainManager {
  private baseUrl: string;

  constructor(
    private apiToken: string,
    private zoneId: string,
  ) {
    this.baseUrl = `https://api.cloudflare.com/client/v4/zones/${zoneId}`;
  }

  /** Register a custom hostname for a client */
  async createCustomHostname(hostname: string): Promise<CustomHostnameResult> {
    const res = await fetch(`${this.baseUrl}/custom_hostnames`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hostname,
        ssl: {
          method: 'http',
          type: 'dv',
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`CF API error ${res.status}: ${body.slice(0, 200)}`);
    }

    const data = await res.json() as {
      result: {
        id: string;
        hostname: string;
        status: string;
        ssl: { status: string };
        ownership_verification: { name: string; value: string };
      };
    };

    const r = data.result;
    return {
      id: r.id,
      hostname: r.hostname,
      status: r.status,
      sslStatus: r.ssl?.status || 'pending',
      cnameTarget: 'proxy-fallback.klyro.co.uk',
    };
  }

  /** Check the status of a custom hostname */
  async getHostnameStatus(hostnameId: string): Promise<CustomHostnameResult | null> {
    const res = await fetch(`${this.baseUrl}/custom_hostnames/${hostnameId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
      },
    });

    if (!res.ok) return null;

    const data = await res.json() as {
      result: {
        id: string;
        hostname: string;
        status: string;
        ssl: { status: string };
      };
    };

    const r = data.result;
    return {
      id: r.id,
      hostname: r.hostname,
      status: r.status,
      sslStatus: r.ssl?.status || 'unknown',
      cnameTarget: 'proxy-fallback.klyro.co.uk',
    };
  }

  /** Delete a custom hostname */
  async deleteCustomHostname(hostnameId: string): Promise<void> {
    await fetch(`${this.baseUrl}/custom_hostnames/${hostnameId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
      },
    });
  }

  /** Check if a hostname is fully active (DNS verified + SSL issued) */
  isActive(result: CustomHostnameResult): boolean {
    return result.status === 'active' && result.sslStatus === 'active';
  }
}
