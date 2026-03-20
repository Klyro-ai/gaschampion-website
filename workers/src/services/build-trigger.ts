const DEBOUNCE_MINUTES = 15;

export class BuildTrigger {
  constructor(
    private kv: KVNamespace,
    private fetchFn: typeof fetch = fetch
  ) {}

  async triggerBuild(clientId: string, deployHookUrl: string): Promise<boolean> {
    const kvKey = `build:last:${clientId}`;
    const lastBuild = await this.kv.get(kvKey);

    if (lastBuild) {
      const elapsed = Date.now() - new Date(lastBuild).getTime();
      if (elapsed < DEBOUNCE_MINUTES * 60 * 1000) {
        return false; // debounced
      }
    }

    const response = await this.fetchFn(deployHookUrl, { method: 'POST' });
    if (!response.ok) {
      throw new Error(`Build trigger failed: ${response.status}`);
    }

    await this.kv.put(kvKey, new Date().toISOString(), {
      expirationTtl: DEBOUNCE_MINUTES * 60 * 2, // TTL double the debounce for cleanup
    });

    return true;
  }
}
