/**
 * SlopGuard Popup Script
 * Handles the extension popup UI and interactions
 */

document.addEventListener('DOMContentLoaded', () => {
  SlopGuardConfig.log('Popup loaded');
  
  loadStats();
  
  // Event listeners
  document.getElementById('viewVideos').addEventListener('click', viewVideos);
  document.getElementById('clearData').addEventListener('click', clearAllData);
});

// Load and display statistics
function loadStats() {
  chrome.runtime.sendMessage({ type: 'GET_VIDEOS' }, (response) => {
    if (response && response.success) {
      const videos = response.videos || [];
      document.getElementById('videoCount').textContent = videos.length;
      
      // Calculate total storage used
      let totalSize = 0;
      videos.forEach(video => {
        if (video.blob && video.blob.size) {
          totalSize += video.blob.size;
        }
      });
      
      const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
      document.getElementById('storageUsed').textContent = `${sizeInMB} MB`;
    }
  });
}

// Open frontend to view stored videos
function viewVideos() {
  updateStatus('Opening video manager...');
  
  chrome.runtime.sendMessage({ type: 'GET_VIDEOS' }, (response) => {
    if (response && response.success && response.videos.length > 0) {
      // For now, just open the frontend URL
      // In production, this would pass the video IDs
      chrome.tabs.create({ url: SlopGuardConfig.FRONTEND_URL });
    } else {
      updateStatus('No videos stored yet');
      setTimeout(() => updateStatus('Extension active and monitoring...'), 2000);
    }
  });
}

// Clear all stored data
function clearAllData() {
  if (!confirm('Are you sure you want to delete all stored videos? This cannot be undone.')) {
    return;
  }
  
  updateStatus('Clearing data...');
  
  chrome.runtime.sendMessage({ type: 'GET_VIDEOS' }, (response) => {
    if (response && response.success) {
      const videos = response.videos || [];
      let deleteCount = 0;
      
      videos.forEach(video => {
        chrome.runtime.sendMessage({ 
          type: 'DELETE_VIDEO', 
          id: video.videoId || video.id 
        }, (deleteResponse) => {
          deleteCount++;
          if (deleteCount === videos.length) {
            updateStatus('All data cleared!');
            loadStats();
            setTimeout(() => updateStatus('Extension active and monitoring...'), 2000);
          }
        });
      });
      
      if (videos.length === 0) {
        updateStatus('No data to clear');
        setTimeout(() => updateStatus('Extension active and monitoring...'), 2000);
      }
    }
  });
}

// Update status message
function updateStatus(message) {
  document.getElementById('status').textContent = message;
}

SlopGuardConfig.log('Popup script initialized');
