import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { Redis } from "ioredis";
import { type CounterId, normalizeCounterUrl } from "../src/lib/count";
import { RedisCounter } from "../src/storage/redis";

test("Redis preserves old counts, increments atomically, and keeps v2 pages separate", async (t) => {
	const redisUrl = process.env.TEST_REDIS_URL;
	assert.ok(
		redisUrl,
		"Set TEST_REDIS_URL to an isolated Redis instance before running test:redis",
	);
	const redis = new Redis(redisUrl, {
		lazyConnect: true,
		maxRetriesPerRequest: 1,
		retryStrategy: () => null,
		connectTimeout: 5_000,
		commandTimeout: 5_000,
	});
	const keys: string[] = [];
	t.after(async () => {
		try {
			if (redis.status === "ready" && keys.length > 0) await redis.del(...keys);
		} finally {
			redis.disconnect();
		}
	});
	await redis.connect();
	const counter = new RedisCounter(redis);
	const token = randomUUID();
	const base = `https://example.test/${token}`;
	const legacy: CounterId = {
		url: normalizeCounterUrl(`${base}/Legacy?ignored=yes`, "1"),
		version: "1",
	};
	const legacyKey = `hits:https:example.test:${token}:legacy`;
	const ids: CounterId[] = [
		"/a/b",
		"/a:b",
		"/a",
		"/a/",
		"/A",
		"/a?id=1",
		"/a?id=2",
	].map((path) => ({ url: `${base}${path}`, version: "2" }));
	keys.push(legacyKey, ...ids.map((id) => `hits-v2:${id.url}`));

	await redis.set(legacyKey, "41");
	assert.equal(await counter.get(legacy), 41);
	const values = await Promise.all(
		Array.from({ length: 100 }, () => counter.increment(legacy)),
	);
	assert.equal(new Set(values).size, 100);
	assert.equal(await counter.get(legacy), 141);
	assert.equal(await redis.get(legacyKey), "141");

	for (const [index, id] of ids.entries()) {
		assert.equal(await counter.get(id), 0);
		assert.equal(await redis.exists(`hits-v2:${id.url}`), 0);
		await Promise.all(
			Array.from({ length: index + 1 }, () => counter.increment(id)),
		);
	}
	for (const [index, id] of ids.entries()) {
		assert.equal(await counter.get(id), index + 1);
	}

	await redis.set(legacyKey, "corrupted");
	await assert.rejects(counter.get(legacy), /Stored counter/);
	await assert.rejects(counter.increment(legacy), /integer/);
});
