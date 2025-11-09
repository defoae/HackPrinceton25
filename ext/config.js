/**
 * SlopGuard Configuration
 * Central configuration file for the SlopGuard Chrome Extension
 */

const SlopGuardConfig = {
  // Frontend URLs
  FRONTEND_URL: 'https://slopguard.tech',
  FRONTEND_UPLOAD_ROUTE: '/upload',
  
  // Video constraints
  MAX_VIDEO_SIZE_MB: 50,
  
  // IndexedDB configuration
  INDEXEDDB_NAME: 'SlopGuardVideos',
  INDEXEDDB_STORE_NAME: 'pendingUploads',
  INDEXEDDB_VERSION: 2,
  
  // Development settings
  DEBUG_MODE: true,
  
  // Helper methods
  getFullUploadUrl: function(videoId) {
    return `${this.FRONTEND_URL}${this.FRONTEND_UPLOAD_ROUTE}?videoId=${videoId}`;
  },
  
  getMaxVideoSizeBytes: function() {
    return this.MAX_VIDEO_SIZE_MB * 1024 * 1024;
  },
  
  log: function(...args) {
    if (this.DEBUG_MODE) {
      console.log('[SlopGuard]', ...args);
    }
  },
  
  error: function(...args) {
    if (this.DEBUG_MODE) {
      console.error('[SlopGuard]', ...args);
    }
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SlopGuardConfig;
}
