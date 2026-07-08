export class SettingsCache {
  private readonly cache = new Map<string, { values: Record<string, unknown>; at: number }>();
  private readonly ttlMs: number;

  constructor(ttlMs = 30_000) {
    this.ttlMs = ttlMs;
  }

  get(namespace: string): Record<string, unknown> | undefined {
    const entry = this.cache.get(namespace);
    if (!entry) return undefined;
    if (Date.now() - entry.at > this.ttlMs) {
      this.cache.delete(namespace);
      return undefined;
    }
    return entry.values;
  }

  set(namespace: string, values: Record<string, unknown>): void {
    this.cache.set(namespace, { values: structuredClone(values), at: Date.now() });
  }

  invalidate(namespace: string): void {
    this.cache.delete(namespace);
  }

  invalidatePrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) this.cache.delete(key);
    }
  }

  clear(): void {
    this.cache.clear();
  }
}
