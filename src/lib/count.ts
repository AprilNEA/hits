export type CounterId = {
	url: string;
	version: "1" | "2";
};

export interface Counter {
	get(id: CounterId): Promise<number>;
	increment(id: CounterId): Promise<number>;
}

export function normalizeCounterUrl(
	input: string,
	version: CounterId["version"],
) {
	const url = new URL(version === "1" ? input.toLowerCase() : input);
	if (version === "1") {
		url.search = "";
	} else {
		if (
			!["http:", "https:"].includes(url.protocol) ||
			url.username ||
			url.password
		) {
			throw new Error("v=2 requires an HTTP(S) URL without credentials");
		}
		url.hash = "";
	}
	return String(url);
}

export function counterValue(
	value: string | number | null | undefined,
): number {
	const count =
		typeof value === "string" && /^\d+$/.test(value)
			? Number(value)
			: (value ?? 0);
	if (typeof count !== "number" || !Number.isSafeInteger(count) || count < 0) {
		throw new Error("Stored counter must be a non-negative safe integer");
	}
	return count;
}

export function counterObjectName(id: CounterId) {
	return id.version === "1" ? id.url : `v2|${id.url}`;
}
