import type { Storage } from "unstorage";

export default class Counter {
  constructor(private storage: Storage) { }

  async getCounterValue(key: string) {
    const count = await this.storage.getItem(key)
    return count ? Number(count) : 0
  }

  async setCount(key: string, value: number) {
    return await this.storage.setItem(key, String(value))
  }

  async increment(key: string) {
    const value = (await this.getCounterValue(key)) + 1
    await this.setCount(key, value)
    return value
  }
}