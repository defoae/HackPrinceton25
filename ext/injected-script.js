/**
 * Injected Script - Runs in MAIN world to access React fiber
 * This script is injected into the page context, so it can access React internals
 */
(function() {
  console.log('[SlopGuard-Injected] Script loaded in MAIN world');
  
  // Copy getValueByKey function (must be redeclared in this context)
  function getValueByKey(obj, key) {
    if (typeof obj !== 'object' || obj === null) return null;
    const stack = [obj];
    const visited = new Set();
    while (stack.length) {
      const current = stack.pop();
      if (visited.has(current)) continue;
      visited.add(current);
      try {
        if (current[key] !== undefined) return current[key];
      } catch (error) {
        if (error.name === 'SecurityError') continue;
        console.log(error);
      }
      for (const value of Object.values(current)) {
        if (typeof value === 'object' && value !== null) {
          stack.push(value);
        }
      }
    }
    return null;
  }
  
  // Home scroll handler - tracks visible posts
  function debounce(func, delay) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => { func(...args); }, delay);
    };
  }
  
  const homeScrollHandler = debounce(() => {
    function getVisibleArea(element) {
      const rect = element.getBoundingClientRect();
      const viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
      const viewWidth = Math.max(document.documentElement.clientWidth, window.innerWidth);
      const height = Math.max(0, Math.min(rect.bottom, viewHeight) - Math.max(rect.top, 0));
      const width = Math.max(0, Math.min(rect.right, viewWidth) - Math.max(rect.left, 0));
      return height * width;
    }
    
    const postContainers = Array.from(document.querySelectorAll('article'));
    const mostVisibleElement = postContainers.reduce((mostVisible, container) => {
      const visibleArea = getVisibleArea(container);
      return visibleArea > mostVisible.area ? { element: container, area: visibleArea } : mostVisible;
    }, { element: null, area: 0 }).element;
    
    if (mostVisibleElement) {
      const mediaLink = mostVisibleElement.querySelector('[tabindex="0"][aria-hidden="true"]');
      if (mediaLink) {
        const mediaFragmentKey = getValueByKey(mediaLink, 'queryReference');
        if (mediaFragmentKey && mediaFragmentKey.code) {
          console.log('[SlopGuard-Injected] Found shortcode:', mediaFragmentKey.code);
          
          // Dispatch event that content script can listen to
          window.dispatchEvent(new CustomEvent('slopguard-shortcode', {
            detail: {
              code: mediaFragmentKey.code,
              pk: mediaFragmentKey.pk
            }
          }));
        }
      }
    }
  }, Math.floor(1000 / 60));
  
  // Start observing on home page
  if (window.location.pathname === '/') {
    const mainNode = document.querySelector('main');
    if (mainNode) {
      const observer = new MutationObserver(homeScrollHandler);
      observer.observe(mainNode, {
        attributes: true,
        childList: true,
        subtree: true
      });
      window.addEventListener('scroll', homeScrollHandler);
      console.log('[SlopGuard-Injected] Started observing home feed');
      
      // Run once immediately
      setTimeout(homeScrollHandler, 500);
    }
  }
  
  // Listen for URL changes (SPA navigation)
  let currentPath = window.location.pathname;
  const checkPathChange = () => {
    const newPath = window.location.pathname;
    if (newPath !== currentPath) {
      console.log('[SlopGuard-Injected] Path changed:', currentPath, '→', newPath);
      currentPath = newPath;
      
      // Restart observer if navigating to home
      if (newPath === '/') {
        setTimeout(() => {
          const mainNode = document.querySelector('main');
          if (mainNode) {
            const observer = new MutationObserver(homeScrollHandler);
            observer.observe(mainNode, {
              attributes: true,
              childList: true,
              subtree: true
            });
            window.addEventListener('scroll', homeScrollHandler);
            setTimeout(homeScrollHandler, 500);
          }
        }, 1000);
      }
    }
  };
  
  // Hook into history API
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function() {
    originalPushState.apply(this, arguments);
    checkPathChange();
  };
  
  history.replaceState = function() {
    originalReplaceState.apply(this, arguments);
    checkPathChange();
  };
  
  window.addEventListener('popstate', checkPathChange);
  
  console.log('[SlopGuard-Injected] Initialization complete');
})();
