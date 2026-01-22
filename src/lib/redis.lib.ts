import { Container } from "typedi";
export default class RedisLib {
  private static instance: RedisLib;
  private redis: any;

  private constructor() {
    try {
      this.redis = Container.get("redis");
    } catch (e) {
      this.redis = null;
    }
  }

  // Singleton pattern untuk reuse instance
  static getInstance(): RedisLib {
    if (!RedisLib.instance) {
      RedisLib.instance = new RedisLib();
    }
    return RedisLib.instance;
  }

  // Update redis connection jika diperlukan
  updateRedisConnection() {
    try {
      this.redis = Container.get("redis");
    } catch (e) {
      this.redis = null;
    }
  }

  async redisget(key: string): Promise<object | null> {
    if (typeof key !== "string") {
      throw new TypeError("Invalid argument type");
    }
    if (!this.redis) {
      return null;
    }
    try {
      const value = await this.redis.get(key);
      if (!value) return null;
      return JSON.parse(value);
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }
  async redisset(key: string, value: any, ttl: number = 0) {
    if (typeof key !== "string") {
      throw new TypeError("Invalid argument type");
    }
    if (!this.redis) {
      throw new Error("Redis connection not available");
    }
    try {
      if(ttl > 0) {
        await this.redis.set(key, JSON.stringify(value), { EX: ttl });
      } else {
        await this.redis.set(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error('Redis set error:', error);
      throw error;
    }
  }
  async redisdel(key: string) {
    if (typeof key !== "string") {
      throw new TypeError("Invalid argument type");
    }
    if (!this.redis) {
      throw new Error("Redis connection not available");
    }
    await this.redis.del(key);
  }

  async redisdelPattern(pattern: string) {
    if (typeof pattern !== "string") {
      throw new TypeError("Invalid argument type");
    }
    if (!this.redis) {
      throw new Error("Redis connection not available");
    }
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(keys);
      }
      return keys.length;
    } catch (error) {
      console.error('Redis del pattern error:', error);
      throw error;
    }
  }
}

