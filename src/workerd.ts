import hits, { type Variables } from "./routes/hits";
import { CloudflareCounter } from "./storage/cloudflare";
import { Hono } from 'hono';
import { env } from "hono/adapter";

const app = new Hono<{ Variables: Variables }>()

app.use('/hits', async (c, next) => {
  // @ts-ignore
  const { COUNTERS } = env<{ COUNTERS: DurableObjectNamespace<CloudflareCounter> }>(c)
  const increment = async (url: string) => {
    const id = COUNTERS.idFromName(String(url));
    const stub = COUNTERS.get(id);
    return await stub.increment();
  }
  c.set("increment", increment);
  await next();
})

app.route("/hits", hits)

export default app;
export { CloudflareCounter };