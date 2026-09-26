import { Hono } from "hono";
import { z } from "zod";
import Badge, { BadgeStyle } from "../components/Badge";
import {
	type Counter,
	type CounterId,
	normalizeCounterUrl,
} from "../lib/count";

export type Variables = { counter: Counter };

export const BadgeQuery = BadgeStyle.extend({
	url: z.string().min(1).max(2048),
	v: z.enum(["1", "2"]).default("1"),
	preview: z.enum(["true", "false"]).optional(),
}).transform(({ url, v, preview, ...style }, context) => {
	try {
		const id: CounterId = { url: normalizeCounterUrl(url, v), version: v };
		return { id, preview: preview === "true", style };
	} catch {
		context.addIssue({
			code: "custom",
			path: ["url"],
			message: "Use a valid URL; v2 requires HTTP(S) without credentials",
		});
		return z.NEVER;
	}
});

const app = new Hono<{ Variables: Variables }>().get("/", async (c) => {
	c.header("Cache-Control", "no-store, no-cache, max-age=0, must-revalidate");
	c.header("X-Content-Type-Options", "nosniff");
	const query = BadgeQuery.safeParse(c.req.query());
	if (!query.success) {
		return c.json(
			{ error: "Invalid badge parameters", details: query.error.issues },
			400,
		);
	}
	const { id, preview, style } = query.data;
	let count: number;
	try {
		// Hono dispatches HEAD through GET while preserving the request method.
		count =
			c.req.method === "HEAD" || preview
				? await c.var.counter.get(id)
				: await c.var.counter.increment(id);
	} catch (error) {
		console.error("Counter storage failed", error);
		return c.json({ error: "Counter storage unavailable" }, 503);
	}
	return c.body((<Badge count={count} {...style} />).toString(), 200, {
		"Content-Type": "image/svg+xml; charset=utf-8",
	});
});

export default app;
