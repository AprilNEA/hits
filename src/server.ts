import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Redis } from "ioredis";
import { createApp } from "./app";
import { RedisCounter } from "./storage/redis";

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) throw new Error("REDIS_URL is not set");

const redis = new Redis(redisUrl, {
	lazyConnect: true,
	enableOfflineQueue: false,
	maxRetriesPerRequest: 1,
	autoResendUnfulfilledCommands: false,
	connectTimeout: 5_000,
	commandTimeout: 5_000,
});
redis.on("error", (error) => console.error("Redis connection error", error));
await redis.connect();

const app = createApp(new RedisCounter(redis), process.env.PUBLIC_ORIGIN);
app.get("/assets/*", serveStatic({ root: "./dist/public" }));
const server = serve({ fetch: app.fetch, hostname: "0.0.0.0", port: 8787 });

for (const signal of ["SIGINT", "SIGTERM"] as const) {
	process.once(signal, () => {
		server.close(() => {
			void redis.quit();
		});
	});
}
