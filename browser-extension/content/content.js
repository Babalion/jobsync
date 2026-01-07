// Content script for extracting job data from web pages

/**
 * Extract job data from common job posting patterns
 */
function extractJobData() {
  const data = {
    title: null,
    company: null,
    location: null,
    description: null
  };

  // Try to extract from JSON-LD structured data
  const structuredData = extractFromStructuredData();
  if (structuredData.title) {
    return structuredData;
  }

  // Try to extract from OpenGraph meta tags
  const ogData = extractFromOpenGraph();
  
  // Try to extract from common selectors
  const selectorData = extractFromSelectors();
  
  // Merge results with priority: structured > selectors > og
  return {
    title: structuredData.title || selectorData.title || ogData.title,
    company: structuredData.company || selectorData.company || ogData.company,
    location: structuredData.location || selectorData.location,
    description: structuredData.description || selectorData.description || ogData.description
  };
}

/**
 * Extract data from JSON-LD structured data
 */
function extractFromStructuredData() {
  const data = {
    title: null,
    company: null,
    location: null,
    description: null
  };

  try {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    
    for (const script of scripts) {
      try {
        const json = JSON.parse(script.textContent);
        const items = Array.isArray(json) ? json : [json];
        
        for (const item of items) {
          if (item['@type'] === 'JobPosting') {
            if (item.title) data.title = item.title;
            if (item.description) data.description = item.description;
            if (item.hiringOrganization?.name) data.company = item.hiringOrganization.name;
            
            // Extract location
            if (item.jobLocation?.address) {
              const addr = item.jobLocation.address;
              const parts = [
                addr.addressLocality,
                addr.addressRegion,
                addr.addressCountry
              ].filter(Boolean);
              if (parts.length > 0) {
                data.location = parts.join(', ');
              }
            }
            
            if (data.title) {
              return data;
            }
          }
        }
      } catch (e) {
        continue;
      }
    }
  } catch (error) {
    console.error('Error extracting structured data:', error);
  }

  return data;
}

/**
 * Extract data from OpenGraph meta tags
 */
function extractFromOpenGraph() {
  const data = {
    title: null,
    company: null,
    description: null
  };

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) {
    data.title = ogTitle.getAttribute('content');
  }

  const ogDescription = document.querySelector('meta[property="og:description"]');
  if (ogDescription) {
    data.description = ogDescription.getAttribute('content');
  }

  const ogSiteName = document.querySelector('meta[property="og:site_name"]');
  if (ogSiteName) {
    data.company = ogSiteName.getAttribute('content');
  }

  return data;
}

/**
 * Extract data from common CSS selectors used by job sites
 */
function extractFromSelectors() {
  const data = {
    title: null,
    company: null,
    location: null,
    description: null
  };

  // Common job title selectors
  const titleSelectors = [
    'h1.job-title',
    'h1.jobTitle',
    'h1[data-automation="job-title"]',
    '.job-title h1',
    '[class*="job-title"]',
    '[class*="JobTitle"]',
    'h1'
  ];

  for (const selector of titleSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      data.title = element.textContent.trim();
      break;
    }
  }

  // Common company name selectors
  const companySelectors = [
    '[data-automation="company-name"]',
    '.company-name',
    '.companyName',
    '[class*="company-name"]',
    '[class*="CompanyName"]',
    '[class*="employer"]'
  ];

  for (const selector of companySelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      data.company = element.textContent.trim();
      break;
    }
  }

  // Common location selectors
  const locationSelectors = [
    '[data-automation="location"]',
    '.location',
    '[class*="location"]',
    '[class*="Location"]'
  ];

  for (const selector of locationSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      data.location = element.textContent.trim();
      break;
    }
  }

  // Common description selectors
  const descriptionSelectors = [
    '[data-automation="job-description"]',
    '.job-description',
    '[class*="job-description"]',
    '[class*="JobDescription"]',
    '[id*="job-description"]'
  ];

  for (const selector of descriptionSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      data.description = element.textContent.trim();
      break;
    }
  }

  return data;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractJobData') {
    const jobData = extractJobData();
    sendResponse(jobData);
  }
  return true;
});

// Auto-extract on page load (optional - for future features)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Could add functionality here for automatic detection
  });
}
