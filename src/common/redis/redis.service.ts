// redis.service.ts

import { Injectable, Inject, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private readonly client: Redis) {}

  async set(
    key: string,
    value: string | object,
    ttlInSecond: number,
  ): Promise<void> {
    value = typeof value === 'string' ? value : JSON.stringify(value);
    const result = await this.client.set(key, value, 'EX', ttlInSecond);
    if (result != 'OK') {
      throw new Error('Something went wrong with redis'); // or throw the error as per your needs
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async getMultipleKeys(keys: string[]) {
    try {
      const values = await this.client.mget(keys);
      return values; // Array containing values for the requested keys, or null if any key is missing
    } catch (error) {
      console.error('Error fetching multiple keys from Redis:', error);
      // Handle errors appropriately, e.g., return an empty array or throw a custom error
      return []; // Or throw an error depending on your needs
    }
  }

  async getKeysByPattern(pattern: string): Promise<string[]> {
    const keys = await this.client.keys(pattern);
    return keys;
  }

  async fetchValuesByPattern(pattern: string): Promise<object[]> {
    let cursor = '0';
    const keys: string[] = [];

    // Use SCAN to iterate over keys matching the pattern
    do {
      const [newCursor, partialKeys] = await this.client.scan(
        cursor,
        'MATCH',
        pattern,
      );
      keys.push(...partialKeys);
      cursor = newCursor;
    } while (cursor !== '0');

    const data = await Promise.all(
      keys.map(async (key) => JSON.parse(await this.client.get(key))),
    );
    return data;
  }

  // To set multiple key inside in transactional fasion
  async setMultiObjectWithTtl(
    data: { key: string; value: string | object; ttl: number }[],
  ): Promise<void> {
    try {
      const commands = [];
      for (const item of data) {
        const redisKey = `${item.key}`; // Customize key generation if required
        const valueToStore =
          typeof item.value === 'string'
            ? item.value
            : JSON.stringify(item.value);
        commands.push(this.client.set(redisKey, valueToStore));
        commands.push(this.client.expire(redisKey, item.ttl));
      }
      await this.client.multi(...commands).exec();
    } catch (err) {
      console.error('Error setting objects with TTL:', err);
      throw new Error(err); // Or handle the error differently based on your needs
    }
  }
  async updateBookingCount(
    slotId: string,
    bookingCount: number,
  ): Promise<string | null> {
    const luaScript = `
      local key = KEYS[1]
      local bookingCount = tonumber(ARGV[1])
      
      local data = redis.call('GET', key)
      if not data then
          return "invalid slot id"
      end
      
      local scheduleData = cjson.decode(data)
      local currentBooking = scheduleData.currentBooking + bookingCount
      
      if currentBooking > scheduleData.maxBooking then
          return "Booking count exceeds maximum allowed"
      end
      
      scheduleData.currentBooking = currentBooking
      redis.call('SET', key, cjson.encode(scheduleData))
      return nil
    `;

    const result = await this.client.eval(
      luaScript,
      1,
      slotId,
      bookingCount.toString(),
    );
    if (
      result === 'invalid slot id' ||
      result === 'Booking count exceeds maximum allowed'
    ) {
      return result;
    }

    return null; // No error, booking count updated successfully
  }

  async deleteKeysByPattern(pattern: string): Promise<number> {
    const keys = await this.client.keys(pattern);
    if (keys.length === 0) {
      return 0;
    }
    const pipeline = this.client.pipeline();
    keys.forEach((key) => pipeline.del(key));
    const results = await pipeline.exec();
    return results.length;
  }
}
