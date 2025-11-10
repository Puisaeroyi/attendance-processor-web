# Phase 3: Performance Optimizations Implementation

**Date:** 2025-11-10
**Priority:** High
**Timeline:** 2-3 days
**Implementation Status:** Not Started
**Review Status:** Pending

## Context Links
- **Parent Plan:** [plan.md](./plan.md)
- **Dependencies:** Existing API routes, processor page
- **Synergy:** [Phase 1 Analytics](./phase-01-analytics-dashboard.md) - cache analytics data

## Overview

Optimize user experience for large file processing with faster feedback, background processing, caching, and optimized rendering. Focus: streaming progress, IndexedDB caching, React Suspense, optional Web Workers for Excel parsing.

## Key Insights from Research

**Next.js 15 Performance Features:**
- **Server Actions:** Streaming responses with `ReadableStream`
- **React Suspense:** Built-in loading states, no manual flags
- **Streaming SSR:** Partial page loads (not applicable to client upload)
- **Edge Runtime:** Faster cold starts (optional for API routes)

**Caching Strategy:**
- **IndexedDB > localStorage:** Handles large data (>10MB), structured queries
- **Cache Key:** Hash of file content + config (detect re-uploads)
- **TTL:** Auto-expire old results (e.g., 7 days)
- **Quota:** Browser limits ~50MB-100MB (Chrome), show usage warning

**Web Workers:**
- **Pros:** Offload Excel parsing to background thread (non-blocking UI)
- **Cons:** Complex setup, message passing overhead, limited libraries (ExcelJS works)
- **Trade-off:** Only beneficial for files >5MB or 10k+ rows

**React Performance:**
- **Virtualization:** For large tables (1000+ rows) use `react-window`
- **Memo:** Prevent chart re-renders (`React.memo`, `useMemo`)
- **Code Splitting:** Lazy load analytics dashboard (`React.lazy`)

## Requirements

**Functional:**
- **Streaming Progress:**
  - Show progress bar during processing (0-100%)
  - Display status messages ("Parsing Excel...", "Detecting bursts...")
  - Real-time updates (no frozen UI)
- **Result Caching:**
  - Cache processed results in IndexedDB
  - Detect re-uploads (same file hash), return cached instantly
  - Show cache indicator ("Loaded from cache")
  - Clear cache button (manual cleanup)
- **Optimized Rendering:**
  - Lazy load analytics dashboard (code splitting)
  - Virtualize large result tables (>100 rows)
  - Memo expensive chart calculations
- **Background Processing (Optional):**
  - Web Worker for Excel parsing (if >5MB file)
  - Keep UI responsive during processing

**Non-Functional:**
- Cache read <100ms (IndexedDB query)
- Progress updates every 500ms (smooth UI)
- UI remains interactive during processing (no freeze)
- Bundle increase ≤30KB (excluding Web Worker script)

## Architecture

**Streaming API Flow:**
```
Client                    Server (API Route)
  |                              |
  |------ POST file ------------>|
  |                              | Parse Excel
  |<--- Progress: 20% -----------|
  |                              | Detect bursts
  |<--- Progress: 50% -----------|
  |                              | Detect shifts
  |<--- Progress: 80% -----------|
  |                              | Generate output
  |<--- Progress: 100% + Data ---|
  |                              |
  |--- Cache result (IndexedDB) -|
```

**Caching Architecture:**
- **Cache Key:** `SHA256(file content + config JSON)`
- **Storage:** IndexedDB database `attendance-cache`
- **Schema:** `{ key, result, analyticsData, timestamp, fileSize }`
- **TTL:** 7 days (configurable)
- **Quota Check:** Show warning if >80% storage used

**Component Optimizations:**
```
app/processor/page.tsx
  ├─ React.Suspense (fallback: loading skeleton)
  │   └─ React.lazy(() => import('AnalyticsDashboard'))
  └─ VirtualizedResultTable (react-window)
```

## Related Code Files

**Existing (Modify):**
- `app/processor/page.tsx` - Add progress state, caching logic
- `app/api/v1/processor/route.ts` - Add streaming response
- `components/analytics/AnalyticsDashboard.tsx` - Lazy load, memoize

**New (Create):**
- `lib/cache/indexedDBCache.ts` - IndexedDB wrapper (get/set/clear)
- `lib/cache/fileHash.ts` - SHA256 hash of file content
- `lib/workers/excelWorker.ts` - Web Worker for Excel parsing (optional)
- `components/processor/ProgressBar.tsx` - Streaming progress UI
- `components/processor/VirtualizedTable.tsx` - react-window wrapper
- `hooks/useStreamingProcessor.ts` - Custom hook for streaming API
- `hooks/useResultCache.ts` - Custom hook for IndexedDB cache

## Implementation Steps

1. **Implement IndexedDB Cache:**
   - Create `indexedDBCache.ts` with `get()`, `set()`, `clear()`, `getUsage()`
   - Use `idb` library (optional: `npm install idb`) or native API
   - Handle quota exceeded errors gracefully
2. **Add File Hashing:**
   - Create `fileHash.ts` using `crypto.subtle.digest('SHA-256', buffer)`
   - Generate cache key: `await hashFile(file) + JSON.stringify(config)`
3. **Create Cache Hook:**
   - `useResultCache()` hook: check cache before API call
   - If hit: return cached result immediately
   - If miss: proceed with API, cache response
4. **Implement Streaming API:**
   - Modify `/api/v1/processor/route.ts` to return `ReadableStream`
   - Use `TransformStream` to send progress updates:
     ```ts
     const stream = new TransformStream();
     const writer = stream.writable.getWriter();
     writer.write(JSON.stringify({ progress: 20, status: 'Parsing...' }));
     // ... processing ...
     writer.write(JSON.stringify({ progress: 100, result: data }));
     writer.close();
     return new Response(stream.readable);
     ```
5. **Create Streaming Hook:**
   - `useStreamingProcessor()` hook: consume ReadableStream
   - Parse chunks, update progress state
   - Handle completion, errors
6. **Add Progress UI:**
   - `ProgressBar` component with percentage, status message
   - Animate progress bar (smooth transitions)
   - Show in processor page during processing
7. **Implement Lazy Loading:**
   - Wrap `AnalyticsDashboard` in `React.lazy()`
   - Add `Suspense` with loading skeleton
   - Reduce initial bundle size
8. **Add Virtualization (Optional):**
   - Install `react-window` (`npm install react-window`)
   - Create `VirtualizedTable` for result rows
   - Render only visible rows (performance for 1000+ rows)
9. **Memoize Expensive Calculations:**
   - Wrap analytics calculations in `useMemo()`
   - Memoize chart components with `React.memo()`
10. **Web Worker (Optional, Low Priority):**
    - Create `excelWorker.ts` with ExcelJS parsing
    - Post file buffer to worker, receive parsed data
    - Only use for large files (detect size threshold)
11. **Add Cache Management UI:**
    - Show cache status: "Result from cache (2 min ago)"
    - "Clear cache" button in processor page
    - Display storage usage: "Using 5MB / 50MB"
12. **Test Performance:**
    - Upload 10k row file, verify streaming progress
    - Re-upload same file, verify cache hit (<100ms)
    - Test with slow network (throttle in DevTools)
    - Measure bundle size increase

## Todo List

- [ ] Install `idb` library for IndexedDB (optional)
- [ ] Implement `indexedDBCache.ts` (get/set/clear/usage)
- [ ] Implement `fileHash.ts` (SHA256 hashing)
- [ ] Create `useResultCache` hook
- [ ] Modify API route for streaming response
- [ ] Create `useStreamingProcessor` hook
- [ ] Build `ProgressBar` component
- [ ] Add progress state to processor page
- [ ] Lazy load `AnalyticsDashboard` with Suspense
- [ ] Memoize analytics calculations
- [ ] Install `react-window` (if needed)
- [ ] Create `VirtualizedTable` component
- [ ] Add cache status indicator to UI
- [ ] Add "Clear cache" button
- [ ] Test cache hit/miss scenarios
- [ ] Test streaming with large file (10k rows)
- [ ] Test UI responsiveness during processing
- [ ] Measure performance improvements (before/after)
- [ ] (Optional) Implement Web Worker for Excel parsing

## Success Criteria

- [ ] Cache hit returns result <100ms
- [ ] Progress bar updates smoothly during processing
- [ ] UI remains interactive (no freeze) during 10k row processing
- [ ] Re-upload same file, instant result from cache
- [ ] Cache indicator shows "Loaded from cache"
- [ ] Clear cache button works (removes all cached results)
- [ ] Storage usage displayed accurately
- [ ] Quota exceeded handled gracefully (error message)
- [ ] Lazy loading reduces initial bundle by ~30KB
- [ ] Virtualized table renders 1000+ rows smoothly
- [ ] Analytics charts don't re-render unnecessarily
- [ ] All performance tests pass

## Risk Assessment

**MEDIUM RISK - Browser Compatibility:**
- **Impact:** IndexedDB not supported in old browsers (IE11)
- **Mitigation:** Feature detection, graceful degradation (disable caching)

**MEDIUM RISK - Storage Quota:**
- **Impact:** User runs out of storage, cache writes fail
- **Mitigation:**
  1. Check quota before write (`navigator.storage.estimate()`)
  2. Show warning at 80% usage
  3. Auto-delete oldest entries (LRU eviction)
  4. Manual "Clear cache" button

**LOW RISK - Streaming API Complexity:**
- **Impact:** ReadableStream harder to debug than JSON response
- **Mitigation:**
  1. Keep JSON fallback for errors
  2. Test with network throttling
  3. Handle stream cancellation (user navigates away)

**LOW RISK - Web Worker Overhead:**
- **Impact:** Message passing slower than direct parsing for small files
- **Mitigation:** Only use worker for large files (>5MB threshold)

**Questions:**
- Should cache persist across browser sessions? (Yes, IndexedDB persists)
- Encrypt cached data? (No, not sensitive - attendance public to operators)
- Sync cache across tabs? (Use `BroadcastChannel` API - future enhancement)

## Security Considerations

**Cache Poisoning:**
- **Risk:** Attacker tricks user into caching malicious data
- **Mitigation:** Hash includes file content + config (can't spoof)

**Storage Exhaustion:**
- **Risk:** Attacker fills storage quota with junk data
- **Mitigation:** TTL (auto-expire), manual clear, quota check

**Data Privacy:**
- **Risk:** Cached results contain attendance data
- **Mitigation:** IndexedDB isolated per origin, not cross-site accessible

**No Sensitive Data:**
- Attendance records not sensitive (public to operators)
- No passwords/tokens in cache
- Safe to persist in browser

## Next Steps After Completion

1. Monitor performance metrics (Google Analytics, Web Vitals)
2. Add service worker for offline processing (PWA)
3. Implement cache sync across tabs (BroadcastChannel)
4. Add export cached results feature
5. Optimize bundle size further (tree-shaking, code splitting)
6. Consider server-side caching (Redis) for multi-user deployments
