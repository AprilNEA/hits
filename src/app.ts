import { Hono } from "hono";
import type { Counter } from "./lib/count";
import hits, { type Variables } from "./routes/hits";
import createHome from "./routes/home";

export function createApp(counter: Counter, publicOrigin?: string) {
	const origin = publicOrigin === undefined ? undefined : new URL(publicOrigin);
	if (
		origin &&
		(!/^https?:$/.test(origin.protocol) || origin.href !== `${origin.origin}/`)
	) {
		throw new Error(
			"PUBLIC_ORIGIN must be an HTTP(S) origin without credentials, path, query, or fragment",
		);
	}
	const app = new Hono<{ Variables: Variables }>();
	app.use("/hits", async (c, next) => {
		c.set("counter", counter);
		await next();
	});
	app.get("/healthz", (c) => c.json({ status: "ok" }));
	app.route("/hits", hits);
	app.route("/", createHome(origin?.origin));
	return app;
}
