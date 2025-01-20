import { z } from "@hono/zod-openapi";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import Badge, { BadgeStyle } from "../components/Badge";

export type Variables = {
	increment: (url: string) => Promise<number>;
}

const app = new Hono<{ Variables: Variables }>().get(
	"/",
	zValidator(
		"query",
		BadgeStyle.extend({
			url: z.string().url().transform((data) => {
				const url = new URL(data.toLowerCase());
				url.search = '';
				return url;
			}),
		})
	),
	async (c) => {
		const { url, ...style } = c.req.valid("query");
		const count = await c.var.increment(String(url));
		const response = c.html(<Badge count={count} {...style} />, {
			headers: {
				'Cache-Control': 'max-age=0, s-maxage=0, must-revalidate, no-cache, no-store',
			},
		});
		c.header('Content-Type', 'image/svg+xml');
		return response
	},
);

export default app;
