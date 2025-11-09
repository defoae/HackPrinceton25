# SlopGuard Chrome Extension

**We help you detect your daily brainrot.**

## Overview

SlopGuard is a Chrome extension that helps you identify AI-generated videos. The extension automatically detects Instagram videos (Reels, Stories, etc.), downloads them as blobs, stores them in IndexedDB, and provides an interface for uploading them to the SlopGuard platform for analysis.

## Features

- 🎯 **Automatic Video Detection**: Monitors Instagram for Reels, Stories, and video posts
- 💾 **Local Storage**: Downloads and stores videos as blobs in IndexedDB
- 🔒 **Privacy-Focused**: Videos remain local until you choose to upload them
- 🚀 **One-Click Upload**: Seamlessly send videos to SlopGuard platform for AI detection analysis
- 📊 **Video Management**: View and manage stored videos from the extension popup

## Installation

### Development Mode

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd slopguard-chrome
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" (toggle in top-right corner)

4. Click "Load unpacked" and select the extension directory

5. The SlopGuard extension should now appear in your extensions list

### Production

Coming soon to the Chrome Web Store.

## Configuration

The extension configuration can be found in `config.js`:

- **FRONTEND_URL**: Base URL of the SlopGuard web platform
- **FRONTEND_UPLOAD_ROUTE**: Upload endpoint path
- **MAX_VIDEO_SIZE_MB**: Maximum video size for storage (default: 50MB)
- **INDEXEDDB_NAME**: Local database name
- **INDEXEDDB_STORE_NAME**: Object store name for pending uploads
- **DEBUG_MODE**: Enable/disable console logging

## Project Structure

```
slopguard-chrome/
├── manifest.json           # Extension manifest (Manifest V2)
├── config.js              # Configuration settings
├── background.js          # Background service worker
├── content.js             # Content script for Instagram
├── popup.html             # Extension popup UI
├── popup.js               # Popup logic
├── icons/                 # Extension icons
└── README.md              # This file
```

## Permissions

The extension requires the following permissions:

- `storage`: For IndexedDB access to store video blobs
- `activeTab`: For interacting with Instagram pages
- `*://www.instagram.com/*`: Host permission for Instagram
- `*://instagram.com/*`: Host permission for Instagram (alternate domain)

## Development

### Debug Mode

Enable debug mode in `config.js` to see detailed console logs:

```javascript
DEBUG_MODE: true
```

### Testing

1. Load the extension in Chrome
2. Open DevTools Console
3. Navigate to Instagram
4. Check console for "[SlopGuard]" logs

## Privacy & Data

SlopGuard respects your privacy:

- Videos are stored locally in your browser's IndexedDB
- No data is uploaded without your explicit action
- You control what gets uploaded to the platform
- All stored data can be cleared from the extension popup

## Contributing

This is a project for HackPrinceton 2025. Contributions and feedback are welcome!

## License

TBD

## Support

For issues, questions, or feedback, please open an issue on GitHub.

---

**Built with ❤️ for HackPrinceton 2025**
