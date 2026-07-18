import {
  normalizeUrl,
  normalizeJobTitle,
  levenshteinDistance,
  calculateSimilarity,
  areJobTitlesSimilar,
  areUrlsSimilar,
  arePotentialDuplicates,
} from "@/utils/deduplication.utils";

describe("Deduplication Utils", () => {
  describe("normalizeUrl", () => {
    it("should handle null and undefined", () => {
      expect(normalizeUrl(null)).toBe("");
      expect(normalizeUrl(undefined)).toBe("");
    });

    it("should remove protocol and www", () => {
      expect(normalizeUrl("https://www.example.com/job")).toBe("example.com/job");
      expect(normalizeUrl("http://example.com/job")).toBe("example.com/job");
    });

    it("should remove trailing slashes", () => {
      expect(normalizeUrl("https://example.com/job/")).toBe("example.com/job");
      expect(normalizeUrl("https://example.com/job///")).toBe("example.com/job");
    });

    it("should remove common tracking parameters", () => {
      const url = "https://example.com/job?utm_source=linkedin&utm_medium=social&ref=twitter";
      expect(normalizeUrl(url)).toBe("example.com/job");
    });

    it("should preserve important query parameters", () => {
      const url = "https://example.com/job?id=123&location=nyc";
      expect(normalizeUrl(url)).toBe("example.com/job?id=123&location=nyc");
    });

    it("should convert to lowercase", () => {
      expect(normalizeUrl("https://Example.COM/Job")).toBe("example.com/job");
    });

    it("should handle invalid URLs gracefully", () => {
      expect(normalizeUrl("not a url")).toBe("not a url");
      expect(normalizeUrl("example.com")).toBe("example.com");
    });
  });

  describe("normalizeJobTitle", () => {
    it("should handle null and undefined", () => {
      expect(normalizeJobTitle(null)).toBe("");
      expect(normalizeJobTitle(undefined)).toBe("");
    });

    it("should convert to lowercase and trim", () => {
      expect(normalizeJobTitle("  Software Engineer  ")).toBe("software engineer");
    });

    it("should replace multiple spaces with single space", () => {
      expect(normalizeJobTitle("Software    Engineer")).toBe("software engineer");
    });

    it("should remove parenthetical content at the end", () => {
      expect(normalizeJobTitle("Software Engineer (Remote)")).toBe("software engineer");
      expect(normalizeJobTitle("Data Scientist (PhD Required)")).toBe("data scientist");
    });

    it("should handle empty strings", () => {
      expect(normalizeJobTitle("")).toBe("");
      expect(normalizeJobTitle("   ")).toBe("");
    });
  });

  describe("levenshteinDistance", () => {
    it("should return 0 for identical strings", () => {
      expect(levenshteinDistance("hello", "hello")).toBe(0);
    });

    it("should calculate correct distance for different strings", () => {
      expect(levenshteinDistance("kitten", "sitting")).toBe(3);
      expect(levenshteinDistance("saturday", "sunday")).toBe(3);
    });

    it("should handle empty strings", () => {
      expect(levenshteinDistance("", "")).toBe(0);
      expect(levenshteinDistance("hello", "")).toBe(5);
      expect(levenshteinDistance("", "world")).toBe(5);
    });
  });

  describe("calculateSimilarity", () => {
    it("should return 1 for identical strings", () => {
      expect(calculateSimilarity("hello", "hello")).toBe(1);
    });

    it("should return values between 0 and 1", () => {
      const similarity = calculateSimilarity("software engineer", "software developer");
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThan(1);
    });

    it("should return 1 for two empty strings", () => {
      expect(calculateSimilarity("", "")).toBe(1);
    });

    it("should handle very different strings", () => {
      const similarity = calculateSimilarity("abc", "xyz");
      expect(similarity).toBeLessThan(0.5);
    });
  });

  describe("areJobTitlesSimilar", () => {
    it("should return false for null/undefined", () => {
      expect(areJobTitlesSimilar(null, "Software Engineer")).toBe(false);
      expect(areJobTitlesSimilar("Software Engineer", null)).toBe(false);
      expect(areJobTitlesSimilar(undefined, undefined)).toBe(false);
    });

    it("should return true for identical titles", () => {
      expect(areJobTitlesSimilar("Software Engineer", "Software Engineer")).toBe(true);
    });

    it("should return true for titles that differ only in case", () => {
      expect(areJobTitlesSimilar("Software Engineer", "software engineer")).toBe(true);
      expect(areJobTitlesSimilar("DATA SCIENTIST", "data scientist")).toBe(true);
    });

    it("should return true for titles with minor variations", () => {
      expect(areJobTitlesSimilar("Software Engineer (Remote)", "Software Engineer")).toBe(true);
      expect(areJobTitlesSimilar("Frontend Developer", "Front-end Developer")).toBe(true);
    });

    it("should return true for very similar titles", () => {
      expect(areJobTitlesSimilar("Senior Software Engineer", "Senior Software Enginee")).toBe(true);
    });

    it("should return false for different titles", () => {
      expect(areJobTitlesSimilar("Software Engineer", "Data Scientist")).toBe(false);
      expect(areJobTitlesSimilar("Frontend Developer", "Backend Developer")).toBe(false);
    });

    it("should respect custom threshold", () => {
      // With high threshold, require very similar
      expect(areJobTitlesSimilar("Software Engineer", "Software Developer", 0.95)).toBe(false);
      
      // With low threshold, allow more variation - these words are about 65% similar
      expect(areJobTitlesSimilar("Software Engineer", "Software Developer", 0.6)).toBe(true);
    });
  });

  describe("areUrlsSimilar", () => {
    it("should return false for null/undefined", () => {
      expect(areUrlsSimilar(null, "https://example.com")).toBe(false);
      expect(areUrlsSimilar("https://example.com", null)).toBe(false);
    });

    it("should return true for identical URLs after normalization", () => {
      expect(areUrlsSimilar(
        "https://example.com/job",
        "https://example.com/job"
      )).toBe(true);
    });

    it("should return true despite different protocols", () => {
      expect(areUrlsSimilar(
        "http://example.com/job",
        "https://example.com/job"
      )).toBe(true);
    });

    it("should return true despite www differences", () => {
      expect(areUrlsSimilar(
        "https://www.example.com/job",
        "https://example.com/job"
      )).toBe(true);
    });

    it("should return true despite tracking parameters", () => {
      expect(areUrlsSimilar(
        "https://example.com/job?utm_source=linkedin",
        "https://example.com/job"
      )).toBe(true);
    });

    it("should return true despite trailing slashes", () => {
      expect(areUrlsSimilar(
        "https://example.com/job/",
        "https://example.com/job"
      )).toBe(true);
    });

    it("should return false for different URLs", () => {
      expect(areUrlsSimilar(
        "https://example.com/job1",
        "https://example.com/job2"
      )).toBe(false);
    });

    it("should return false for different query parameters", () => {
      expect(areUrlsSimilar(
        "https://example.com/job?id=123",
        "https://example.com/job?id=456"
      )).toBe(false);
    });
  });

  describe("arePotentialDuplicates", () => {
    it("should return false if companies are different", () => {
      expect(arePotentialDuplicates(
        { companyId: "company1", jobTitleValue: "Software Engineer", jobUrl: null },
        { companyId: "company2", jobTitleValue: "Software Engineer", jobUrl: null }
      )).toBe(false);
    });

    it("should return true for same company and similar URLs", () => {
      expect(arePotentialDuplicates(
        {
          companyId: "company1",
          jobTitleValue: "Software Engineer",
          jobUrl: "https://example.com/job?utm_source=linkedin"
        },
        {
          companyId: "company1",
          jobTitleValue: "Software Engineer",
          jobUrl: "https://example.com/job"
        }
      )).toBe(true);
    });

    it("should return true for same company and similar titles", () => {
      expect(arePotentialDuplicates(
        {
          companyId: "company1",
          jobTitleValue: "Software Engineer",
          jobUrl: null
        },
        {
          companyId: "company1",
          jobTitleValue: "software engineer",
          jobUrl: null
        }
      )).toBe(true);
    });

    it("should return false for same company but different titles and no URL", () => {
      expect(arePotentialDuplicates(
        {
          companyId: "company1",
          jobTitleValue: "Software Engineer",
          jobUrl: null
        },
        {
          companyId: "company1",
          jobTitleValue: "Data Scientist",
          jobUrl: null
        }
      )).toBe(false);
    });

    it("should handle edge cases with missing data", () => {
      expect(arePotentialDuplicates(
        { companyId: "company1", jobTitleValue: "", jobUrl: null },
        { companyId: "company1", jobTitleValue: "", jobUrl: null }
      )).toBe(false);
    });

    it("should return true when URLs match even if titles differ slightly", () => {
      expect(arePotentialDuplicates(
        {
          companyId: "company1",
          jobTitleValue: "Sr. Software Engineer",
          jobUrl: "https://example.com/job/123"
        },
        {
          companyId: "company1",
          jobTitleValue: "Senior Software Engineer",
          jobUrl: "https://example.com/job/123"
        }
      )).toBe(true);
    });
  });
});
