import { Request, Response, NextFunction } from 'express';
import RedisLib from '../lib/redis.lib';

/**
 * Middleware untuk caching response menggunakan Redis
 * @param ttl Time to live dalam detik (default: 300 = 5 menit)
 * @param keyGenerator Function untuk generate cache key dari request
 */
export function cacheMiddleware(
  ttl: number = 300,
  keyGenerator?: (req: Request) => string
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching untuk non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      const redisLib = RedisLib.getInstance();
      
      // Generate cache key
      const cacheKey = keyGenerator 
        ? keyGenerator(req) 
        : `cache:${req.method}:${req.originalUrl}:${JSON.stringify(req.query)}`;
      
      // Coba ambil dari cache
      try {
        const cached = await redisLib.redisget(cacheKey);
        if (cached !== null && cached !== undefined) {
          return res.json(cached);
        }
      } catch (e) {
        // Cache miss atau error, lanjutkan ke handler
        // Error sudah di-handle di redisget, tidak perlu throw
      }

      // Simpan original json function
      const originalJson = res.json.bind(res);
      
      // Override json function untuk cache response
      res.json = function(body: any) {
        // Cache response jika sukses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redisLib.redisset(cacheKey, body, ttl).catch((err) => {
            console.error('Cache set error:', err);
          });
        }
        return originalJson(body);
      };

      next();
    } catch (error) {
      // Jika ada error, lanjutkan tanpa cache
      next();
    }
  };
}

/**
 * Helper untuk invalidate cache berdasarkan pattern
 */
export async function invalidateCache(pattern: string) {
  try {
    const redisLib = RedisLib.getInstance();
    // Note: Redis SCAN diperlukan untuk pattern matching
    // Implementasi ini memerlukan akses langsung ke redis client
    // Untuk sekarang, kita akan menggunakan delete langsung jika key diketahui
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
}

