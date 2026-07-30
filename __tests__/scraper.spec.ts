import {
  extractOpenGraphData,
  extractBasicMetadata,
  extractStructuredData,
  parseJobFromHtml,
} from '@/lib/scraper';

describe('scraper utilities', () => {
  describe('extractOpenGraphData', () => {
    it('should extract OpenGraph title', () => {
      const html = `
        <html>
          <head>
            <meta property="og:title" content="Software Engineer at Acme Corp" />
          </head>
        </html>
      `;
      const result = extractOpenGraphData(html);
      expect(result.title).toBe('Software Engineer at Acme Corp');
    });

    it('should extract OpenGraph description', () => {
      const html = `
        <html>
          <head>
            <meta property="og:description" content="Join our amazing team" />
          </head>
        </html>
      `;
      const result = extractOpenGraphData(html);
      expect(result.description).toBe('Join our amazing team');
    });

    it('should extract OpenGraph image', () => {
      const html = `
        <html>
          <head>
            <meta property="og:image" content="https://example.com/logo.png" />
          </head>
        </html>
      `;
      const result = extractOpenGraphData(html);
      expect(result.logoUrl).toBe('https://example.com/logo.png');
    });

    it('should extract site name as company', () => {
      const html = `
        <html>
          <head>
            <meta property="og:site_name" content="Acme Corporation" />
          </head>
        </html>
      `;
      const result = extractOpenGraphData(html);
      expect(result.company).toBe('Acme Corporation');
    });
  });

  describe('extractBasicMetadata', () => {
    it('should extract page title', () => {
      const html = `
        <html>
          <head>
            <title>Senior Developer | Tech Company</title>
          </head>
        </html>
      `;
      const result = extractBasicMetadata(html);
      expect(result.title).toBe('Senior Developer | Tech Company');
    });

    it('should extract meta description', () => {
      const html = `
        <html>
          <head>
            <meta name="description" content="Great opportunity for developers" />
          </head>
        </html>
      `;
      const result = extractBasicMetadata(html);
      expect(result.description).toBe('Great opportunity for developers');
    });
  });

  describe('extractStructuredData', () => {
    it('should extract JobPosting JSON-LD data', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@type": "JobPosting",
                "title": "Backend Engineer",
                "description": "We are looking for a backend engineer",
                "hiringOrganization": {
                  "name": "Tech Startup Inc",
                  "logo": "https://example.com/logo.jpg"
                },
                "jobLocation": {
                  "address": {
                    "addressLocality": "San Francisco",
                    "addressRegion": "CA"
                  }
                }
              }
            </script>
          </head>
        </html>
      `;
      const result = extractStructuredData(html);
      expect(result.title).toBe('Backend Engineer');
      expect(result.description).toBe('We are looking for a backend engineer');
      expect(result.company).toBe('Tech Startup Inc');
      expect(result.logoUrl).toBe('https://example.com/logo.jpg');
      expect(result.location).toBe('San Francisco, CA');
    });

    it('should handle array of JSON-LD items', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              [{
                "@type": "JobPosting",
                "title": "Frontend Developer"
              }]
            </script>
          </head>
        </html>
      `;
      const result = extractStructuredData(html);
      expect(result.title).toBe('Frontend Developer');
    });

    it('should skip invalid JSON-LD', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              { invalid json }
            </script>
          </head>
        </html>
      `;
      const result = extractStructuredData(html);
      expect(result).toEqual({});
    });
  });

  describe('parseJobFromHtml', () => {
    it('should merge data from multiple sources with correct priority', () => {
      const html = `
        <html>
          <head>
            <title>Basic Title</title>
            <meta property="og:title" content="OG Title" />
            <script type="application/ld+json">
              {
                "@type": "JobPosting",
                "title": "Structured Title",
                "description": "Structured description",
                "hiringOrganization": {
                  "name": "Structured Company"
                }
              }
            </script>
          </head>
        </html>
      `;
      const result = parseJobFromHtml(html, 'https://example.com/job');
      
      // Structured data should have highest priority
      expect(result.title).toBe('Structured Title');
      expect(result.description).toBe('Structured description');
      expect(result.company).toBe('Structured Company');
      expect(result.url).toBe('https://example.com/job');
    });

    it('should fallback to OpenGraph when structured data is missing', () => {
      const html = `
        <html>
          <head>
            <title>Basic Title</title>
            <meta property="og:title" content="OG Title" />
            <meta property="og:site_name" content="OG Company" />
          </head>
        </html>
      `;
      const result = parseJobFromHtml(html, 'https://example.com/job');
      
      expect(result.title).toBe('OG Title');
      expect(result.company).toBe('OG Company');
    });

    it('should fallback to basic metadata when others are missing', () => {
      const html = `
        <html>
          <head>
            <title>Job Title</title>
            <meta name="description" content="Job description" />
          </head>
        </html>
      `;
      const result = parseJobFromHtml(html, 'https://example.com/job');
      
      expect(result.title).toBe('Job Title');
      expect(result.description).toBe('Job description');
    });
  });
});
