import assert from "node:assert/strict";
import test from "node:test";
import {
	counterObjectName,
	counterValue,
	normalizeCounterUrl,
} from "../src/lib/count";

test("legacy URL identities remain unchanged while v2 preserves distinct pages", () => {
	assert.equal(
		normalizeCounterUrl("https://EXAMPLE.com/Page?ID=1#Section", "1"),
		"https://example.com/page#section",
	);
	assert.equal(
		normalizeCounterUrl("https://EXAMPLE.com/Page?ID=1#Section", "2"),
		"https://example.com/Page?ID=1",
	);
	assert.notEqual(
		normalizeCounterUrl("https://example.com/A", "2"),
		normalizeCounterUrl("https://example.com/a", "2"),
	);
	assert.notEqual(
		normalizeCounterUrl("https://example.com/?id=1", "2"),
		normalizeCounterUrl("https://example.com/?id=2", "2"),
	);
	assert.notEqual(
		normalizeCounterUrl("https://example.com/a", "2"),
		normalizeCounterUrl("https://example.com/a/", "2"),
	);
	assert.equal(
		normalizeCounterUrl("ftp://example.com/path", "1"),
		"ftp://example.com/path",
	);
	for (const url of [
		"ftp://example.com/path",
		"https://user:secret@example.com/",
		"not a URL",
	]) {
		assert.throws(() => normalizeCounterUrl(url, "2"));
	}
});

test("Durable Object names preserve old namespaces and isolate v2", () => {
	const url = "https://example.com/page";
	assert.equal(counterObjectName({ url, version: "1" }), url);
	assert.notEqual(
		counterObjectName({ url, version: "1" }),
		counterObjectName({ url, version: "2" }),
	);
	assert.throws(() => new URL(counterObjectName({ url, version: "2" })));
});

test("missing counters start at zero and malformed stored values fail visibly", () => {
	assert.equal(counterValue(null), 0);
	assert.equal(counterValue(undefined), 0);
	assert.equal(counterValue("42"), 42);
	assert.equal(counterValue(42), 42);
	for (const value of [
		"",
		"broken",
		"1.5",
		"-1",
		-1,
		Number.NaN,
		Number.MAX_SAFE_INTEGER + 1,
	]) {
		assert.throws(() => counterValue(value), /Stored counter/);
	}
});
