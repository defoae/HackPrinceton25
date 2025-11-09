# CRITICAL DEBUGGING SESSION - Next Steps

## What I've Done

1. **Added comprehensive logging** to `createBadge()` function
   - Logs every step of shortcode extraction
   - Shows if article found, mediaLink found, queryRef result
   - Shows link fallback attempts
   - Alerts if shortcode extraction completely fails

2. **Added 3 debug helper functions**:
   - `window.testShortcodeExtraction()` - Tests extraction logic on current page
   - `window.inspectBadges()` - Shows shortcodes stored in all badges
   - `window.testInstagramAPI()` - Tests API calls (enhanced for home feed)

3. **Created DEBUGGING_STEPS.md** with step-by-step protocol

## What We Need to Find Out

**The shortcode extraction is failing, but we don't know WHY yet.**

Possible reasons:
1. `getValueByKey` function not loaded
2. Instagram changed DOM structure (selector not working)
3. Badge created too early (before React renders)
4. Video not inside `<article>` element
5. Links not where we expect them

## Your Action Items

### IMMEDIATE: Reload Extension
1. `chrome://extensions/` → Reload SlopGuard
2. Go to instagram.com home feed
3. Open DevTools Console (F12)

### RUN THESE COMMANDS IN CONSOLE (Copy-paste each one)

#### Command 1: Check if functions loaded
```javascript
console.log({
  getValueByKey: typeof getValueByKey,
  getPostPhotos: typeof getPostPhotos,
  testShortcodeExtraction: typeof window.testShortcodeExtraction,
  inspectBadges: typeof window.inspectBadges
});
```

#### Command 2: Test shortcode extraction
```javascript
window.testShortcodeExtraction()
```

#### Command 3: Wait and scroll to video
After scrolling to a video and seeing the badge appear:
```javascript
window.inspectBadges()
```

#### Command 4: Check what the console shows
Look for logs starting with `[SlopGuard] [createBadge]`

### COPY AND SEND ME:

1. **Output of Command 1** (function availability check)
2. **Full output of Command 2** (shortcode extraction test)
3. **Output of Command 3** (badge inspection)
4. **All `[createBadge]` logs** from when badge appeared
5. **The error log when you click the badge**

## Example of What I Expect to See

### If It's Working (But Not Showing)
```
[SlopGuard] [createBadge] Starting shortcode extraction for video: <video>
[SlopGuard] [createBadge] Found article: true
[SlopGuard] [createBadge] Found mediaLink: true
[SlopGuard] [createBadge] getValueByKey available: function
[SlopGuard] [createBadge] queryRef result: {code: "ABC123xyz", pk: "123..."}
[SlopGuard] [createBadge] ✓ Extracted shortcode from React fiber: ABC123xyz
[SlopGuard] [createBadge] Stored shortcode in badge dataset: ABC123xyz
```

### If getValueByKey Missing
```
[SlopGuard] [createBadge] Starting shortcode extraction for video: <video>
[SlopGuard] [createBadge] Found article: true
[SlopGuard] [createBadge] Found mediaLink: true
[SlopGuard] [createBadge] getValueByKey available: undefined  ← PROBLEM
[SlopGuard] [createBadge] getValueByKey not available
[SlopGuard] [createBadge] Trying link fallback...
```

### If Selector Not Finding Element
```
[SlopGuard] [createBadge] Starting shortcode extraction for video: <video>
[SlopGuard] [createBadge] Found article: true
[SlopGuard] [createBadge] Found mediaLink: false  ← PROBLEM
[SlopGuard] [createBadge] No mediaLink found with selector [tabindex="0"][aria-hidden="true"]
[SlopGuard] [createBadge] Trying link fallback...
```

### If No Article Found
```
[SlopGuard] [createBadge] Starting shortcode extraction for video: <video>
[SlopGuard] [createBadge] Found article: false  ← PROBLEM
[SlopGuard] [createBadge] No article parent found for video
[SlopGuard] [createBadge] ⚠️ No shortcode extracted - badge will fail on click
```

## Alternative: Quick Live Test

If you want to test immediately, run this in console after scrolling to a video:

```javascript
// Manual shortcode extraction test
const video = document.querySelector('video');
console.log('=== MANUAL TEST ===');
console.log('Video found:', !!video);

if (video) {
  const article = video.closest('article');
  console.log('Article found:', !!article);
  
  if (article) {
    // Test React fiber probing
    const link = article.querySelector('[tabindex="0"][aria-hidden="true"]');
    console.log('MediaLink found:', !!link);
    
    if (link && typeof getValueByKey === 'function') {
      const qr = getValueByKey(link, 'queryReference');
      console.log('queryReference:', qr);
      
      if (qr && qr.code) {
        console.log('✓ SUCCESS: Shortcode =', qr.code);
      } else {
        console.log('✗ FAIL: queryReference has no code');
      }
    } else {
      console.log('✗ FAIL: No link or getValueByKey not available');
    }
    
    // Test link fallback
    const links = article.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]');
    console.log('Fallback links found:', links.length);
    if (links.length > 0) {
      console.log('First link:', links[0].href);
    }
  }
}
```

## What Happens Next

Once you send me the outputs, I can:

1. **Identify the exact failure point** (which step fails)
2. **Determine if it's a code issue or Instagram structure change**
3. **Provide a targeted fix** (not guessing anymore)

## If You're Stuck

If the console commands don't work or you don't see any logs, try:

1. **Check if content script loaded at all**:
   ```javascript
   typeof SlopGuardConfig
   ```
   Should return "object". If "undefined", content.js didn't load.

2. **Check for JavaScript errors**:
   Look at Console tab for red error messages.
   If you see errors, send them to me.

3. **Try reloading the Instagram page** (not just the extension)
   Sometimes Instagram's SPA gets confused.
