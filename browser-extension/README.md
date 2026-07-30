# JobSync Browser Extension

A browser extension for capturing job postings to your JobSync application with one click.

## Features

- **One-Click Capture**: Save job postings directly from job sites to your JobSync app
- **Smart Detection**: Automatically extracts job title, company, location, and description
- **Deduplication**: Prevents duplicate entries in your job list
- **Multiple Sources**: Works with most job posting websites

## Installation

### For Development

1. Open your browser's extension page:
   - **Chrome**: Navigate to `chrome://extensions/`
   - **Edge**: Navigate to `edge://extensions/`
   - **Brave**: Navigate to `brave://extensions/`

2. Enable "Developer mode" (toggle in the top-right corner)

3. Click "Load unpacked" and select the `browser-extension` directory

4. The JobSync Capture extension should now appear in your extensions list

### Configuration

1. Click the JobSync Capture extension icon in your browser toolbar
2. Click the "Configure" button
3. Enter your JobSync API URL (default: `http://localhost:3000`)
4. Click "Save Configuration"

## Usage

1. Navigate to any job posting page
2. Click the JobSync Capture extension icon
3. Review the extracted job information in the preview
4. Click "Capture Job" to save it to your JobSync application

## Supported Data

The extension attempts to extract:
- **Job Title**: The position title
- **Company Name**: The hiring organization
- **Location**: Job location (city, state, country)
- **Description**: Full job description
- **URL**: Link to the original posting

## How It Works

The extension uses multiple methods to extract job data:

1. **JSON-LD Structured Data**: Checks for JobPosting schema markup
2. **OpenGraph Meta Tags**: Extracts og:title, og:description, og:site_name
3. **Common CSS Selectors**: Looks for standard job site patterns
4. **Page Metadata**: Falls back to basic page title and meta description

## Compatibility

The extension works with most modern job posting sites including:
- LinkedIn Jobs
- Indeed
- Glassdoor
- Monster
- Company career pages
- And many more!

## Privacy

- The extension only sends data to YOUR configured JobSync instance
- No data is sent to third parties
- All job data stays within your control

## Troubleshooting

### Extension not capturing data correctly

Some job sites may use non-standard markup. The extension will capture what it can detect, and you can edit the job details in JobSync after capture.

### "Not authenticated" error

Make sure you're logged into your JobSync application in the same browser before using the extension.

### Connection errors

Verify that:
1. Your JobSync application is running
2. The API URL in the extension settings is correct
3. Your browser allows connections to localhost (for local development)

## Development

### Project Structure

```
browser-extension/
├── manifest.json          # Extension configuration
├── popup/
│   ├── popup.html        # Extension popup UI
│   ├── popup.css         # Popup styles
│   └── popup.js          # Popup logic
├── content/
│   └── content.js        # Content script for data extraction
└── icons/
    ├── icon16.png        # 16x16 icon
    ├── icon48.png        # 48x48 icon
    └── icon128.png       # 128x128 icon
```

### Making Changes

1. Edit the relevant files
2. Go to your browser's extension page
3. Click the reload icon for the JobSync Capture extension
4. Test your changes

## Future Enhancements

Potential improvements for future versions:
- Support for email/newsletter job alerts
- Bulk capture mode
- Custom field mapping
- Auto-capture on page load (optional)
- Support for more job sites with custom extractors
