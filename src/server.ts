import hits, { type Variables } from "./routes/hits";
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { counter } from "./storage/redis";

const app = new Hono<{ Variables: Variables }>()

if (!process.env.REDIS_URL) {
  console.error("REDIS_URL is not set");
  process.exit(1);
}

app.use('/hits', async (c, next) => {
  c.set("increment", async (url: string) => {
    return await counter.increment(url);
  });
  await next();
})

app.route("/hits", hits)

serve({
  fetch: app.fetch,
  hostname: "0.0.0.0",
  port: 8787,
})