# Privacy Auto Blur

Privacy Auto Blur is a Chrome extension that automatically hides saved personal information when it appears on a web page.

## Features
- Save multiple personal-info entries in the options page
- Automatically scan page text after load
- Re-detect content on dynamic pages and SPA updates
- Optionally hide `input` and `textarea` values
- Strong blur plus solid box masking for safer hiding
- Faster partial rescans for better responsiveness

## Installation
1. Open `chrome://extensions`
2. Turn on Developer Mode
3. Click `Load unpacked`
4. Select this folder: `c:\Users\boywn\OneDrive\Desktop\hactor`

## Usage
1. Click the extension icon
2. Open Settings
3. Add personal information entries, one per line
4. Save and refresh the page if needed

## Current Limitations
- Does not detect text rendered inside images, canvas, or video
- Uses string matching, not advanced pattern matching yet
- Very large pages may still have some scanning cost

## Planned Improvements
- Regex-based pattern rules
- Site-specific allow/block lists
- Replace blur with text masking modes
- Temporary reveal or admin toggle
