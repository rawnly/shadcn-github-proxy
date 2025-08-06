export default class CacheWithTTL<T> {
	private cache: Map<string, { value: T; expiresAt: number }>;
	private ttl: number;

	constructor(ttl: number) {
		this.cache = new Map();
		this.ttl = ttl;
	}

	get(key: string): T | undefined {
		const entry = this.cache.get(key);
		if (entry && entry.expiresAt > Date.now()) {
			return entry.value;
		}
		this.cache.delete(key);
		return undefined;
	}

	set(key: string, value: T): void {
		this.cache.set(key, { value, expiresAt: Date.now() + this.ttl });
	}

	has(key: string): boolean {
		const entry = this.cache.get(key);
		if (entry && entry.expiresAt > Date.now()) {
			return true;
		}
		this.cache.delete(key);
		return false;
	}

	clearExpired(): void {
		const now = Date.now();

		for (const [key, entry] of this.cache.entries()) {
			if (entry.expiresAt <= now) {
				this.cache.delete(key);
			}
		}
	}
}
