import {
  parseJobFromEmail,
  parseLinkedInJobAlert,
  parseIndeedJobAlert,
  parseJobEmailAuto,
} from "@/utils/email-parser.utils";

describe("Email Parser Utils", () => {
  describe("parseJobFromEmail", () => {
    it("should extract job title from email", () => {
      const email = `
        Position: Senior Software Engineer
        We are looking for a talented developer.
      `;
      const result = parseJobFromEmail(email);
      expect(result.jobTitle).toBe("Senior Software Engineer");
    });

    it("should extract company name from email", () => {
      const email = `
        TechCorp is hiring a Software Engineer
        Company: TechCorp
      `;
      const result = parseJobFromEmail(email);
      expect(result.company).toBe("TechCorp");
    });

    it("should extract location from email", () => {
      const email = `
        Location: San Francisco, CA
        Remote position available.
      `;
      const result = parseJobFromEmail(email);
      expect(result.location).toContain("San Francisco");
    });

    it("should extract job URL from email", () => {
      const email = `
        Apply here: https://example.com/jobs/123
        Great opportunity!
      `;
      const result = parseJobFromEmail(email);
      expect(result.jobUrl).toBe("https://example.com/jobs/123");
    });

    it("should extract salary range from email", () => {
      const email = `
        Salary: $100,000 - $150,000
        Great benefits included.
      `;
      const result = parseJobFromEmail(email);
      expect(result.salaryRange).toContain("$100,000");
    });

    it("should handle email with subject line", () => {
      const subject = "Software Engineer Position";
      const body = "Great opportunity to join our team";
      const result = parseJobFromEmail(body, subject);
      expect(result.jobTitle).toBe("Software Engineer Position");
    });

    it("should extract company from email address if not in body", () => {
      const email = "We are hiring a developer";
      const fromAddress = "jobs@techcorp.com";
      const result = parseJobFromEmail(email, undefined, fromAddress);
      expect(result.company).toBe("Techcorp");
    });

    it("should handle HTML content", () => {
      const email = `
        <html>
          <body>
            <h1>Position: Frontend Developer</h1>
            <p>Company: StartupCo</p>
            <a href="https://startup.com/jobs/456">Apply now</a>
          </body>
        </html>
      `;
      const result = parseJobFromEmail(email);
      expect(result.jobTitle).toBe("Frontend Developer");
      expect(result.company).toBe("StartupCo");
      expect(result.jobUrl).toBe("https://startup.com/jobs/456");
    });

    it("should handle empty email", () => {
      const result = parseJobFromEmail("");
      expect(result.jobTitle).toBeUndefined();
      expect(result.company).toBeUndefined();
    });

    it("should limit description length", () => {
      const longText = "A".repeat(2000);
      const email = `Position: Developer\n${longText}`;
      const result = parseJobFromEmail(email);
      expect(result.description?.length).toBeLessThanOrEqual(1000);
    });

    it("should extract job title only up to newline", () => {
      const email = "Position: Software Engineer\nOther text here";
      const result = parseJobFromEmail(email);
      expect(result.jobTitle).toBe("Software Engineer");
    });
  });

  describe("parseLinkedInJobAlert", () => {
    it("should parse LinkedIn job alert format", () => {
      const email = `
        Job title: Data Scientist
        Company: LinkedIn Corp
        Location: Sunnyvale, CA
        Apply: https://www.linkedin.com/jobs/view/123456
      `;
      const result = parseLinkedInJobAlert(email);
      expect(result.jobTitle).toBe("Data Scientist");
      expect(result.company).toBe("LinkedIn Corp");
      expect(result.location).toBe("Sunnyvale, CA");
      expect(result.jobUrl).toContain("linkedin.com");
    });

    it("should extract LinkedIn job URL", () => {
      const email = `
        New job alert!
        https://www.linkedin.com/jobs/view/987654
        https://other-site.com/jobs
      `;
      const result = parseLinkedInJobAlert(email);
      expect(result.jobUrl).toContain("linkedin.com");
    });
  });

  describe("parseIndeedJobAlert", () => {
    it("should parse Indeed job alert format", () => {
      const email = "Job Alert: Backend Engineer\nTechStartup is hiring for this position\nApply: https://www.indeed.com/viewjob?jk=abc123";
      const result = parseIndeedJobAlert(email);
      expect(result.jobTitle).toBe("Backend Engineer");
      expect(result.company).toBe("TechStartup");
      expect(result.jobUrl).toContain("indeed.com");
    });

    it("should extract Indeed job URL", () => {
      const email = `
        New job available!
        https://www.indeed.com/viewjob?jk=xyz789
        https://example.com/jobs
      `;
      const result = parseIndeedJobAlert(email);
      expect(result.jobUrl).toContain("indeed.com");
    });
  });

  describe("parseJobEmailAuto", () => {
    it("should detect and parse LinkedIn emails by address", () => {
      const email = `
        Job title: Product Manager
        Company: LinkedIn
        Location: Remote
      `;
      const fromAddress = "jobs@linkedin.com";
      const result = parseJobEmailAuto(email, undefined, fromAddress);
      expect(result.jobTitle).toBe("Product Manager");
    });

    it("should detect and parse LinkedIn emails by content", () => {
      const email = `
        Job title: DevOps Engineer
        Apply at https://www.linkedin.com/jobs/view/123
      `;
      const result = parseJobEmailAuto(email);
      expect(result.jobUrl).toContain("linkedin.com");
    });

    it("should detect and parse Indeed emails by address", () => {
      const email = `
        Job Alert: QA Engineer
        TestCorp is hiring
      `;
      const fromAddress = "noreply@indeed.com";
      const result = parseJobEmailAuto(email, undefined, fromAddress);
      expect(result.jobTitle).toBe("QA Engineer");
    });

    it("should detect and parse Indeed emails by content", () => {
      const email = `
        New Job: Frontend Developer
        https://www.indeed.com/viewjob?jk=test123
      `;
      const result = parseJobEmailAuto(email);
      expect(result.jobUrl).toContain("indeed.com");
    });

    it("should fall back to generic parser for unknown sources", () => {
      const email = "Position: Full Stack Developer\nCompany: GenericCorp\nLocation: New York";
      const fromAddress = "hr@genericcorp.com";
      const result = parseJobEmailAuto(email, undefined, fromAddress);
      expect(result.jobTitle).toBe("Full Stack Developer");
      expect(result.company).toBe("GenericCorp");
    });
  });
});
