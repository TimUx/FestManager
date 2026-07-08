/**
 * Generic registry pattern for extension points and platform services.
 */
export class Registry<T> {
  private readonly store = new Map<string, T>();

  register(key: string, value: T): void {
    if (this.store.has(key)) {
      throw new Error(`Registry entry already exists: ${key}`);
    }
    this.store.set(key, value);
  }

  registerOrReplace(key: string, value: T): void {
    this.store.set(key, value);
  }

  get(key: string): T | undefined {
    return this.store.get(key);
  }

  getOrThrow(key: string): T {
    const value = this.store.get(key);
    if (value === undefined) {
      throw new Error(`Registry entry not found: ${key}`);
    }
    return value;
  }

  has(key: string): boolean {
    return this.store.has(key);
  }

  unregister(key: string): boolean {
    return this.store.delete(key);
  }

  keys(): string[] {
    return Array.from(this.store.keys());
  }

  values(): T[] {
    return Array.from(this.store.values());
  }

  listEntries(): [string, T][] {
    return Array.from(this.store.entries());
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}
