import { createApp } from "./app";
import { type CounterId, counterObjectName } from "./lib/count";
import type { CloudflareCounter } from "./storage/cloudflare";

type Bindings = {
	COUNTERS: DurableObjectNamespace<CloudflareCounter>;
	PUBLIC_ORIGIN?: string;
};

export default {
	fetch(request, env, ctx) {
		const object = (id: CounterId) =>
			env.COUNTERS.get(env.COUNTERS.idFromName(counterObjectName(id)));
		const app = createApp(
			{
				get: (id) => object(id).getCounterValue(),
				increment: (id) => object(id).increment(),
			},
			env.PUBLIC_ORIGIN,
		);
		return app.fetch(request, env, ctx);
	},
} satisfies ExportedHandler<Bindings>;

export { CloudflareCounter } from "./storage/cloudflare";
