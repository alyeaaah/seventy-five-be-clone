import { Container } from "typedi";
export default class RedisLib {
  private redis: any;

  constructor() {
    this.redis = Container.get("redis");
  }

  async redisget(key: string): Promise<object> {
    if (typeof key !== "string") {
      throw new TypeError("Invalid argument type");
    }
    return JSON.parse(await this.redis.get(key));
  }
  async redisset(key: string, value: any, ttl: number = 0) {
    if (typeof key !== "string") {
      throw new TypeError("Invalid argument type");
    }
    if(ttl > 0) {
      await this.redis.set(key, JSON.stringify(value), { EX: ttl });
    }else {
      await this.redis.set(key, JSON.stringify(value));
    }
  }
  async redisdel(key: string) {
    if (typeof key !== "string") {
      throw new TypeError("Invalid argument type");
    }
    await this.redis.del(key);
  }
}

