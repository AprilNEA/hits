import { Hono } from "hono";
import { html, raw } from "hono/html";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { App, type AppProps } from "../ui/App";
import { BadgeQuery } from "./hits";

export default function createHome(publicOrigin?: string) {
	return new Hono().get("/", (c) => {
		const values = c.req.query();
		const submitted = values.url !== undefined;
		const query = BadgeQuery.safeParse({ ...values, v: "2" });
		const props: AppProps = { values };
		if (submitted && query.success) {
			const badgeUrl = new URL("/hits", publicOrigin ?? c.req.url);
			badgeUrl.search = new URLSearchParams({
				url: query.data.id.url,
				v: "2",
				...query.data.style,
			}).toString();
			const previewUrl = new URL(badgeUrl);
			previewUrl.searchParams.set("preview", "true");
			props.badgeUrl = badgeUrl.href;
			props.previewUrl = previewUrl.href;
		} else if (submitted && !query.success) {
			props.error = query.error.issues
				.map((issue) => `${issue.path.join(".")}: ${issue.message}`)
				.join("；");
		}
		const markup = renderToString(createElement(App, props));
		// JSON in a script element must not be able to close the element.
		const data = JSON.stringify(props).replaceAll("<", "\\u003c");
		c.header("Cache-Control", "no-store");
		return c.html(
			html`<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="description" content="为 GitHub README 和网站生成轻量的请求计数徽章。" />
<title>Hits · GitHub 计数徽章</title>
<link rel="stylesheet" href="/assets/app.css" />
</head>
<body>
<div id="root">${raw(markup)}</div>
<script id="app-data" type="application/json">${raw(data)}</script>
<script type="module" src="/assets/app.js"></script>
</body>
</html>`,
			submitted && !query.success ? 400 : 200,
		);
	});
}
