// redis.service.ts

import { Injectable, Inject, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

  async set(
    key: string,
    value: string | object,
    ttlInSecond = 10,
  ): Promise<void> {
    if (typeof value === 'object') value = JSON.stringify(value);
    const result = await this.redisClient.set(key, value, 'EX', ttlInSecond);
    Logger.log(`Redis Set key : ${key} `, result);
    if (result != 'OK') {
      throw new Error();
    }
  }

  async get(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }
}
