import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { dirname } from "node:path";
import tailwindcss from "@tailwindcss/postcss";
import { type BuildOptions, build, context } from "esbuild";
import postcss from "postcss";

const client: BuildOptions = {
	entryPoints: [
		{ in: "src/ui/client.tsx", out: "app" },
		{ in: "src/ui/app.css", out: "app" },
	],
	bundle: true,
	platform: "browser",
	format: "esm",
	target: "es2022",
	minify: true,
	outdir: "dist/public/assets",
	define: { "process.env.NODE_ENV": '"production"' },
	plugins: [
		{
			name: "tailwind",
			setup(builder) {
				const processor = postcss([tailwindcss({ optimize: true })]);
				builder.onLoad({ filter: /\.css$/ }, async ({ path }) => {
					const result = await processor.process(await readFile(path, "utf8"), {
						from: path,
					});
					return {
						contents: result.css,
						loader: "css",
						resolveDir: dirname(path),
						watchFiles: result.messages
							.filter((message) => message.type === "dependency")
							.map((message) => message.file),
						// ponytail: directory watches are shallow; add recursive watches if templates leave the client graph.
						watchDirs: result.messages
							.filter((message) => message.type === "dir-dependency")
							.map((message) => message.dir),
						warnings: result
							.warnings()
							.map((warning) => ({ text: warning.toString() })),
					};
				});
			},
		},
	],
};

if (process.argv.includes("--dev-node")) {
	const builder = await context(client);
	await builder.rebuild();
	await builder.watch();
	const server = spawn(
		process.execPath,
		["--env-file-if-exists=.env", "--import=tsx", "--watch", "src/server.ts"],
		{ stdio: "inherit" },
	);
	for (const signal of ["SIGINT", "SIGTERM"] as const) {
		process.once(signal, () => server.kill(signal));
	}
	process.exitCode = await new Promise<number>((resolve, reject) => {
		server.once("error", reject);
		server.once("exit", (code) => resolve(code ?? 0));
	});
	await builder.dispose();
} else {
	await build(client);
	if (!process.argv.includes("--client-only")) {
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
	}
}
