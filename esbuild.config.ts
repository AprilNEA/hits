import { build } from "esbuild";

await build({
	entryPoints: { server: "src/server.ts" },
	bundle: true,
	platform: "node",
	format: "esm",
	target: "node24",
	outExtension: { ".js": ".mjs" },
	minify: true,
	sourcemap: true,
	outdir: "dist",
	packages: "external",
});
