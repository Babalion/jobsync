# Automated Job Capture API Documentation

This document describes the API endpoints for automated job capture functionality, including browser extension integration and email/newsletter ingestion.

## Table of Contents
- [Job Capture API](#job-capture-api)
- [Email Ingestion API](#email-ingestion-api)
- [Deduplication Logic](#deduplication-logic)
- [Browser Extension Integration](#browser-extension-integration)

---

## Job Capture API

### POST /api/jobs/capture

Captures a job posting from external sources like browser extensions.

#### Authentication
Requires user authentication via session token.

#### Request Body

```json
{
  "jobTitle": "Software Engineer",
  "company": "TechCorp",
  "location": "San Francisco, CA",
  "jobType": "FT",
  "jobUrl": "https://example.com/jobs/123",
  "description": "Full job description...",
  "salaryRange": "$100k - $150k",
  "source": "linkedin"
}
```

#### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| jobTitle | string | Yes | The job title/position name |
| company | string | Yes | Company name |
| location | string | No | Job location (can be city, state, or "Remote") |
| jobType | enum | No | Job type: "FT" (Full Time), "PT" (Part Time), "C" (Contract). Default: "FT" |
| jobUrl | string (URL) | No | URL to the job posting |
| description | string | No | Full job description |
| salaryRange | string | No | Salary range or compensation details |
| source | string | No | Source of the job (e.g., "linkedin", "indeed") |

#### Success Response (201 Created)

```json
{
  "message": "Job captured successfully",
  "duplicate": false,
  "job": {
    "id": "job-uuid",
    "title": "Software Engineer",
    "company": "TechCorp",
    "location": "San Francisco, CA",
    "jobType": "FT",
    "status": "Draft",
    "source": "Browser Extension",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "jobUrl": "https://example.com/jobs/123"
  }
}
```

#### Duplicate Detection Response (200 OK)

```json
{
  "message": "Duplicate job detected",
  "duplicate": true,
  "existingJobId": "existing-job-uuid",
  "job": {
    "id": "existing-job-uuid",
    "title": "Software Engineer",
    "company": "TechCorp",
    "createdAt": "2023-12-25T00:00:00.000Z"
  }
}
```

#### Error Responses

**401 Unauthorized**
```json
{
  "error": "Authentication required"
}
```

**400 Bad Request**
```json
{
  "error": "Invalid job data",
  "details": [
    {
      "code": "too_small",
      "minimum": 1,
      "path": ["jobTitle"],
      "message": "Job title is required"
    }
  ]
}
```

**500 Internal Server Error**
```json
{
  "error": "Failed to capture job",
  "message": "Error details..."
}
```

---

## Email Ingestion API

### POST /api/jobs/email-ingest

Ingests job postings from email content (job alerts, newsletters).

#### Authentication
Requires user authentication via session token.

#### Request Body

```json
{
  "emailBody": "Job Alert: Software Engineer\n\nTechCorp is hiring...",
  "emailSubject": "New Job Alert: Software Engineer",
  "fromAddress": "jobs@linkedin.com"
}
```

#### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| emailBody | string | Yes | Full email body (plain text or HTML) |
| emailSubject | string | No | Email subject line |
| fromAddress | string (email) | No | Sender email address (helps with parsing) |

#### Success Response (201 Created)

```json
{
  "message": "Job ingested successfully from email",
  "duplicate": false,
  "parsedData": {
    "jobTitle": "Software Engineer",
    "company": "TechCorp",
    "location": "Remote",
    "jobUrl": "https://linkedin.com/jobs/view/123",
    "salaryRange": "$120k - $160k"
  },
  "job": {
    "id": "job-uuid",
    "title": "Software Engineer",
    "company": "TechCorp",
    "location": "Remote",
    "jobType": "FT",
    "status": "Draft",
    "source": "Email Alert",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "jobUrl": "https://linkedin.com/jobs/view/123"
  }
}
```

#### Parsing Error Response (400 Bad Request)

```json
{
  "error": "Unable to extract job information",
  "message": "Could not extract job title from email content",
  "parsedData": {
    "company": "TechCorp",
    "location": "Remote"
  }
}
```

---

## Deduplication Logic

Both APIs automatically detect and prevent duplicate job entries using the following criteria:

### Duplicate Detection Rules

1. **Same Company Required**: Jobs are only compared if they're from the same company
2. **URL Matching**: If both jobs have URLs and they match (after normalization), it's a duplicate
3. **Title Similarity**: If job titles are highly similar (>85% similarity), it's a duplicate

### URL Normalization

URLs are normalized before comparison:
- Protocol removed (http/https)
- www subdomain removed
- Trailing slashes removed
- Tracking parameters removed (utm_*, ref, source, etc.)
- Converted to lowercase

Examples:
- `https://example.com/job/123?utm_source=linkedin` → `example.com/job/123`
- `http://www.example.com/job/123/` → `example.com/job/123`

### Title Similarity

Job titles are normalized and compared using Levenshtein distance:
- Case-insensitive
- Extra whitespace removed
- Parenthetical content removed
- 85% similarity threshold by default

Examples of similar titles:
- "Software Engineer" ≈ "software engineer" (exact match after normalization)
- "Software Engineer (Remote)" ≈ "Software Engineer" (parenthetical removed)
- "Senior Software Engineer" ≈ "Senior Software Enginee" (minor typo)

### Time Window

Duplicate detection only checks jobs created in the last 30 days to improve performance.

---

## Browser Extension Integration

### Example Chrome Extension

Here's a minimal example of integrating the Job Capture API into a browser extension:

#### manifest.json

```json
{
  "manifest_version": 3,
  "name": "JobSync Capture",
  "version": "1.0.0",
  "permissions": ["activeTab", "scripting"],
  "action": {
    "default_popup": "popup.html"
  }
}
```

#### popup.js

```javascript
document.getElementById('captureBtn').addEventListener('click', async () => {
  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  // Extract job data from the page
  const jobData = {
    jobTitle: "Software Engineer", // Extract from page
    company: "TechCorp", // Extract from page
    jobUrl: tab.url,
    jobType: "FT",
    description: "..." // Extract from page
  };
  
  // Send to JobSync API
  const response = await fetch('http://localhost:3000/api/jobs/capture', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': 'your-session-cookie' // Handle authentication
    },
    body: JSON.stringify(jobData)
  });
  
  const result = await response.json();
  
  if (result.duplicate) {
    alert('This job was already saved!');
  } else {
    alert('Job saved successfully!');
  }
});
```

### OpenGraph Meta Tags

For better job extraction, the extension can look for OpenGraph meta tags:

```html
<meta property="og:title" content="Software Engineer at TechCorp" />
<meta property="og:description" content="Job description..." />
<meta property="og:url" content="https://example.com/jobs/123" />
```

### LinkedIn-Specific Parsing

```javascript
function extractLinkedInJob() {
  return {
    jobTitle: document.querySelector('.job-title')?.textContent,
    company: document.querySelector('.company-name')?.textContent,
    location: document.querySelector('.job-location')?.textContent,
    description: document.querySelector('.job-description')?.innerHTML,
    jobUrl: window.location.href
  };
}
```

---

## Error Handling

### Best Practices

1. **Check HTTP Status**: Always check the response status code
2. **Handle Duplicates Gracefully**: Status 200 with `duplicate: true` is not an error
3. **Validate Input**: Use the schema validation errors to show helpful messages
4. **Retry on 500**: Server errors may be transient
5. **Handle Authentication**: Redirect to login on 401

### Example Error Handler

```javascript
async function captureJob(jobData) {
  try {
    const response = await fetch('/api/jobs/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jobData)
    });
    
    const result = await response.json();
    
    if (response.status === 401) {
      // Redirect to login
      window.location.href = '/auth/signin';
      return;
    }
    
    if (response.status === 400) {
      // Show validation errors
      console.error('Validation errors:', result.details);
      return;
    }
    
    if (result.duplicate) {
      console.log('Duplicate detected:', result.existingJobId);
      return { success: true, duplicate: true, jobId: result.existingJobId };
    }
    
    return { success: true, duplicate: false, jobId: result.job.id };
  } catch (error) {
    console.error('Failed to capture job:', error);
    return { success: false, error: error.message };
  }
}
```

---

## Rate Limiting

Currently, there is no rate limiting on these endpoints. It is recommended to:
- Implement request throttling in your client
- Cache duplicate checks locally
- Batch multiple jobs if possible

---

## Security Considerations

1. **Authentication**: Always ensure users are authenticated
2. **Input Validation**: All inputs are validated server-side
3. **XSS Prevention**: HTML content is sanitized
4. **SQL Injection**: Using Prisma ORM provides protection
5. **CORS**: Configure CORS appropriately for browser extensions

---

## Support

For issues or questions:
1. Check the GitHub repository issues
2. Review the test files for usage examples
3. Submit a new issue with reproduction steps
