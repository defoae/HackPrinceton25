<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Okay, I want to draft together with you quickly the technical architecture of a little project I want to build, and also then flesh out the specifications of each of these elements.

The idea is to build a Chrome Extension for an existing project which has a backend \& frontend element. The project 's main functionality is that users can upload videos and we detect whether it's AI-generated or not, and we want to simplify the experience with a Chrome Extension which adds an overlay on social media pages like X, TikTok, Instagram, so that we can automatically in the background download and fetch the video from the client's browser and send it directly to our backend/frontend (based on what makes more sense, as via the frontend we can trigger the same "manual" flow by auto-submitting such a video e.g. as a blob; just some thoughts). Is that viable, is it that easy to access e.g. the underlying video file of a TikTok even on a client which has loaded the video already? These are like roughly the questions I had and the vision.

I want you to structure these thoughts together with me, and I don't want you to definitely find an answer to each question but let's identify what we need to check upon, and you can of course give your basic guess whether it works, and I would probably check again a bit more in depth, and let you know.

Let's go through the important questions \& decisions, and weigh our options to come up with a great plan. Step by step!

Perfect! I love your structured approach. Let's break this down systematically and identify the key decisions, unknowns, and validation points. Based on what I've gathered, this is absolutely viable, but there are some important nuances we need to work through together.

## **Project Vision Summary**

Let me first confirm my understanding:

- **Current State**: Backend + Frontend web app for AI video detection
- **Goal**: Chrome Extension that overlays social media sites (X, TikTok, Instagram)
- **Core Flow**: Automatically detect video → extract/download → send to your processing pipeline → display results

***

## **Key Architectural Questions \& Decisions**

Let's work through the critical decisions step by step:

### **1. Video Access Feasibility - Can We Actually Get the Video?**

**The Good News**: Yes, it's technically feasible! Here's what I found:

**How Social Media Platforms Serve Videos**:

- Modern platforms (TikTok, Instagram, X) serve videos through standard HTML5 `<video>` elements with blob URLs or direct MP4/HLS streams[^1_1][^1_2]
- Chrome Extensions can intercept network requests using the `chrome.webRequest` API, which can capture video URLs and even response bodies[^1_3][^1_4][^1_5]
- You can access the DOM to find `<video>` elements and their source URLs

**What You Need to Validate**:

1. **Platform-specific behavior**: Each platform has different anti-scraping measures
    - TikTok uses temporary video URLs that expire[^1_6]
    - Instagram may use different streaming protocols (HLS/DASH)
    - X/Twitter has its own video infrastructure
2. **Video format**: Confirm whether videos are served as:
    - Complete MP4 files (easiest)
    - Blob URLs (need to capture the blob data)
    - HLS/DASH streams (need to download chunks and reassemble)[^1_1]

**My Assessment**: **80% confident this works**, but you'll need to test each platform individually.

***

### **2. Extension Architecture - Where Should We Capture the Video?**

This is a critical architectural decision. Let me present three approaches:


| **Approach** | **Description** | **Best For** |
| :-- | :-- | :-- |
| **A. Content Script + DOM Access** | Inject script into page, find `<video>` element, extract src/blob | Simple scenarios, direct video URLs |
| **B. Network Interception** | Use `chrome.webRequest` API to intercept video download requests | When you need the raw file before rendering |
| **C. Hybrid (DOM + Network)** | Try DOM first, fall back to network interception | Maximum compatibility across platforms |

**Which approach resonates with you for this use case?** I'm leaning toward **Option C (Hybrid)** because different platforms will behave differently, but I want your thoughts on:

- Do you care about capturing the video **before** the user sees it, or can you wait until it's loaded in the browser?
- How important is stealth/user awareness? (Network interception is more "behind the scenes")

***

### **3. Data Flow Architecture - Backend Direct vs. Frontend Proxy?**

You mentioned both options. Let's analyze:


| **Architectural Pillar** | **Option A: Extension → Backend** | **Option B: Extension → Frontend → Backend** |
| :-- | :-- | :-- |
| **Scalability** | ✅ More efficient (one hop) | ⚠️ Extra hop adds latency |
| **Security** | ⚠️ Backend API exposed to extension (need CORS, auth tokens) | ✅ Frontend already has auth/session handling |
| **Maintainability** | ⚠️ New API endpoint needed | ✅ Reuses existing upload flow |
| **Implementation Speed** | ⚠️ Moderate (new backend endpoint + auth) | ✅ Fast (piggyback existing frontend logic) |
| **Cost** | ✅ Lower (fewer hops) | ⚠️ Slightly higher (extra processing) |

**My Recommendation**: Start with **Option B (Extension → Frontend)** for these reasons:

1. You mentioned the frontend already has a "manual upload" flow
2. Faster to prototype (reuse existing auth, validation, UI feedback)
3. Easier to debug (you can see the flow in DevTools)
4. Later optimization: Once proven, you can add a direct backend endpoint

**Does this align with your timeline and priorities?**

***

### **4. User Experience \& Overlay Design**

**Key Questions to Define**:

- **When does detection happen?**
    - Automatically when video appears on screen?
    - User clicks a button on your overlay?
- **What does the overlay show?**
    - Real-time detection results?
    - Loading state while processing?
    - Historical results (if video was analyzed before)?

**UX Pattern Recommendation**: Consider a **non-intrusive badge/icon** overlay that:

1. Appears when extension detects a video element
2. User clicks to trigger analysis (opt-in)
3. Shows loading state → result

This avoids auto-downloading every video (bandwidth/privacy concerns).

***

## **Critical Unknowns - Your Validation Checklist**

Here's what you should test/research next:

### **Must Validate Immediately**:

1. ✅ **Video URL extraction per platform**:
    - Create a simple test extension
    - Log all network requests on TikTok/Instagram/X
    - Identify video URLs and their format
2. ✅ **CORS restrictions**:
    - Can your extension download the video blob/URL?
    - Do platforms block cross-origin downloads?
3. ✅ **File size limits**:
    - What's the average video size? (1-50MB?)
    - Browser memory limits for blob handling

### **Can Validate Later**:

- Rate limiting from platforms (how many videos can you process before they block?)
- Video quality selection (do you need 1080p or is 480p enough for AI detection?)
- Edge cases (stories, live streams, ads)

***

## **Proposed Next Steps**

Here's how I'd structure our next work:

**Phase 1: Proof of Concept (2-3 days)**

1. Build minimal extension that logs video URLs from one platform (start with X/Twitter—usually easier)
2. Test blob extraction and file upload to your existing frontend

**Phase 2: Architecture Definition (After validation)**

- Based on Phase 1 results, we'll finalize:
    - Content script vs. network interception approach
    - Data flow (direct backend or via frontend)
    - Overlay UI pattern

**Phase 3: Multi-Platform Support**

- Extend to TikTok and Instagram with platform-specific adapters

***

## **My Questions for You**

To help refine our architecture:

1. **Timeline**: How quickly do you need this? (Affects whether we optimize early or iterate)
2. **Scale**: How many users do you expect? (Affects backend/frontend capacity planning)
3. **Video Size**: What's the typical video length you're targeting? (15-second clips vs. 5-minute videos = very different data transfer)
4. **Privacy**: Are you concerned about downloading videos without explicit user consent? (Affects whether we auto-analyze or require click-to-analyze)

**What's your gut feeling on the data flow decision (Option A vs. B)?** And which platform should we target first for validation?
<span style="display:none">[^1_10][^1_11][^1_12][^1_13][^1_14][^1_15][^1_16][^1_17][^1_18][^1_19][^1_20][^1_21][^1_22][^1_23][^1_24][^1_25][^1_26][^1_27][^1_28][^1_29][^1_30][^1_7][^1_8][^1_9]</span>

<div align="center">⁂</div>

[^1_1]: https://stackoverflow.com/questions/42901942/how-do-we-download-a-blob-url-video

[^1_2]: https://developer.chrome.com/blog/ump

[^1_3]: https://www.reddit.com/r/webdev/comments/1erd9bt/chrome_extension_help_how_can_i_intercept_network/

[^1_4]: https://stackoverflow.com/questions/6831916/is-it-possible-to-monitor-http-traffic-in-chrome-using-an-extension

[^1_5]: https://stackoverflow.com/questions/11593853/intercept-http-request-body-from-chrome-extension

[^1_6]: https://scrapecreators.com/blog

[^1_7]: https://chromewebstore.google.com/detail/tweak-mock-and-modify-htt/feahianecghpnipmhphmfgmpdodhcapi

[^1_8]: https://chromewebstore.google.com/detail/request-interceptor/bfgblailifedppfilabonohepkofbkpm

[^1_9]: https://www.youtube.com/watch?v=Kkv30vZyQ14

[^1_10]: https://stackoverflow.com/questions/70820405/chrome-devtools-extension-intercept-network-in-background

[^1_11]: https://www.browserstack.com/guide/request-interceptor-chrome

[^1_12]: https://stackoverflow.com/questions/46222289/how-to-intercept-other-extensions-requests-using-chrome-extension-api

[^1_13]: https://chromewebstore.google.com/detail/request-interceptor/hkkjcknodnahjdnemannhkhnfedifkoh

[^1_14]: https://chromewebstore.google.com/category/extensions/lifestyle/social

[^1_15]: https://driveeditor.com/blog/best-chrome-extensions-for-video-editing

[^1_16]: https://www.fs-poster.com/blog/google-chrome-extensions-for-social-media-marketing

[^1_17]: https://www.reddit.com/r/chrome_extensions/comments/1j60r8y/i_made_a_chrome_extension_to_craft_smart_social/

[^1_18]: https://famoid.com/blog/chrome-extensions-for-social-media-marketing/

[^1_19]: https://www.techspot.com/guides/2690-download-tiktok-instagram-youtube-twitter/

[^1_20]: https://www.youtube.com/watch?v=9BdLg6KEOCY

[^1_21]: https://www.expressvpn.com/blog/our-favorite-chrome-extensions/

[^1_22]: https://www.socialboosting.com/blog/how-to-download-tiktok-instagram-videos

[^1_23]: https://chromewebstore.google.com/detail/requestly-supercharge-you/mdnleldcmiljblolnjhpnblkcekpdkpa

[^1_24]: https://scrapfly.io/blog/posts/how-to-scrape-instagram

[^1_25]: https://www.youtube.com/watch?v=rj_6G4DMDZQ

[^1_26]: https://stackoverflow.com/questions/77261239/how-to-make-a-video-shareable-on-instagram-and-tiktok-from-a-web-app

[^1_27]: https://www.getphyllo.com/post/using-apis-to-automate-content-upload-on-youtube-instagram-tiktok

[^1_28]: https://www.youtube.com/watch?v=a3S4YhAU5Bk

[^1_29]: https://blog.videoscribe.co/ultimate-guide-to-social-media-video

[^1_30]: https://sproutsocial.com/insights/social-media-video-specs-guide/


---

# Ok, regarding Video Access Feasability, I think we should focus on Instagram for now, and make that work. There is an existing project (https://github.com/HOAIAN2/Instagram-Downloader) which implements that, and I will use that as a base for the downloading mechanism.

2) Let's try to access it via the DOM, although I am not sure how the project I found approached it. We can just reuse their stuff.
3) Yes, Let's go with Extension -> Frontend, but I just wonder how we can make the transition seamless of pressing the button on a video, and just by "opening" our service's frontend also directly start the upload of the video (and basically the backend request) without intervention of the user. What do you think, what is a good way for that?
4) Detection happens in the backend, that's the whole idea. The extension does not do anything with that anyway, we just handle the download of the video and the transmission to the backend. And for the UX, I agree, we should have a non-intrusive badge/icon overlay that triggers the process of downloading and then opening our website.

---

Regarding your concerns - the CORS Restrictions shouldn't be an issue, should it? As the extension will trigger the download of the video, and save it locally as a blob, we can easily get that somehow going. And then regarding the File Size Limits, probably something like in 1 - 50 MB range. Is that fine for blobs?

We want to just quickly get that somehow done. How does this sound?

Excellent! You've made clear decisions and I love the pragmatic approach of building on existing work. Let me address your key question about the seamless upload flow, confirm the technical feasibility, and then we'll map out the implementation.

***

## **3. Seamless Extension → Frontend Auto-Upload Flow**

This is a fascinating architectural challenge! The core problem: **How do we pass a blob (video file) from a Chrome Extension to your frontend and trigger automatic upload?**

Let me present three viable approaches:


| **Approach** | **How It Works** | **Scalability** | **Security** | **Implementation Speed** | **Maintainability** |
| :-- | :-- | :-- | :-- | :-- | :-- |
| **A. Browser Storage Bridge** | Extension saves blob to IndexedDB → Opens frontend with special URL param → Frontend reads from IndexedDB → Auto-submits | ✅ Good (50MB+ supported) | ✅ Same-origin only | ✅✅ Fast (2-3 hours) | ✅ Simple, clean separation |
| **B. PostMessage API** | Extension opens frontend in new tab/window → Uses `postMessage()` to send blob directly | ✅ Good (50MB works) | ⚠️ Need origin verification | ✅ Fast (2-4 hours) | ⚠️ Timing issues (frontend must be ready) |
| **C. Service Worker Relay** | Extension posts to service worker → Service worker caches blob → Frontend fetches from cache | ✅✅ Excellent (built for large files) | ✅ Secure | ⚠️ Moderate (4-6 hours) | ⚠️ More complex setup |

### **My Recommendation: Option A (Browser Storage Bridge)**

Here's why this is the sweet spot for your use case:

**The Flow**:

1. User clicks your overlay badge on Instagram video
2. Extension downloads video as blob (using Instagram-Downloader approach)[^2_1]
3. Extension saves blob to IndexedDB with unique ID
4. Extension opens your frontend: `yoursite.com/auto-upload?videoId=abc123`
5. Frontend detects `videoId` param → Reads blob from IndexedDB → Auto-triggers upload
6. Frontend cleans up IndexedDB after successful upload

**Why This Works Best**:

- **No timing issues**: Frontend reads the data when ready (unlike postMessage which requires synchronization)
- **Standard APIs**: IndexedDB supports 50MB+ easily, no special permissions needed
- **Clean separation**: Extension and frontend are loosely coupled
- **Debuggable**: You can inspect IndexedDB in DevTools to see what's stored

**Code Pattern Preview** (just the concept, not full implementation):

```javascript
// Extension side (content script)
const videoBlob = /* downloaded blob from Instagram */;
const videoId = generateUniqueId();
await saveToIndexedDB('pending-uploads', videoId, videoBlob);
chrome.tabs.create({ url: `https://yoursite.com/auto-upload?videoId=${videoId}` });

// Frontend side (React/Vue/vanilla JS)
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('videoId')) {
  const videoId = urlParams.get('videoId');
  const videoBlob = await readFromIndexedDB('pending-uploads', videoId);
  autoSubmitToBackend(videoBlob);
  await deleteFromIndexedDB('pending-uploads', videoId); // cleanup
}
```

**Does this approach feel right to you?** The alternative (Option B - postMessage) is slightly faster to implement but has race condition risks.

***

## **CORS \& Blob Size Validation**

You're absolutely right on both counts!

### **CORS: No Issue ✅**

- Chrome Extensions run with elevated privileges[^2_1]
- The Instagram-Downloader project successfully downloads videos, meaning they've already solved CORS issues
- Extensions can use `fetch()` with special permissions or directly access video elements in the DOM
- Once you have the blob locally, CORS no longer applies (it's client-side data)


### **Blob Size: 1-50MB is Perfect ✅**

- IndexedDB comfortably handles 50-100MB+ blobs (browser dependent, but typically 50MB+ guaranteed)
- For context:
    - 15-second Instagram reel (720p): ~5-15MB
    - 60-second video (1080p): ~30-50MB
- If you hit edge cases (rare 100MB+ videos), you can either:
    - Show error message ("video too large")
    - Stream directly to backend (more complex, save for later)

**Verdict**: Your size range is ideal for this architecture.

***

## **Refined Architecture Diagram**

Let me visualize what we're building:

```
Instagram Page (DOM)
       ↓
   [Video Element] ← Extension detects
       ↓
   Extension Content Script
       ↓
   Downloads video blob (reusing Instagram-Downloader logic)
       ↓
   Saves to IndexedDB (key: videoId)
       ↓
   Opens new tab: yoursite.com/auto-upload?videoId=xyz
       ↓
   Your Frontend
       ↓
   Reads blob from IndexedDB
       ↓
   Auto-submits to existing upload endpoint
       ↓
   Your Backend (AI detection)
       ↓
   Returns result → Frontend displays
```


***

## **Implementation Roadmap**

Since you want to move quickly, here's a pragmatic 3-phase plan:

### **Phase 1: Instagram Download Integration (Day 1)**

**Goal**: Get video blob from Instagram

**Tasks**:

1. Fork/clone Instagram-Downloader repo[^2_1]
2. Strip out UI components (keep only the core download logic)
3. Test that you can trigger download and get blob in memory
4. Add your custom overlay badge (replace their "Download" button)

**Validation**: Can you console.log a blob object from an Instagram video?

***

### **Phase 2: Extension ↔ Frontend Bridge (Day 1-2)**

**Goal**: Pass blob to your frontend and auto-upload

**Tasks**:

1. Implement IndexedDB storage wrapper (save/read/delete functions)
2. Modify extension to save blob + open your site with videoId
3. Create `/auto-upload` route in your frontend
4. Implement auto-detection of `videoId` param → read blob → submit
5. Wire up to existing backend upload endpoint

**Validation**: Click overlay → New tab opens → Video auto-uploads → Backend processes it

***

### **Phase 3: Polish \& Error Handling (Day 2-3)**

**Goal**: Make it production-ready

**Tasks**:

1. Add loading states (extension badge shows "Processing...")
2. Handle errors (failed download, IndexedDB full, upload failed)
3. Add user feedback (success/error notifications)
4. Clean up IndexedDB on errors or successful upload
5. Test edge cases (no internet, very large videos, Instagram updates)

***

## **Quick Feasibility Check on Instagram-Downloader**

Looking at the repo you shared, here's what's perfect for your use case:[^2_1]

✅ **Already solved**:

- Video URL extraction from Instagram DOM
- Works with posts, reels, and stories
- Uses ReactFiber inspection (Instagram's internal React structure)
- Handles high-resolution videos
- Tested on Chrome/Edge/Firefox

✅ **What you'll reuse**:

- Their regex patterns for detecting post types
- API fetching logic for video URLs
- Blob creation from downloaded videos

⚠️ **What you'll modify**:

- Remove their download UI/buttons
- Add your overlay badge instead
- Remove direct download-to-disk (keep blob in memory)
- Add IndexedDB storage layer

**This is a solid foundation!** The hard work (Instagram API reverse-engineering) is done.

***

## **My Questions Before We Finalize**

1. **Frontend Framework**: What's your frontend built with? (React/Vue/vanilla JS?) This affects how we implement the auto-upload detection.
2. **User Feedback**: After clicking the badge, what should happen visually?
    - Option A: Badge changes to "Opening..." → New tab opens immediately
    - Option B: Badge shows "Downloading..." → Then opens tab after download completes
    - (I'd recommend B for better UX)
3. **Same Result Multiple Times**: If a user processes the same video twice, should we:
    - Always re-process (send to backend again)?
    - Cache results (check if videoId was processed before)?
4. **Browser Tab Behavior**: Should the new tab:
    - Open in foreground (user sees upload happening)?
    - Open in background (less disruptive)?

**Ready to move forward?** Once you answer these, I can help you architect the IndexedDB bridge and frontend auto-upload handler in detail. Does the overall approach feel solid to you?

<div align="center">⁂</div>

[^2_1]: https://github.com/HOAIAN2/Instagram-Downloader


---

# Regarding your questions:

1) React \& Next.js - that should be all fine!
2) Let's do after clicking the badge a loading indicator, also allow to cancel the process by clicking another time, and then opening the new tab aafter download completing.
3) Let's just reprocess, that should be fine.
4) Open in Forreground:

In the meantime, I cloned the repository and want you to do a implementation checklist based on our architecture for an LLM Coding Agent it can execute (for VibeKanban if you know), so that it can go through the repository, and do some reconnaisance, and implement our changes. Any other questions I can bounce with the LLM Agent, but we should do a rough specification as good as we can do without having access to specific everything. Important that we are only doing a more high-level checklist and description and not specific code-level implementations line by line.

But first, let's go through the important questions that we need to answer for everything! Thanks

Perfect! I love that we're being thorough before diving into implementation. Let's identify all the critical questions we need to answer so the LLM coding agent has clear specifications to work with.

***

## **Critical Architecture \& Implementation Questions**

Let me organize these by domain:

### **A. Chrome Extension Architecture**

**1. Manifest Version \& Permissions**

- Should we use Manifest V3 (latest, recommended) or V2 (more permissive, easier)?
    - **My take**: V3 is the future, but V2 might be easier for quick prototype. What's your preference?
- What permissions do we need to declare?
    - Storage (for IndexedDB)
    - ActiveTab (to access Instagram DOM)
    - Host permissions for Instagram domains
    - Any others?

**2. Extension Component Structure**

- Do we need a background script/service worker, or can we do everything in content scripts?
    - **My recommendation**: Content script only for simplicity (handles detection, download, storage, tab opening)
    - Background script only if we need persistent state or complex orchestration
- Do we need a popup UI, or just the overlay badge on Instagram?
    - **My take**: Overlay only keeps it simpler

**3. Video Detection \& Targeting**

- Instagram can show multiple videos on screen (feed scrolling). How do we know which video the user wants to analyze?
    - Option A: Only show badge when user hovers over a video
    - Option B: Show badge on all visible videos
    - Option C: Only show badge on currently playing/focused video
    - **What feels right to you?**

**4. Overlay Badge Positioning**

- Where should the badge appear on the video?
    - Top-right corner (like Instagram's bookmark icon)?
    - Bottom-left (like view count)?
    - Center overlay (more prominent)?
    - **Your preference?**

***

### **B. Data Flow \& Storage**

**5. IndexedDB Schema**
What data should we store alongside the blob?

```javascript
{
  videoId: 'uuid',
  blob: Blob,
  timestamp: Date,
  sourceUrl: 'instagram.com/p/xyz',
  metadata: {
    username?: string,
    postId?: string,
    duration?: number,
    fileSize?: number
  }
}
```

- Do we need the metadata, or just blob + videoId?
- **My take**: Minimal for now (videoId + blob), add metadata later if needed

**6. IndexedDB Cleanup Strategy**

- When should we delete blobs from IndexedDB?
    - Immediately after successful upload?
    - After 24 hours (in case upload fails and user retries)?
    - Manual cleanup by user?
- What if upload fails? Keep blob for retry?
    - **Your preference?**

**7. Cancellation Mechanism**
You mentioned "click badge again to cancel". At what point can they cancel?

- During download (stop Instagram video fetch)?
- After download but before tab opens (delete blob + abort)?
- After tab opens (close tab + delete blob)?
- **All of the above?**

***

### **C. Frontend Integration**

**8. Next.js Route Structure**

- Where should the auto-upload route live?
    - `/auto-upload` (new page)?
    - `/upload?auto=true` (existing upload page with param)?
    - **My recommendation**: Reuse existing upload page to avoid duplication

**9. Frontend Auto-Upload Flow**
When the frontend detects `videoId` param:

```javascript
// Pseudocode
if (videoId in URL) {
  1. Show loading UI ("Processing video from Instagram...")
  2. Read blob from IndexedDB
  3. Call existing upload handler (FormData with blob)
  4. On success: Show results + cleanup IndexedDB
  5. On failure: Show error + keep blob for retry?
}
```

- Does your current upload component accept a blob directly, or does it expect a File object?
- **Any special setup needed?**

**10. User Experience After Upload**
After the video is uploaded and processed:

- Show results on the same page?
- Redirect to a results page?
- Show notification and keep them on upload page?
- **What matches your current flow?**

***

### **D. Error Handling \& Edge Cases**

**11. Download Failures**
What if the Instagram video download fails?

- Show error badge (red X icon)?
- Retry automatically (X attempts)?
- Show toast notification with retry button?
- **Your preference?**

**12. IndexedDB Storage Quota**
Browsers limit IndexedDB (typically 50-100MB+ but varies). What if it's full?

- Show error "Storage full, please try again later"?
- Auto-cleanup old blobs first?
- **How to handle?**

**13. Instagram DOM Changes**
The Instagram-Downloader project uses ReactFiber inspection, which can break if Instagram updates. How should we handle this?

- Show "Extension needs update" message?
- Fail gracefully with user-friendly error?
- **Monitoring strategy?**

**14. Network Issues**
What if upload to your backend fails (timeout, server error, no internet)?

- Retry mechanism (X attempts with backoff)?
- Keep blob in IndexedDB for manual retry?
- Show error and let user retry via button?

***

### **E. File Handling \& Backend**

**15. Video File Naming**
When sending the blob to your backend, what filename/metadata should we include?

```javascript
FormData {
  file: blob,
  filename: 'instagram_video_uuid.mp4',
  source: 'instagram',
  sourceUrl: 'https://instagram.com/p/xyz',
  timestamp: ISO8601
}
```

- Does your backend expect specific field names?
- Any required metadata?
- **Backend API contract?**

**16. Backend Endpoint**

- What's the exact endpoint URL for video upload? (`POST /api/upload`?)
- Authentication required? (JWT token, session cookie?)
- Expected response format?

```json
{
  "success": true,
  "videoId": "backend-video-id",
  "processingStatus": "queued",
  "resultUrl": "/results/123"
}
```

**17. Video Format Compatibility**

- Does your backend accept any video format (MP4, WebM, etc.)?
- Or should we validate/convert before upload?
- **Any restrictions?**

***

### **F. Development \& Testing**

**18. Development Environment**

- How should the LLM agent structure the extension project?
    - Keep Instagram-Downloader structure and modify?
    - Refactor into cleaner folder structure?
    - **Your preference?**

**19. Testing Strategy**
What should the agent validate?

- Manual testing checklist (test on X Instagram videos)?
- Automated tests (Jest/Playwright)?
- **Scope for initial implementation?**

**20. Configuration Management**
Should we externalize configs (backend URL, etc.)?

```javascript
// config.js
export const CONFIG = {
  BACKEND_URL: 'https://yoursite.com',
  API_ENDPOINT: '/api/upload',
  MAX_VIDEO_SIZE_MB: 50,
  SUPPORTED_PLATFORMS: ['instagram'],
  DEBUG_MODE: false
}
```

- **Good idea, or hardcode for simplicity?**

***

## **My Recommendations (Quick Defaults)**

To speed up decision-making, here are my suggested defaults. Feel free to override any:

**Extension:**

- Manifest V2 (faster for prototype, migrate to V3 later)
- Content script only (no background script)
- Badge on hover (Option A - clear user intent)
- Top-right corner badge (familiar position)

**Data:**

- Minimal IndexedDB schema (videoId + blob only)
- Cleanup immediately after successful upload
- Allow cancel at any point (delete blob + close tab if opened)

**Frontend:**

- Reuse existing upload page: `/upload?videoId=xyz`
- Accept blob directly (wrap in File object if needed)
- Show results on same page

**Error Handling:**

- Show error badge on Instagram for download failures
- Show alert/toast for storage quota issues
- Keep blob for 5 minutes on upload failure (then cleanup)

**Backend:**

- Assume standard FormData upload (file field with metadata)
- Handle auth via existing session/cookie
- Any format accepted

**Development:**

- Clean refactor of Instagram-Downloader (focused folder structure)
- Manual testing checklist only (automated tests later)
- Externalize config (environment-specific URLs)

***

## **What I Need From You**

Please answer/confirm:

1. **Extension Manifest version preference?** (V2 for speed or V3 for future-proofing?)
2. **Badge visibility logic?** (Hover, always visible, or currently playing video only?)
3. **Badge position?** (Top-right, bottom-left, or other?)
4. **IndexedDB cleanup timing?** (Immediate, delayed, or manual?)
5. **Cancel scope?** (Can user cancel at any point, or only before tab opens?)
6. **Frontend route?** (New `/auto-upload` or existing `/upload?videoId=xyz`?)
7. **Backend API details?** (Endpoint URL, auth method, expected FormData fields?)
8. **Config management?** (Externalize or hardcode for now?)
9. **Any Instagram-specific constraints?** (Only reels? Only posts? Everything?)

Once you confirm these, I'll create a **comprehensive high-level implementation checklist** that the LLM coding agent can execute systematically!

**Which of these feel most critical to decide now vs. letting the agent make reasonable assumptions?**

---

# 1) Let's go for Manifest V2. And the permissions should be exactly like you said, that's good! Let's call the extension "SlopGuard" and description "We help you detect your daily brainrot."

2) Let's do a content-script only for simplicity then. I don't know what the specific implementation in our base (the InstagramDownloader extension) is, but we can refactor based on that, or reuse what they do.

And let's only do an overlay.

3) Let's show the badge on all visible videos
4) Top Right Corner please!

---

The other questions look like you already have a good idea. Let's go for simplicity and MVP-level implemntation.

Regarding Cancellation, the user will be realistically only to cancel during the download. Otherwise the extension finished its job or is not running, or?

---

C.:

1) Yes, for the Frontend Auto-Upload flow, we can do exactly that. I will implement that like that, thanks.
2) No, the results and anything else will happen on the SlopGuard page and not be related to the extension anymore.

d)

1) If it failes, let's just not do anything.
2) If the IndexedDB is full, let's just cleanup old blobs one by one until it works.
3) Don't worry, the Instagram Extension did that.

E) That part is out of our scope for now, we can talk about that at some other point when I move to the Frontend, but for the extension that should be irregardless, or?

F)

1) Let's keep the Instagram-Downloader structure and mofiy, I woudl say. WE can change everything relevant
2) No testing, please
3) Yes Configs, in a local configuration File.

Okay, that should be fine for now!

Perfect! Crystal clear decisions. Let me create the high-level implementation checklist for your LLM coding agent.

***

# **SlopGuard Chrome Extension - Implementation Checklist**

## **Project Overview**

**Base Repository**: Instagram-Downloader (cloned)
**Extension Name**: SlopGuard
**Description**: We help you detect your daily brainrot.
**Goal**: Detect Instagram videos → Download as blob → Store in IndexedDB → Open frontend with videoId for auto-upload

***

## **Phase 1: Setup \& Configuration**

### **Task 1.1: Update Extension Manifest**

- [ ] Locate `manifest.json` in the Instagram-Downloader project
- [ ] Update extension metadata:
    - Name: "SlopGuard"
    - Description: "We help you detect your daily brainrot."
    - Version: "1.0.0"
- [ ] Verify Manifest V2 is being used
- [ ] Confirm required permissions are present:
    - `storage` (for IndexedDB)
    - `activeTab` (for Instagram page access)
    - Host permissions: `*://www.instagram.com/*` and `*://instagram.com/*`
- [ ] Remove any unnecessary permissions from original extension


### **Task 1.2: Create Configuration File**

- [ ] Create new file: `config.js` in project root or `/src` folder
- [ ] Define configuration object with these keys:
    - `FRONTEND_URL`: The base URL of the SlopGuard frontend (placeholder: `'https://slopguard.com'`)
    - `FRONTEND_UPLOAD_ROUTE`: The upload route path (placeholder: `'/upload'`)
    - `MAX_VIDEO_SIZE_MB`: Maximum video size (set to `50`)
    - `INDEXEDDB_NAME`: Database name (e.g., `'SlopGuardVideos'`)
    - `INDEXEDDB_STORE_NAME`: Object store name (e.g., `'pendingUploads'`)
    - `DEBUG_MODE`: Boolean flag for logging (set to `true` for development)
- [ ] Export configuration for use across extension files

**Validation**: Can load extension in Chrome and see "SlopGuard" in extensions list

***

## **Phase 2: Remove Unnecessary UI Components**

### **Task 2.1: Identify \& Remove Download UI**

- [ ] Review existing Instagram-Downloader UI components (buttons, modals, download panels)
- [ ] Remove or comment out:
    - Direct download buttons/interfaces
    - Multi-select functionality UI
    - Photo gallery UI
    - Download modal components
    - Zip file download features
- [ ] Keep only the core video detection and fetching logic
- [ ] Remove keyboard shortcut handlers (D, C, S keys) related to downloading


### **Task 2.2: Clean Up CSS**

- [ ] Remove CSS classes related to removed UI components
- [ ] Keep only styles needed for the overlay badge (will be created next)
- [ ] Remove animation/transition styles for download modals

**Validation**: Extension loads without showing original download UI

***

## **Phase 3: Create Overlay Badge System**

### **Task 3.1: Design Badge HTML/CSS**

- [ ] Create badge element structure (div with icon/logo)
- [ ] Style badge with:
    - Position: absolute, top-right corner of video element
    - Initial state: SlopGuard icon/logo
    - Loading state: Spinner animation
    - Small, non-intrusive size (e.g., 40x40px)
    - High z-index to stay on top
    - Subtle drop shadow for visibility
- [ ] Add CSS for three states:
    - **Idle**: Default SlopGuard icon (consider using an emoji or simple SVG: 🛡️ or 🧠)
    - **Loading**: Spinner/animated indicator
    - **Clickable**: Hover effect (slight scale/opacity change)


### **Task 3.2: Implement Badge Detection \& Injection**

- [ ] Reuse existing video detection logic from Instagram-Downloader
- [ ] For each detected video element on page:
    - Check if video element is visible in viewport
    - Inject badge overlay as sibling/child element
    - Position badge relative to video container
    - Ensure badge doesn't already exist (avoid duplicates)
- [ ] Handle dynamic content (Instagram infinite scroll):
    - Listen for new videos appearing (MutationObserver or scroll events)
    - Inject badges on newly loaded videos
    - Remove badges when videos leave DOM


### **Task 3.3: Add Badge Click Handler**

- [ ] Attach click event listener to each badge
- [ ] On click:
    - Prevent duplicate clicks (disable badge during processing)
    - Change badge state to "loading"
    - Identify which video element corresponds to clicked badge
    - Trigger video download process (next phase)
- [ ] Implement cancellation:
    - If badge is clicked again during loading, abort download
    - Reset badge to idle state
    - Clean up any partially downloaded data

**Validation**: Scroll Instagram feed, see badges appear on all videos, clicking shows loading state

***

## **Phase 4: Video Download \& Blob Handling**

### **Task 4.1: Reuse Instagram Video Fetching**

- [ ] Locate the Instagram-Downloader's video URL extraction logic
    - Likely involves ReactFiber inspection
    - API endpoint fetching for video URLs
- [ ] Refactor into reusable function: `downloadInstagramVideo(videoElement)`
    - Input: Video DOM element
    - Output: Promise that resolves to Blob
- [ ] Ensure function returns video as Blob object (not triggering browser download)
- [ ] Add error handling for failed fetches


### **Task 4.2: Implement Cancellation Support**

- [ ] Use AbortController for fetch requests
- [ ] Store AbortController reference per badge/video
- [ ] On second click (cancel):
    - Call `abortController.abort()`
    - Clean up pending request
    - Reset badge state

**Validation**: Click badge → Video downloads as blob in memory (log blob size to console)

***

## **Phase 5: IndexedDB Storage Layer**

### **Task 5.1: Create IndexedDB Utility Module**

- [ ] Create new file: `indexedDB.js` or `storage.js`
- [ ] Implement IndexedDB wrapper with functions:
    - `initDB()`: Open/create database and object store
    - `saveBlob(videoId, blob, metadata)`: Store blob with unique ID
    - `getBlob(videoId)`: Retrieve blob by ID
    - `deleteBlob(videoId)`: Remove blob by ID
    - `cleanupOldBlobs(count)`: Delete oldest N blobs (by timestamp)
    - `getStorageUsage()`: Estimate current storage size
- [ ] Use configuration from `config.js` for database/store names
- [ ] Schema for stored objects:

```javascript
{
  videoId: 'uuid-string',
  blob: Blob,
  timestamp: Date.now(),
  sourceUrl: window.location.href, // optional
  fileSize: blob.size // optional
}
```


### **Task 5.2: Integrate Storage with Download Flow**

- [ ] After successful video download (blob obtained):
    - Generate unique videoId (use crypto.randomUUID() or timestamp-based ID)
    - Save blob to IndexedDB with videoId
    - Handle storage quota errors:
        - If storage full, call `cleanupOldBlobs(1)` recursively until space available
        - Retry save operation
- [ ] On save success:
    - Proceed to open frontend tab (next phase)
- [ ] On save failure (after cleanup attempts):
    - Show error state on badge (optional: change icon to ❌)
    - Log error if DEBUG_MODE enabled

**Validation**: Download video → Check Chrome DevTools → Application → IndexedDB → See stored blob

***

## **Phase 6: Frontend Tab Opening**

### **Task 6.1: Construct Frontend URL**

- [ ] After blob saved to IndexedDB:
    - Read `FRONTEND_URL` and `FRONTEND_UPLOAD_ROUTE` from config
    - Construct full URL: `${FRONTEND_URL}${FRONTEND_UPLOAD_ROUTE}?videoId=${videoId}`
    - Example: `https://slopguard.com/upload?videoId=abc-123-def`


### **Task 6.2: Open New Tab**

- [ ] Use `chrome.tabs.create()` API to open new tab with constructed URL
- [ ] Set `active: true` (open in foreground)
- [ ] After tab opens:
    - Reset badge to idle state (hide loading spinner)
    - Badge's job is complete (frontend takes over)

**Validation**: Click badge → Loading → New tab opens with correct URL containing videoId

***

## **Phase 7: Cleanup \& Error Handling**

### **Task 7.1: Handle Download Failures**

- [ ] Wrap download logic in try-catch
- [ ] On error (network failure, Instagram blocking, etc.):
    - Silently fail (no error message to user)
    - Reset badge to idle state
    - Log error to console if DEBUG_MODE enabled
    - Do NOT save anything to IndexedDB


### **Task 7.2: Handle Edge Cases**

- [ ] Video element removed from DOM during download:
    - Abort ongoing download
    - Clean up badge element
- [ ] User navigates away from Instagram:
    - Abort all ongoing downloads
    - No cleanup needed (IndexedDB persists across sessions)
- [ ] Multiple videos processing simultaneously:
    - Each badge/video operates independently
    - Ensure videoIds are unique


### **Task 7.3: Debug Logging**

- [ ] Add console.log statements throughout (gated by DEBUG_MODE config):
    - "Badge injected for video: [element]"
    - "Download started for videoId: [id]"
    - "Blob saved to IndexedDB: [size] bytes"
    - "Opening frontend tab: [url]"
    - "Error during download: [error message]"

**Validation**: Test various failure scenarios (slow network, ad-blockers, navigation) → Extension handles gracefully

***

## **Phase 8: Code Refactoring \& Organization**

### **Task 8.1: Organize File Structure**

- [ ] Review current Instagram-Downloader file structure
- [ ] Suggested organization (adapt based on existing structure):

```
/src
  /content
    content.js          # Main content script
    badge.js            # Badge UI logic
    videoDownloader.js  # Instagram video fetching (refactored from original)
  /utils
    indexedDB.js        # IndexedDB wrapper
    helpers.js          # Utility functions (UUID generator, etc.)
  /styles
    badge.css           # Badge overlay styles
  config.js             # Configuration
/assets
  icon.png              # Extension icon
manifest.json
```


### **Task 8.2: Modularize Code**

- [ ] Extract badge creation into separate function/module
- [ ] Extract download logic into separate function
- [ ] Ensure clean separation of concerns:
    - Detection → Badge → Download → Storage → Tab Opening
- [ ] Use ES6 imports/exports where possible (check if extension supports modules)

**Validation**: Code is readable, functions have single responsibilities

***

## **Phase 9: Testing \& Validation**

### **Task 9.1: Manual Testing Checklist**

Test the following scenarios on Instagram:

- [ ] Load Instagram feed → Badges appear on visible videos
- [ ] Scroll feed → Badges appear on newly loaded videos
- [ ] Click badge → Loading state appears
- [ ] Wait for download → New tab opens with correct URL
- [ ] Check DevTools → Blob exists in IndexedDB
- [ ] Click badge during loading → Download cancels, badge resets
- [ ] Try on different Instagram content types:
    - Feed posts with videos
    - Reels
    - Stories (if applicable)
- [ ] Test with slow network → Graceful handling
- [ ] Test with no network → Silent failure, badge resets


### **Task 9.2: Browser Console Verification**

- [ ] Set DEBUG_MODE to true
- [ ] Trigger full flow
- [ ] Verify console logs show expected sequence:

1. Badge injection
2. Download start
3. Blob save
4. Tab opening
- [ ] No unexpected errors in console

**Validation**: Extension works end-to-end on live Instagram

***

## **Phase 10: Final Polish**

### **Task 10.1: Update Extension Metadata**

- [ ] Add extension icon (create simple SlopGuard logo or use placeholder)
- [ ] Update README.md with:
    - Project name: SlopGuard
    - Purpose: AI-generated video detection via Chrome extension
    - Installation instructions
    - Configuration instructions (how to set FRONTEND_URL)


### **Task 10.2: Code Cleanup**

- [ ] Remove commented-out code from original Instagram-Downloader
- [ ] Remove unused dependencies/imports
- [ ] Ensure DEBUG_MODE is set to false for production


### **Task 10.3: Configuration for Deployment**

- [ ] Document how to update config.js for production:
    - Set FRONTEND_URL to actual domain
    - Set DEBUG_MODE to false
- [ ] Consider adding config validation on extension load

**Validation**: Extension is ready for packaging and distribution

***

## **Key Dependencies \& Assumptions**

**From Instagram-Downloader Base**:

- Video detection logic (ReactFiber inspection) is working
- Video URL extraction/fetching is functional
- Compatible with current Instagram DOM structure

**Browser APIs Used**:

- IndexedDB for storage
- chrome.tabs API for opening tabs
- Standard DOM APIs for badge injection
- AbortController for cancellation

**Out of Scope** (Frontend team handles):

- Frontend route creation (`/upload?videoId=xyz`)
- Reading blob from IndexedDB in frontend
- Auto-upload trigger in frontend
- Backend integration

***

## **Success Criteria**

The implementation is complete when:

1. ✅ Extension loads in Chrome without errors
2. ✅ Badges appear on Instagram videos (all visible)
3. ✅ Clicking badge downloads video and shows loading state
4. ✅ Blob is saved to IndexedDB with unique videoId
5. ✅ New tab opens with correct URL format
6. ✅ Cancellation works (click during loading)
7. ✅ Graceful error handling (silent failures)
8. ✅ Config file allows easy URL customization

***

## **Notes for LLM Agent**

- **Preserve working logic**: The Instagram-Downloader already solves video URL extraction. Don't reinvent—refactor and reuse.
- **Minimal changes first**: Get MVP working, then optimize.
- **Console logging**: Liberal use of DEBUG_MODE-gated logs helps trace issues.
- **Test incrementally**: After each phase, manually verify before moving forward.
- **Badge UX**: Keep it simple—one icon, loading spinner, that's it.

***

**Ready to execute!** This checklist should give the LLM coding agent clear direction while allowing flexibility in implementation details. Let me know if you want me to adjust any section or add more specifics anywhere!

