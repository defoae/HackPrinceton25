/**
 * SlopGuard Content Script
 * Runs on Instagram pages to detect and capture video content
 */

SlopGuardConfig.log('Content script loaded on:', window.location.href);

// CRITICAL FIX: Inject script into MAIN world to access React fiber
// Manifest V2 doesn't support "world": "MAIN", so we inject dynamically
(function injectMainWorldScript() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injected-script.js');
  script.onload = function() {
    SlopGuardConfig.log('[Injection] Main world script loaded successfully');
    this.remove();
  };
  script.onerror = function() {
    SlopGuardConfig.error('[Injection] Failed to load main world script');
  };
  (document.head || document.documentElement).appendChild(script);
  SlopGuardConfig.log('[Injection] Injecting main world script...');
})();

// Debug: Check if Instagram-Downloader functions are available
SlopGuardConfig.log('Instagram-Downloader functions available:', {
  IG_BASE_URL: typeof IG_BASE_URL !== 'undefined' ? IG_BASE_URL : 'undefined',
  IG_SHORTCODE_ALPHABET: typeof IG_SHORTCODE_ALPHABET !== 'undefined',
  IG_POST_REGEX: typeof IG_POST_REGEX !== 'undefined',
  getCookieValue: typeof getCookieValue,
  getFetchOptions: typeof getFetchOptions,
  convertToPostId: typeof convertToPostId,
  getPostPhotos: typeof getPostPhotos,
  getPostIdFromApiByShortcode: typeof getPostIdFromApiByShortcode,
  getValueByKey: typeof getValueByKey
});

// Expose for reuse/testing at global scope
try { 
  window.downloadInstagramVideo = null; // Will be set later in IIFE
  
  // Test function to manually trigger API call
  window.testInstagramAPI = async function() {
    const match = window.location.pathname.match(/\/(p|tv|reel|reels)\/([A-Za-z0-9_-]+)/);
    if (!match) {
      console.log('Not on a post/reel page. Try calling from a /p/ or /reel/ URL.');
      console.log('Current path:', window.location.pathname);
      
      // Try to find shortcode from visible posts
      const articles = document.querySelectorAll('article');
      console.log('Found', articles.length, 'article elements');
      
      if (articles.length > 0 && typeof getValueByKey === 'function') {
        const article = articles[0];
        const mediaLink = article.querySelector('[tabindex="0"][aria-hidden="true"]');
        if (mediaLink) {
          const queryRef = getValueByKey(mediaLink, 'queryReference');
          if (queryRef && queryRef.code) {
            console.log('Found shortcode from first article:', queryRef.code);
            console.log('Testing with that shortcode...');
            
            try {
              const postData = await getPostPhotos(queryRef.code);
              console.log('API returned:', postData);
              
              if (postData) {
                const items = postData.carousel_media ? postData.carousel_media : [postData];
                console.log('Items found:', items.length);
                
                items.forEach((item, idx) => {
                  const isVideo = item.media_type !== 1;
                  const url = isVideo ? item.video_versions?.[0]?.url : item.image_versions2?.candidates?.[0]?.url;
                  console.log(`Item ${idx}: ${isVideo ? 'VIDEO' : 'IMAGE'} - ${url}`);
                });
              }
            } catch (e) {
              console.error('Test failed:', e);
            }
            
            return;
          }
        }
      }
      
      return;
    }
    
    const shortcode = match[2];
    console.log('Testing with shortcode:', shortcode);
    
    try {
      const postData = await getPostPhotos(shortcode);
      console.log('API returned:', postData);
      
      if (postData) {
        const items = postData.carousel_media ? postData.carousel_media : [postData];
        console.log('Items found:', items.length);
        
        items.forEach((item, idx) => {
          const isVideo = item.media_type !== 1;
          const url = isVideo ? item.video_versions?.[0]?.url : item.image_versions2?.candidates?.[0]?.url;
          console.log(`Item ${idx}: ${isVideo ? 'VIDEO' : 'IMAGE'} - ${url}`);
        });
      }
    } catch (e) {
      console.error('Test failed:', e);
    }
  };
  
  console.log('Run window.testInstagramAPI() to test API calls');
  
  // Debug helper to inspect badge shortcodes
  window.inspectBadges = function() {
    const badges = document.querySelectorAll('.slopguard-badge');
    console.log('Found', badges.length, 'badges');
    badges.forEach((badge, idx) => {
      console.log(`Badge ${idx}:`, {
        shortcode: badge.dataset.shortcode || '(none)',
        parentVideo: !!badge.parentElement?.parentElement?.querySelector('video')
      });
    });
  };
  
  console.log('Run window.inspectBadges() to check badge shortcodes');
  
  // Debug helper to test shortcode extraction for visible videos
  window.testShortcodeExtraction = function() {
    const videos = document.querySelectorAll('video');
    console.log('Found', videos.length, 'video elements');
    
    videos.forEach((video, idx) => {
      console.log(`\n=== Video ${idx} ===`);
      const article = video.closest('article');
      console.log('Has article parent:', !!article);
      
      if (article) {
        const mediaLink = article.querySelector('[tabindex="0"][aria-hidden="true"]');
        console.log('Has mediaLink:', !!mediaLink);
        
        if (mediaLink && typeof getValueByKey === 'function') {
          const queryRef = getValueByKey(mediaLink, 'queryReference');
          console.log('queryReference:', queryRef);
        }
        
        const links = article.querySelectorAll('a[href*="/p/"], a[href*="/reel/"], a[href*="/tv/"]');
        console.log('Found', links.length, 'post/reel links');
        links.forEach((link, i) => {
          const match = link.href.match(/\/(p|tv|reel|reels)\/([A-Za-z0-9_-]+)/);
          if (match) console.log(`  Link ${i}: ${match[2]}`);
        });
      }
    });
  };
  
  console.log('Run window.testShortcodeExtraction() to debug extraction logic');
} catch(_) {}

// Badge overlay system
(function initBadgeOverlay() {
  const BADGE_CLASS = 'slopguard-badge';
  const BADGE_WRAPPER_CLASS = 'slopguard-badge-wrapper';
  const LOADING_CLASS = 'slopguard-badge-loading';
  const CLICK_DISABLED_CLASS = 'slopguard-badge-disabled';
  const OBSERVER_INTERVAL_MS = 1000;

  // Map video elements to their media info from network requests
  const videoMediaMap = new WeakMap();
  
  // Track currently visible post shortcode (updated by injected script in MAIN world)
  let currentShortcode = null;
  
  // Listen for shortcode from injected MAIN world script
  window.addEventListener('slopguard-shortcode', (e) => {
    if (e.detail && e.detail.code) {
      currentShortcode = e.detail.code;
      SlopGuardConfig.log('[Badge] ✓ Shortcode from MAIN world:', currentShortcode);
    }
  });

  // Inject core CSS once
  function injectCSS() {
    if (document.getElementById('slopguard-badge-styles')) return;
    const style = document.createElement('style');
    style.id = 'slopguard-badge-styles';
    style.textContent = `
      .${BADGE_WRAPPER_CLASS} {
        position: absolute;
        top: 6px;
        right: 6px;
        width: 40px;
        height: 40px;
        z-index: 9999;
        pointer-events: none;
      }
      .${BADGE_CLASS} {
        width: 100%;
        height: 100%;
        background: #fff;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        cursor: pointer;
        user-select: none;
        transition: transform .15s ease, opacity .15s ease, background .3s ease;
        pointer-events: auto;
      }
      .${BADGE_CLASS}:hover {
        transform: scale(1.08);
        opacity: 0.9;
      }
      .${BADGE_CLASS}.${CLICK_DISABLED_CLASS} {
        opacity: 0.5;
        cursor: default;
        pointer-events: none;
      }
      .${BADGE_CLASS}.${LOADING_CLASS} {
        background: #f5f5f5;
      }
      .${BADGE_CLASS}.${LOADING_CLASS}::before {
        content: '';
        width: 60%;
        height: 60%;
        border: 3px solid #999;
        border-top-color: #4a7cff;
        border-radius: 50%;
        animation: slopguard-spin 0.8s linear infinite;
      }
      @keyframes slopguard-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);
  }

  function isInViewport(el) {
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.top < window.innerHeight && rect.bottom > 0 && rect.left < window.innerWidth && rect.right > 0;
  }


  // Map badges to their AbortControllers
  const badgeControllers = new WeakMap();

  /**
   * Download an Instagram video given its DOM <video> element.
   * Returns a Promise that resolves to a Blob (without triggering browser download).
   * Uses AbortController for cancellation.
   * @param {HTMLVideoElement} videoElement - The video element
   * @param {AbortSignal} signal - Abort signal for cancellation
   * @param {string} [shortcodeHint] - Optional shortcode if known (for home feed)
   */
  function downloadInstagramVideo(videoElement, signal, shortcodeHint) {
    return new Promise(async (resolve, reject) => {
      const tryFetch = async (url) => {
        // CDN URLs don't need and don't support credentials
        // Only instagram.com API endpoints need credentials
        const needsCredentials = url.includes('instagram.com') && !url.includes('cdninstagram.com');
        
        const fetchOptions = {
          signal,
          mode: 'cors'
        };
        
        if (needsCredentials) {
          fetchOptions.credentials = 'include';
        }
        
        const resp = await fetch(url, fetchOptions);
        if (!resp.ok) throw new Error(`Network response not ok (${resp.status})`);
        return resp.blob();
      };
      try {
        if (!videoElement) throw new Error('No video element provided');
        const srcEl = videoElement.querySelector('source');
        const candidateUrl = videoElement.currentSrc || videoElement.src || (srcEl && srcEl.src);
        let videoUrl = candidateUrl && !candidateUrl.startsWith('blob:') ? candidateUrl : '';

        SlopGuardConfig.log('Initial video URL from DOM:', videoUrl || '(empty/blob)');
        SlopGuardConfig.log('Shortcode hint provided:', shortcodeHint || '(none)');

        // Strategy 1: Try to get URL from DOM (non-blob)
        if (videoUrl) {
          SlopGuardConfig.log('Using direct video URL from DOM');
        }
        
        // Strategy 2: Use Instagram-Downloader API approach
        if (!videoUrl) {
          SlopGuardConfig.log('Attempting Instagram API resolution...');
          try {
            let shortcode = shortcodeHint;
            
            // If no hint, try to extract from URL
            if (!shortcode) {
              const match = window.location.pathname.match(/\/(p|tv|reel|reels)\/([A-Za-z0-9_-]+)/);
              if (match && match[2]) {
                shortcode = match[2];
                SlopGuardConfig.log('Extracted shortcode from URL:', shortcode);
              } else {
                SlopGuardConfig.log('Could not extract shortcode from path:', window.location.pathname);
              }
            }
            
            if (shortcode) {
              // Use getPostPhotos which has the full API logic
              if (typeof getPostPhotos === 'function') {
                const postData = await getPostPhotos(shortcode);
                SlopGuardConfig.log('getPostPhotos returned:', postData ? 'data' : 'null');
                
                if (postData) {
                  // Handle carousel or single item
                  const items = postData.carousel_media ? postData.carousel_media : [postData];
                  SlopGuardConfig.log('Found items:', items.length);
                  
                  // Find first video or fallback to first item
                  const videoItem = items.find(i => i.media_type !== 1) || items[0];
                  
                  if (videoItem) {
                    const isVideo = videoItem.media_type !== 1;
                    videoUrl = isVideo 
                      ? videoItem.video_versions?.[0]?.url 
                      : videoItem.image_versions2?.candidates?.[0]?.url;
                    
                    SlopGuardConfig.log('Extracted URL from API:', videoUrl);
                  }
                }
              } else {
                SlopGuardConfig.error('getPostPhotos function not available');
              }
            }
          } catch (e) {
            SlopGuardConfig.error('Instagram API resolution failed:', e);
          }
        }

        if (!videoUrl) throw new Error('Video URL not found');

        SlopGuardConfig.log('Fetching video URL:', videoUrl);
        const blob = await tryFetch(videoUrl);
        SlopGuardConfig.log('Video blob fetched. Size (bytes):', blob.size);
        resolve(blob);
      } catch (err) {
        if (err.name === 'AbortError') {
          SlopGuardConfig.log('Video download aborted');
          return reject(err);
        }
        SlopGuardConfig.error('Failed to fetch video blob:', err);
        reject(err);
      }
    });
  }

  // Expose for reuse/testing
  try { window.downloadInstagramVideo = downloadInstagramVideo; } catch(_) {}


  function findVideos() {
    // Basic heuristic for Instagram videos
    return Array.from(document.querySelectorAll('video'));
  }

  function ensureWrapperPositioning(video) {
    const parent = video.parentElement;
    if (!parent) return parent;
    const style = window.getComputedStyle(parent);
    if (style.position === 'static') {
      parent.style.position = 'relative';
    }
    return parent;
  }

  function createBadge(video) {
    const wrapper = document.createElement('div');
    wrapper.className = BADGE_WRAPPER_CLASS;

    const badge = document.createElement('div');
    badge.className = BADGE_CLASS;
    badge.textContent = '🛡️'; // Idle icon

    // Try to extract shortcode - EXACTLY like Instagram-Downloader does
    let shortcode = null;
    SlopGuardConfig.log('[createBadge] Starting shortcode extraction for video');
    
    try {
      // Find the article parent (Instagram post container)
      const article = video.closest('article');
      SlopGuardConfig.log('[createBadge] Found article:', !!article);
      
      if (article) {
        // EXACT same approach as home-scroll-handler.js
        const mediaLink = article.querySelector('[tabindex="0"][aria-hidden="true"]');
        SlopGuardConfig.log('[createBadge] Found mediaLink:', !!mediaLink);
        
        if (mediaLink) {
          // Check if element has React fiber properties
          const reactProps = Object.keys(mediaLink).filter(k => k.startsWith('__react'));
          SlopGuardConfig.log('[createBadge] React properties on element:', reactProps);
          
          if (typeof getValueByKey === 'function') {
            // Try to get queryReference from React internals
            const queryRef = getValueByKey(mediaLink, 'queryReference');
            SlopGuardConfig.log('[createBadge] queryRef result:', queryRef);
            
            if (queryRef && queryRef.code) {
              shortcode = queryRef.code;
              SlopGuardConfig.log('[createBadge] ✓ Extracted shortcode from React fiber:', shortcode);
            } else {
              // DEBUG: Try searching deeper - maybe it's nested differently
              SlopGuardConfig.log('[createBadge] Trying to find code property anywhere...');
              const codeValue = getValueByKey(mediaLink, 'code');
              SlopGuardConfig.log('[createBadge] Found "code" property:', codeValue);
              
              // Try alternative property names
              const shortcodeValue = getValueByKey(mediaLink, 'shortcode');
              SlopGuardConfig.log('[createBadge] Found "shortcode" property:', shortcodeValue);
              
              if (codeValue && typeof codeValue === 'string' && /^[A-Za-z0-9_-]+$/.test(codeValue)) {
                shortcode = codeValue;
                SlopGuardConfig.log('[createBadge] ✓ Using "code" property:', shortcode);
              } else if (shortcodeValue) {
                shortcode = shortcodeValue;
                SlopGuardConfig.log('[createBadge] ✓ Using "shortcode" property:', shortcode);
              }
            }
          } else {
            SlopGuardConfig.log('[createBadge] getValueByKey not available');
          }
        }
        
        // Fallback: try to find a link with /p/ or /reel/ in the article
        if (!shortcode) {
          SlopGuardConfig.log('[createBadge] Trying link fallback...');
          
          // Try all links, including those without href attribute initially
          const allLinks = article.querySelectorAll('a');
          SlopGuardConfig.log('[createBadge] Found total links:', allLinks.length);
          
          for (const link of allLinks) {
            const href = link.href || link.getAttribute('href');
            if (href && (href.includes('/p/') || href.includes('/reel/') || href.includes('/tv/'))) {
              const match = href.match(/\/(p|tv|reel|reels)\/([A-Za-z0-9_-]+)/);
              if (match && match[2]) {
                shortcode = match[2];
                SlopGuardConfig.log('[createBadge] ✓ Extracted shortcode from link:', shortcode);
                break;
              }
            }
          }
          
          if (!shortcode) {
            SlopGuardConfig.log('[createBadge] No valid links found. Link hrefs:', 
              Array.from(allLinks).slice(0, 5).map(l => l.href).join(', '));
          }
        }
      } else {
        SlopGuardConfig.log('[createBadge] No article parent found for video');
      }
    } catch (e) {
      SlopGuardConfig.error('[createBadge] Failed to extract shortcode:', e);
    }

    // Store shortcode on the badge element for later use
    if (shortcode) {
      badge.dataset.shortcode = shortcode;
      SlopGuardConfig.log('[createBadge] ✓ Stored shortcode in badge dataset:', shortcode);
    } else {
      SlopGuardConfig.log('[createBadge] ⚠️ No shortcode extracted - badge will fail on click');
    }

    badge.addEventListener('click', async (e) => {
      e.stopPropagation();

      // Cancellation path
      if (badge.classList.contains(LOADING_CLASS)) {
        const controller = badgeControllers.get(badge);
        if (controller) {
          controller.abort();
          badgeControllers.delete(badge);
        }
        badge.classList.remove(LOADING_CLASS);
        badge.textContent = '🛡️';
        SlopGuardConfig.log('Badge loading cancelled');
        return;
      }

      // Start download
      const controller = new AbortController();
      badgeControllers.set(badge, controller);
      badge.classList.add(LOADING_CLASS);
      badge.textContent = '';
      SlopGuardConfig.log('[Badge] Badge clicked for video', video.currentSrc || video.src);
      
      // Get shortcode - should be available from injected MAIN world script
      let shortcodeToUse = currentShortcode;
      SlopGuardConfig.log('[Badge] Current shortcode:', shortcodeToUse);
      
      // Fallback: Extract from URL if on direct post page
      if (!shortcodeToUse) {
        const match = window.location.pathname.match(/\/(p|tv|reel|reels)\/([A-Za-z0-9_-]+)/);
        if (match && match[2]) {
          shortcodeToUse = match[2];
          SlopGuardConfig.log('[Badge] Extracted shortcode from URL:', shortcodeToUse);
        }
      }
      
      SlopGuardConfig.log('[Badge] Final shortcode to use:', shortcodeToUse || '(none)');

      try {
        const blob = await downloadInstagramVideo(video, controller.signal, shortcodeToUse);
        SlopGuardConfig.log('Blob ready. Size bytes:', blob.size);
        const videoId = (crypto && crypto.randomUUID) ? crypto.randomUUID() : `vid_${Date.now()}`;
        const metadata = { sourceUrl: window.location.href, fileSize: blob.size };
        let cleanupAttempts = 0;
        while (true) {
          try {
            await SlopGuardStorage.saveBlob(videoId, blob, metadata);
            SlopGuardConfig.log('Blob saved to IndexedDB with videoId', videoId);
            chrome.runtime.sendMessage({ type: 'OPEN_UPLOAD', videoId });
            break;
          } catch (e) {
            const quota = e && (e.name === 'QuotaExceededError' || /quota/i.test(e.message||''));
            if (quota && cleanupAttempts < 5) {
              cleanupAttempts++;
              await SlopGuardStorage.cleanupOldBlobs(1);
              continue;
            }
            throw e;
          }
        }
        badge.classList.remove(LOADING_CLASS);
        badge.textContent = '✅';
        setTimeout(() => { badge.textContent = '🛡️'; }, 1200);
      } catch (err) {
        badge.classList.remove(LOADING_CLASS);
        if (err && err.name === 'AbortError') {
          badge.textContent = '🛡️';
        } else {
          badge.textContent = '⚠️';
          setTimeout(() => {
            badge.textContent = '🛡️';
          }, 1500);
        }
      } finally {
        badgeControllers.delete(badge);
      }
    });

    wrapper.appendChild(badge);
    return wrapper;
  }

  function attachBadges() {
    const videos = findVideos();
    videos.forEach(video => {
      if (!isInViewport(video)) return;
      const parent = ensureWrapperPositioning(video);
      if (!parent) return;
      if (parent.querySelector(`.${BADGE_WRAPPER_CLASS}`)) return; // avoid duplicate
      const badgeWrapper = createBadge(video);
      parent.appendChild(badgeWrapper);
    });
  }

  function cleanupMissing() {
    document.querySelectorAll(`.${BADGE_WRAPPER_CLASS}`).forEach(wrapper => {
      const parent = wrapper.parentElement;
      if (!parent || !parent.querySelector('video')) {
        wrapper.remove();
      }
    });
  }

  function observeDynamic() {
    const observer = new MutationObserver(() => {
      attachBadges();
      cleanupMissing();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function startLoop() {
    attachBadges();
    cleanupMissing();
    setInterval(() => {
      attachBadges();
      cleanupMissing();
    }, OBSERVER_INTERVAL_MS);
  }

  injectCSS();
  observeDynamic();
  startLoop();
})();

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'PING') {
    sendResponse({ active: true });
  }
});
