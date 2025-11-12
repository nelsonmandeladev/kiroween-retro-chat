import { Injectable, Logger } from '@nestjs/common';
import { Redis } from '@upstash/redis';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private redis: Redis | null = null;

  constructor() {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      this.logger.warn(
        'Redis configuration missing. Online status tracking will be disabled.',
      );
      return;
    }

    if (!url.startsWith('https://')) {
      this.logger.error(
        `Invalid Redis REST URL. Expected https:// URL but got: ${url.substring(0, 20)}...`,
      );
      this.logger.warn(
        'Please use the REST URL from Upstash dashboard (starts with https://)',
      );
      return;
    }

    try {
      this.redis = new Redis({ url, token });
      this.logger.log('Redis connection initialized successfully');
    } catch (error) {
      this.logger.error(
        `Failed to initialize Redis: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async setUserOnline(userId: string, socketId: string): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.set(`user:${userId}:socket`, socketId, { ex: 86400 }); // 24 hours
      await this.redis.set(`socket:${socketId}:user`, userId, { ex: 86400 });
      this.logger.log(`User ${userId} set online with socket ${socketId}`);
    } catch (error) {
      this.logger.error(
        `Failed to set user online: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async setUserOffline(userId: string): Promise<void> {
    if (!this.redis) return;

    try {
      const socketId = await this.redis.get<string>(`user:${userId}:socket`);
      if (socketId) {
        await this.redis.del(`socket:${socketId}:user`);
      }
      await this.redis.del(`user:${userId}:socket`);
      this.logger.log(`User ${userId} set offline`);
    } catch (error) {
      this.logger.error(
        `Failed to set user offline: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async getUserBySocket(socketId: string): Promise<string | null> {
    if (!this.redis) return null;

    try {
      return await this.redis.get<string>(`socket:${socketId}:user`);
    } catch (error) {
      this.logger.error(
        `Failed to get user by socket: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  async getSocketByUser(userId: string): Promise<string | null> {
    if (!this.redis) return null;

    try {
      return await this.redis.get<string>(`user:${userId}:socket`);
    } catch (error) {
      this.logger.error(
        `Failed to get socket by user: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  async isUserOnline(userId: string): Promise<boolean> {
    if (!this.redis) return false;

    try {
      const socketId = await this.redis.get<string>(`user:${userId}:socket`);
      return !!socketId;
    } catch (error) {
      this.logger.error(
        `Failed to check user online status: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }
}
