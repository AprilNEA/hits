import type { Redis } from "ioredis";
import { type Counter, type CounterId, counterValue } from "../lib/count";

function storageKey(id: CounterId) {
	if (id.version === "2") return `hits-v2:${id.url}`;
	// Preserve unstorage 1.14.4's physical keys for existing badges.
	return `hits:${id.url}`
		.split("?", 1)
		.join("")
		.replace(/[/\\]/g, ":")
		.replace(/:+/g, ":")
		.replace(/^:|:$/g, "");
}

export class RedisCounter implements Counter {
	constructor(private readonly redis: Redis) {}

	async get(id: CounterId) {
		return counterValue(await this.redis.get(storageKey(id)));
	}

	async increment(id: CounterId) {
		return counterValue(await this.redis.incr(storageKey(id)));
	}
}
