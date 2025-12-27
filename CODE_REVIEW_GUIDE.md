# Code Review Guide - Cursor AI

## Overview

Proyek ini menggunakan Cursor AI untuk membantu code review dengan konfigurasi yang sudah disetup di `.cursorrules` dan `.cursorreview`.

## Quick Start

### 1. Automatic Code Review
Cursor AI akan otomatis memberikan suggestions saat Anda menulis code berdasarkan rules di `.cursorrules`.

### 2. Manual Code Review Commands

Gunakan command berikut di Cursor AI chat untuk review code:

#### Performance Review
```
Review this code for performance issues
Check for N+1 query problems
Find database query optimizations
Verify caching implementation
```

#### Security Review
```
Check for security vulnerabilities
Review authentication and authorization
Verify input validation
Check for sensitive data exposure
```

#### Code Quality Review
```
Review TypeScript best practices
Check error handling
Verify singleton pattern usage
Review code structure and organization
```

#### Pattern Compliance
```
Check if singleton pattern is used correctly
Verify Util.getInstance() usage
Check date utility usage (no moment.js)
Verify soft delete checks
```

## Review Checklist

### Before Committing Code

#### Performance ✅
- [ ] Menggunakan `Util.getInstance()` bukan `new Util()`
- [ ] Menggunakan `RedisLib.getInstance()` bukan `new RedisLib()`
- [ ] Menggunakan `date.util.ts` bukan `moment.js`
- [ ] Query menggunakan pagination
- [ ] Complex queries menggunakan QueryBuilder
- [ ] Tidak ada N+1 query problems
- [ ] Caching diimplementasikan untuk frequently accessed data

#### Error Handling ✅
- [ ] Semua async operations dalam try-catch
- [ ] Error di-log menggunakan `Util.getInstance().loggingError()`
- [ ] HTTP status codes sesuai (200, 201, 400, 401, 404, 500)
- [ ] Error messages meaningful untuk client

#### Database ✅
- [ ] Soft delete checks (`deletedBy IS NULL`, `deletedAt IS NULL`)
- [ ] Transactions untuk multi-step operations
- [ ] Menggunakan `leftJoinAndSelect` atau `relations` untuk avoid N+1
- [ ] Proper indexes untuk frequently queried columns

#### Security ✅
- [ ] Tidak ada sensitive data di logs
- [ ] Input validation menggunakan Zod schemas
- [ ] Authentication/authorization checks
- [ ] Parameterized queries (TypeORM handles this)

#### Code Quality ✅
- [ ] TypeScript types proper (minimal `any`)
- [ ] Functions focused dan tidak terlalu panjang (<100 lines)
- [ ] Consistent naming conventions
- [ ] Proper logging (request, response, error)

## Common Issues & Fixes

### Issue: Using `new Util()` instead of singleton
```typescript
// ❌ Bad
const util = new Util();

// ✅ Good
const util = Util.getInstance();
```

### Issue: Using moment.js
```typescript
// ❌ Bad
import moment from "moment";
moment(date).format("YYYY-MM-DD");

// ✅ Good
import { formatDate } from "../lib/date.util";
formatDate(date);
```

### Issue: Missing soft delete check
```typescript
// ❌ Bad
const data = await repo.findOne({ where: { uuid } });

// ✅ Good
const data = await repo.findOne({ 
  where: { uuid, deletedBy: IsNull() } 
});
```

### Issue: N+1 Query Problem
```typescript
// ❌ Bad
const items = await itemRepo.find();
for (const item of items) {
  const detail = await detailRepo.findOne({ 
    where: { item_id: item.id } 
  });
}

// ✅ Good
const items = await itemRepo
  .createQueryBuilder("item")
  .leftJoinAndSelect("item.details", "details")
  .where("item.deletedBy IS NULL")
  .getMany();
```

### Issue: Missing error handling
```typescript
// ❌ Bad
const data = await repo.find();
return res.json({ data });

// ✅ Good
try {
  const data = await repo.find();
  util.loggingRes(req, { data });
  return res.json({ data });
} catch (error: any) {
  util.loggingError(req, error.message);
  return res.status(400).json({ message: error.message });
}
```

## Review Workflow

### 1. Pre-Commit Review
Sebelum commit, gunakan Cursor AI untuk review:
- Select code yang akan di-commit
- Ask: "Review this code for issues"
- Fix issues yang ditemukan

### 2. Pull Request Review
Saat membuat PR:
- Cursor AI akan otomatis check berdasarkan `.cursorrules`
- Review semua suggestions
- Fix critical dan high priority issues

### 3. Continuous Review
- Cursor AI akan memberikan real-time suggestions
- Pay attention to warnings dan errors
- Fix issues sebelum mereka accumulate

## Priority Levels

### 🔴 Critical (Must Fix Immediately)
- Security vulnerabilities
- Breaking changes
- Data loss risks
- Performance issues yang menyebabkan downtime

### 🟡 High Priority (Fix Before Merge)
- Code quality issues
- Best practice violations
- Missing error handling
- TypeScript errors

### 🟢 Medium Priority (Fix in Next Sprint)
- Code style inconsistencies
- Missing comments
- Optimization opportunities

## Tips untuk Effective Code Review

1. **Review Small Chunks**: Review code dalam chunks kecil untuk lebih fokus
2. **Use Specific Commands**: Gunakan specific commands untuk targeted review
3. **Fix Issues Immediately**: Fix issues saat ditemukan, jangan accumulate
4. **Learn from Suggestions**: Use suggestions untuk improve coding skills
5. **Keep Rules Updated**: Update `.cursorrules` sesuai dengan project evolution

## Integration dengan Development Workflow

### VS Code / Cursor
1. Install Cursor AI extension
2. `.cursorrules` akan otomatis digunakan
3. Get real-time suggestions saat coding

### Git Hooks (Optional)
Bisa setup pre-commit hook untuk run automated checks:
```bash
# .git/hooks/pre-commit
npm run lint
npm run type-check
```

## Resources

- `.cursorrules` - Complete code review rules
- `.cursorreview` - Review configuration
- `PERFORMANCE_OPTIMIZATIONS.md` - Performance guidelines
- `FIXES_SUMMARY.md` - Summary of fixes applied

## Questions?

Jika ada pertanyaan tentang code review process atau rules, check:
1. `.cursorrules` file
2. `PERFORMANCE_OPTIMIZATIONS.md`
3. Team lead atau senior developers

