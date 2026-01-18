# Performance Optimizations

Dokumen ini menjelaskan optimasi performa yang telah diterapkan pada codebase.

## 1. Bundle Size Optimizations

### ✅ Menghapus Dependencies yang Tidak Diperlukan
- **moment.js** dan **moment-timezone**: Diganti dengan utility functions menggunakan native Date API
  - Mengurangi bundle size sekitar ~70KB (gzipped)
  - Native Date lebih cepat dan lebih ringan
  - File: `src/lib/date.util.ts`

- **react-social-media-embed**: Dihapus karena tidak digunakan di backend

### Manfaat
- Bundle size berkurang signifikan
- Waktu startup lebih cepat
- Memory footprint lebih kecil

## 2. Database Optimizations

### ✅ Connection Pooling
- Ditambahkan connection pooling configuration di `data-source.ts`
- `connectionLimit: 10` - maksimal 10 koneksi simultan
- `acquireTimeout: 60000` - timeout 60 detik untuk mendapatkan koneksi
- `poolSize: 10` - ukuran pool koneksi

### Manfaat
- Mengurangi overhead pembuatan koneksi baru
- Meningkatkan throughput untuk concurrent requests
- Lebih efisien dalam penggunaan resource database

## 3. Caching Strategy

### ✅ Redis Caching Middleware
- Middleware caching baru: `src/middlewares/cache.middleware.ts`
- Dapat digunakan pada endpoint yang sering diakses
- Configurable TTL (Time To Live)
- Custom key generator support

### Contoh Penggunaan
```typescript
import { cacheMiddleware } from '../middlewares/cache.middleware';

// Cache dengan TTL 5 menit (default)
router.get("/api/public/players", cacheMiddleware(), playerCon.list);

// Cache dengan TTL custom (1 jam)
router.get("/api/public/tournaments", cacheMiddleware(3600), tourCon.list);

// Cache dengan custom key generator
router.get("/api/public/player/:uuid", 
  cacheMiddleware(600, (req) => `player:${req.params.uuid}`), 
  playerCon.detail
);
```

### Manfaat
- Mengurangi beban database untuk data yang jarang berubah
- Response time lebih cepat untuk cached data
- Mengurangi bandwidth usage

## 4. Middleware Optimizations

### ✅ Compression Middleware
- Ditambahkan `compression` middleware untuk gzip response
- Mengurangi ukuran response hingga 70-90% untuk JSON/text
- Otomatis mengompres response yang lebih besar dari threshold

### ✅ Body Parser Optimization
- Limit ditingkatkan menjadi 10MB untuk upload file
- Lebih efisien dalam handling large payloads

### ✅ CORS Optimization
- Konfigurasi CORS yang lebih spesifik
- Support untuk credentials

## 5. Instance Creation Optimization

### ✅ Singleton Pattern untuk Util dan RedisLib
- `Util.getInstance()` - reuse instance daripada membuat baru setiap kali
- `RedisLib.getInstance()` - reuse redis connection
- Mengurangi overhead object creation

### Rekomendasi untuk Controller
Ganti:
```typescript
const utilLib = new Util();
```

Dengan:
```typescript
const utilLib = Util.getInstance();
```

Sama untuk RedisLib:
```typescript
const redisLib = RedisLib.getInstance();
```

### Manfaat
- Mengurangi memory allocation
- Lebih cepat karena reuse instance
- Konsisten dengan connection management

## 6. Query Optimizations

### Rekomendasi
1. **Gunakan QueryBuilder untuk complex queries** - sudah banyak digunakan
2. **Tambahkan indexes pada kolom yang sering di-query**:
   - `deletedBy`, `deletedAt` - untuk soft delete filtering
   - `uuid` - untuk lookup
   - `status` - untuk filtering by status
   - Foreign keys - untuk join operations

3. **Hindari N+1 queries** - gunakan `leftJoinAndSelect` atau `relations`

4. **Pagination** - sudah banyak digunakan dengan `skip()` dan `take()`

## 7. Monitoring & Error Handling

### Rekomendasi untuk Production
1. Tambahkan request timeout middleware
2. Implementasi rate limiting untuk API endpoints
3. Monitoring dengan APM tools (New Relic sudah terpasang)
4. Structured logging dengan correlation IDs

## 8. Build Optimizations

### TypeScript Compilation
- Pastikan `skipLibCheck: true` sudah aktif (sudah ada)
- Consider menggunakan `incremental: true` untuk faster builds

### Production Build
```bash
npm run build
```

## Metrics yang Diharapkan

Setelah optimasi ini, diharapkan:
- **Bundle size**: Berkurang ~70KB+ (dari penghapusan moment.js)
- **Response time**: 20-50% lebih cepat untuk cached endpoints
- **Database load**: 30-60% berkurang untuk frequently accessed data
- **Memory usage**: 10-20% lebih efisien dari singleton pattern
- **Network bandwidth**: 70-90% berkurang dari compression

## Next Steps

1. ✅ Implementasi caching pada endpoints yang sering diakses:
   - Public player listings
   - Tournament listings
   - Product listings
   - Blog listings

2. ✅ Update controllers untuk menggunakan singleton pattern:
   - Ganti `new Util()` dengan `Util.getInstance()`
   - Ganti `new RedisLib()` dengan `RedisLib.getInstance()`

3. ⚠️ Tambahkan database indexes untuk kolom yang sering di-query

4. ⚠️ Implementasi cache invalidation strategy

5. ⚠️ Tambahkan request timeout dan rate limiting

6. ⚠️ Setup monitoring dan alerting

## Testing

Setelah optimasi, lakukan testing:
- Load testing untuk melihat improvement
- Memory profiling
- Response time monitoring
- Database query performance

