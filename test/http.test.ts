import assert from "node:assert/strict";
import { test } from "node:test";
import { createApp } from "../src/app";
import type { Counter, CounterId } from "../src/lib/count";

function memoryCounter(initial = 0) {
	const values = new Map<string, number>();
	const calls: { method: "get" | "increment"; id: CounterId }[] = [];
	const counter: Counter = {
		async get(id) {
			calls.push({ method: "get", id });
			return values.get(JSON.stringify(id)) ?? initial;
		},
		async increment(id) {
			calls.push({ method: "increment", id });
			const key = JSON.stringify(id);
			const value = (values.get(key) ?? initial) + 1;
			values.set(key, value);
			return value;
		},
	};
	return { counter, calls };
}

const path = (params: Record<string, string>) =>
	`/hits?${new URLSearchParams(params)}`;

test("GET counts once; HEAD, preview, and liveness do not increment", async () => {
	const { counter, calls } = memoryCounter();
	const app = createApp(counter);
	const query = { url: "https://example.com/Page?tab=code", v: "2" };
	const response = await app.request(path(query));
	assert.equal(response.status, 200);
	assert.equal(
		response.headers.get("content-type"),
		"image/svg+xml; charset=utf-8",
	);
	assert.match(response.headers.get("cache-control") ?? "", /no-store/);
	assert.match(await response.text(), /<title>hits: 1<\/title>/);

	const head = await app.request(path(query), { method: "HEAD" });
	assert.equal(head.status, 200);
	assert.equal(
		head.headers.get("content-type"),
		response.headers.get("content-type"),
	);
	assert.equal(await head.text(), "");
	const preview = await app.request(path({ ...query, preview: "true" }));
	assert.match(await preview.text(), /<title>hits: 1<\/title>/);
	assert.deepEqual(await (await app.request("/healthz")).json(), {
		status: "ok",
	});
	assert.deepEqual(
		calls.map(({ method }) => method),
		["increment", "get", "get"],
	);
});

test("old URLs retain v1 identity and v2 uses the corrected identity", async () => {
	const { counter, calls } = memoryCounter();
	const app = createApp(counter);
	const url = "https://EXAMPLE.com/Project?tab=Code#Section";
	await app.request(path({ url }));
	await app.request(path({ url, v: "2" }));
	assert.deepEqual(
		calls.map(({ id }) => id),
		[
			{ url: "https://example.com/project#section", version: "1" },
			{ url: "https://example.com/Project?tab=Code", version: "2" },
		],
	);
});

test("invalid inputs are rejected before accessing the counter", async () => {
	const { counter, calls } = memoryCounter();
	const app = createApp(counter);
	const invalid: Record<string, string>[] = [
		{ url: "" },
		{ url: "not a URL" },
		{ url: `https://example.com/${"a".repeat(2048)}` },
		{ url: "javascript:alert(1)" },
		{ url: "https://user:secret@example.com" },
		{ v: "3" },
		{ preview: "yes" },
		{ label: "a".repeat(65) },
		{ label: "invalid\u0000text" },
		{ color: "url(https://example.com/paint.svg)" },
		{ leftBgColor: 'red" onload="alert(1)' },
		{ rightBgColor: "#ff" },
		{ border: "circle" },
		{ format: "scientific" },
	];
	for (const params of invalid) {
		const response = await app.request(
			path({ url: "https://example.com", v: "2", ...params }),
		);
		assert.equal(response.status, 400, JSON.stringify(params));
		assert.match(await response.text(), /"error":"Invalid badge parameters"/);
	}
	assert.equal((await app.request("/hits")).status, 400);
	assert.deepEqual(calls, []);
});

test("SVG escapes labels and fits Unicode labels and large counts", async () => {
	const { counter } = memoryCounter(Number.MAX_SAFE_INTEGER);
	const app = createApp(counter);
	const params = { url: "https://example.com", preview: "true" };
	const escaped = await (
		await app.request(path({ ...params, label: '<script>&"' }))
	).text();
	assert.doesNotMatch(escaped, /<script>/);
	assert.match(escaped, /&lt;script&gt;&amp;&quot;/);
	const label = "访问".repeat(32);
	const svg = await (await app.request(path({ ...params, label }))).text();
	assert.ok(Number(svg.match(/<svg[^>]* width="(\d+)"/)?.[1]) > 700);
	assert.ok(svg.includes(`${label}: ${Number.MAX_SAFE_INTEGER}`));
	assert.match(svg, /textLength="\d+" lengthAdjust="spacingAndGlyphs"/);
	assert.match(svg, /clip-path="url\(#r\)"/);
});

test("compact counts round for display while preserving exact values and read-only previews", async () => {
	for (const [count, compact, compactWidth] of [
		[0, "0", 63],
		[999, "999", 77],
		[1000, "1k", 70],
		[1200, "1.2k", 84],
		[999949, "999.9k", 98],
		[999950, "1M", 70],
		[1000000, "1M", 70],
	] as const) {
		const { counter, calls } = memoryCounter(count);
		const app = createApp(counter);
		const params = { url: "https://example.com", preview: "true" };
		for (const format of ["compact", "full", undefined]) {
			const response = await app.request(
				path(format ? { ...params, format } : params),
			);
			assert.equal(response.status, 200);
			const svg = await response.text();
			const texts = [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)];
			assert.equal(
				texts.at(-1)?.[1],
				format === "compact" ? compact : String(count),
			);
			assert.ok(svg.includes(`<title>hits: ${count}</title>`));
			assert.ok(svg.includes(`aria-label="hits: ${count}"`));
			const width = Number(svg.match(/<svg[^>]* width="(\d+)"/)?.[1]);
			if (format === "compact") assert.equal(width, compactWidth);
		}
		assert.deepEqual(
			calls.map(({ method }) => method),
			["get", "get", "get"],
		);
	}
});

test("storage errors are visible as 503 instead of a successful zero", async (t) => {
	t.mock.method(console, "error", () => {});
	const unavailable = async () => {
		throw new Error("Redis unavailable");
	};
	const app = createApp({ get: unavailable, increment: unavailable });
	for (const preview of ["true", "false"]) {
		const response = await app.request(
			path({ url: "https://example.com", preview }),
		);
		assert.equal(response.status, 503);
		assert.deepEqual(await response.json(), {
			error: "Counter storage unavailable",
		});
	}
});

test("homepage generates encoded Markdown and a preview without incrementing", async () => {
	const { counter, calls } = memoryCounter();
	const app = createApp(counter);
	assert.equal((await app.request("/")).status, 200);
	const url = "https://example.com/Page?first=one&second=two";
	const response = await app.request(
		`/?${new URLSearchParams({ url, label: "访问", format: "compact" })}`,
	);
	assert.equal(response.status, 200);
	const html = await response.text();
	const markdown = html.match(
		/<textarea[^>]*>!\[hits\]\(([^<]+)\)<\/textarea>/,
	)?.[1];
	assert.ok(markdown);
	const badge = new URL(markdown.replaceAll("&amp;", "&"));
	assert.equal(badge.searchParams.get("url"), url);
	assert.equal(badge.searchParams.get("v"), "2");
	assert.equal(badge.searchParams.get("preview"), null);
	assert.equal(badge.searchParams.get("label"), "访问");
	assert.equal(badge.searchParams.get("format"), "compact");
	assert.deepEqual(calls, []);
	const preview = html.match(/<img[^>]*src="([^"]+)"/)?.[1];
	assert.ok(preview);
	const image = new URL(preview.replaceAll("&amp;", "&"));
	assert.equal(image.searchParams.get("preview"), "true");
	assert.equal((await app.request(image.href)).status, 200);
	assert.deepEqual(
		calls.map(({ method }) => method),
		["get"],
	);

	const invalid = await app.request(
		`/?${new URLSearchParams({ url, label: "x".repeat(65) })}`,
	);
	assert.equal(invalid.status, 400);
	assert.doesNotMatch(await invalid.text(), /<img/);
});

test("React bootstrap data preserves values without allowing script injection", async () => {
	const { counter } = memoryCounter();
	const label = '</script><script>alert("x")</script>';
	const response = await createApp(counter).request(
		`/?${new URLSearchParams({ url: "https://example.com", label })}`,
	);
	assert.equal(response.status, 200);
	const html = await response.text();
	assert.doesNotMatch(html, /<script>alert/);
	const data = html.match(
		/<script id="app-data" type="application\/json">([^<]+)<\/script>/,
	)?.[1];
	assert.ok(data);
	assert.equal(JSON.parse(data).values.label, label);
	assert.match(html, /<script type="module" src="\/assets\/app.js"><\/script>/);
	assert.match(html, /href="\/assets\/app.css"/);
});

test("configured public origin generates HTTPS links behind an HTTP reverse proxy", async () => {
	const { counter } = memoryCounter();
	const app = createApp(counter, "https://badge.example/");
	const response = await app.request(
		"http://internal/?url=https%3A%2F%2Fexample.com",
	);
	assert.equal(response.status, 200);
	const html = await response.text();
	assert.match(html, /!\[hits\]\(https:\/\/badge\.example\/hits\?/);
	assert.match(
		html,
		/<img src="https:\/\/badge\.example\/hits\?[^"]*preview=true"/,
	);
	assert.doesNotMatch(html, /http:\/\/internal/);
	for (const invalid of [
		"",
		"ftp://example.com",
		"https://user@example.com",
		"https://example.com/path",
		"https://example.com/?q=1",
		"https://example.com/#fragment",
		"https://example.com/?",
		"https://example.com/#",
	]) {
		assert.throws(() => createApp(counter, invalid));
	}
});
