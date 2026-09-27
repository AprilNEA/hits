import { spawn } from "node:child_process";
import { type BuildOptions, build, context } from "esbuild";

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
