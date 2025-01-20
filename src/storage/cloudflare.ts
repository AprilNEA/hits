import { DurableObject } from 'cloudflare:workers'

export class CloudflareCounter extends DurableObject {
  async getCounterValue() {
    const value = (await this.ctx.storage.get('value')) || 0
    return value
  }

  async increment(amount = 1) {
    const value: number = (Number(await this.ctx.storage.get('value')) || 0) + amount
    await this.ctx.storage.put('value', value)
    return value
  }

  async decrement(amount = 1) {
    const value: number = (Number(await this.ctx.storage.get('value')) || 0) - amount

    await this.ctx.storage.put('value', value)
    return value
  }
}