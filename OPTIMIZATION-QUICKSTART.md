# Quick Start: Optimized API Testing

## 🚀 Steps to Deploy Optimization

### 1. Apply Database Index (CRITICAL!)
```powershell
npx prisma db push
```

### 2. Restart Your Dev Server
```powershell
# Press Ctrl+C to stop
npm run dev
```

### 3. Run Performance Tests

#### Option A: Quick Test (Recommended First)
```powershell
node compare-performance.js
```
This runs both cached and uncached tests automatically and shows comparison.

#### Option B: Individual Tests
```powershell
# Test optimized (URLs only)
node load-test-apaar.js urlsOnly

# Test full data
node load-test-apaar.js fullData

# Stress test
node load-test-apaar.js highLoad
```

#### Option C: Direct CLI
```powershell
# Quick 10-second test
npx autocannon -c 100 -d 10 "http://localhost:3000/api/certificates-by-apaar?apaarId=2&fields=urls"
```

---

## 📊 Expected Results

### Before Optimization (Your Current Stats)
- ❌ Latency: **5596ms** (5.6 seconds!)
- ❌ Throughput: **16.54 req/s**
- ❌ p99: **8920ms**

### After Optimization (Target)
- ✅ Latency: **<100ms** (50-100x faster!)
- ✅ Throughput: **>500 req/s** (30x improvement!)
- ✅ p99: **<200ms** (45x faster!)

---

## 🎯 API Usage

### For Best Performance (URLs Only)
```
GET /api/certificates-by-apaar?apaarId=YOUR_ID&fields=urls
```

### For Full Details
```
GET /api/certificates-by-apaar?apaarId=YOUR_ID&fields=full
```

### Bypass Cache (Testing)
```
GET /api/certificates-by-apaar?apaarId=YOUR_ID&nocache=1
```

---

## ✅ Quick Validation

After running tests, check for:
- [ ] Average latency < 100ms
- [ ] Requests/sec > 500
- [ ] Response includes `"cached": true` on repeat requests
- [ ] No errors in console

---

## 🐛 If Performance is Still Poor

1. **Verify index is applied:**
   ```powershell
   # Check schema
   cat prisma/schema.prisma | Select-String "apaarId"
   # Should show: @@index([apaarId])
   ```

2. **Check cache is working:**
   ```powershell
   # First request (cache miss)
   curl "http://localhost:3000/api/certificates-by-apaar?apaarId=2&fields=urls"
   
   # Second request (should be cache hit with "cached": true)
   curl "http://localhost:3000/api/certificates-by-apaar?apaarId=2&fields=urls"
   ```

3. **Monitor MongoDB:**
   - Check MongoDB Atlas dashboard
   - Verify connection pool
   - Check for slow queries

---

## 📖 Full Documentation

See `API-OPTIMIZATION-GUIDE.md` for complete details on:
- All optimization techniques
- Scaling recommendations
- Troubleshooting guide
- Production best practices

---

## 🎉 Success Criteria

Your API is optimized when you see:
- ✅ Cache hit rate >80%
- ✅ Average latency <100ms
- ✅ Throughput >500 req/s
- ✅ Zero errors under load
- ✅ Consistent performance

**Ready for production! 🚀**
