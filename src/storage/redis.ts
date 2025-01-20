import { createStorage } from "unstorage";
import redisDriver from "unstorage/drivers/redis";
import Counter from "../lib/count";

const storage = createStorage({
  driver: redisDriver({
    base: "hits",
    url: process.env.REDIS_URL,
  }),
});

export const counter = new Counter(storage)