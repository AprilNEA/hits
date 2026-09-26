import { DurableObject } from "cloudflare:workers";
import { counterValue } from "../lib/count";

export class CloudflareCounter extends DurableObject {
	async getCounterValue() {
		return counterValue(await this.ctx.storage.get<number>("value"));
	}

	async increment() {
		const value = counterValue((await this.getCounterValue()) + 1);
		await this.ctx.storage.put("value", value);
		return value;
	}
}
