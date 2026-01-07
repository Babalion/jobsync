# Automated Job Capture - User Guide

This guide explains how to use the automated job capture feature in JobSync, which includes a browser extension and API for automatically capturing job postings from websites.

## Overview

The automated capture feature allows you to:
- Capture job postings from any website with one click
- Automatically extract job details (title, company, location, description)
- Avoid duplicate entries
- Save time on manual data entry

## Components

### 1. Backend API

The capture API is available at `/api/jobs/capture` and provides two endpoints:

#### POST /api/jobs/capture
Captures a job posting and saves it to your JobSync.

**Request Body:**
```json
{
  "url": "https://example.com/job-posting",
  "scrapedData": {
    "title": "Software Engineer",
    "company": "Acme Corp",
    "location": "San Francisco, CA",
    "description": "Job description...",
    "url": "https://example.com/job-posting"
  }
}
```

**Response:**
- `201 Created` - Job captured successfully
- `409 Conflict` - Job already exists (duplicate)
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Not authenticated
- `500 Internal Server Error` - Server error

#### GET /api/jobs/capture?url=<job_url>
Preview job data without saving.

## How It Works

### Data Extraction

The system uses multiple methods to extract job data, in order of priority:

1. **JSON-LD Structured Data** - Looks for JobPosting schema markup
2. **OpenGraph Meta Tags** - Extracts og:title, og:description, og:site_name
3. **Common CSS Selectors** - Searches for standard patterns used by job sites
4. **Basic Metadata** - Falls back to page title and meta description

### Deduplication

Jobs are deduplicated based on:
- **Exact URL match** - If the URL already exists
- **Company + Title match** - If both company and title match (case-insensitive)

This prevents duplicate entries when capturing jobs from multiple sources.

## Browser Extension

See [browser-extension/README.md](../browser-extension/README.md) for installation and usage instructions.
