/**
 * @jest-environment node
 */

process.env.DATABASE_URL = "file:./prisma/test-capture.db";

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { POST } from "@/app/api/jobs/capture/route";
import { NextRequest } from "next/server";

jest.mock("@/utils/user.utils", () => ({
  getCurrentUser: jest.fn(),
}));

const { getCurrentUser } = jest.requireMock("@/utils/user.utils");

describe("Job Capture API Integration Tests", () => {
  const prisma = new PrismaClient();
  const testDbPath = path.join(process.cwd(), "prisma", "test-capture.db");
  let userId: string;
  let statusId: string;

  beforeAll(async () => {
    if (fs.existsSync(testDbPath)) {
      fs.rmSync(testDbPath);
    }
    execSync(
      "npx prisma db push --force-reset --skip-generate --schema prisma/schema.prisma",
      {
        stdio: "inherit",
        env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
      }
    );

    const user = await prisma.user.create({
      data: {
        name: "Capture Tester",
        email: "capture@example.com",
        password: "secret",
      },
    });
    userId = user.id;

    (getCurrentUser as jest.Mock).mockResolvedValue({
      id: user.id,
      name: user.name,
      email: user.email,
    });

    const status = await prisma.jobStatus.create({
      data: { label: "Draft", value: "draft" },
    });
    statusId = status.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  afterEach(async () => {
    // Clean up jobs but keep user and status
    await prisma.job.deleteMany({});
    await prisma.jobTitle.deleteMany({});
    await prisma.company.deleteMany({});
    await prisma.location.deleteMany({});
    await prisma.jobSource.deleteMany({});
  });

  describe("POST /api/jobs/capture", () => {
    it("should create a new job successfully", async () => {
      const requestBody = {
        jobTitle: "Software Engineer",
        company: "TechCorp",
        location: "San Francisco",
        jobType: "FT",
        jobUrl: "https://techcorp.com/jobs/123",
        description: "Great opportunity",
        salaryRange: "$100k - $150k",
      };

      const request = new NextRequest("http://localhost:3000/api/jobs/capture", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.message).toBe("Job captured successfully");
      expect(data.duplicate).toBe(false);
      expect(data.job).toMatchObject({
        title: "Software Engineer",
        company: "TechCorp",
        location: "San Francisco",
        jobType: "FT",
      });

      // Verify in database
      const savedJob = await prisma.job.findFirst({
        where: { id: data.job.id },
        include: { JobTitle: true, Company: true, Location: true },
      });

      expect(savedJob).toBeTruthy();
      expect(savedJob?.JobTitle.label).toBe("Software Engineer");
      expect(savedJob?.Company.label).toBe("TechCorp");
    });

    it("should detect exact duplicate by URL", async () => {
      const requestBody = {
        jobTitle: "Software Engineer",
        company: "TechCorp",
        jobUrl: "https://techcorp.com/jobs/123",
        jobType: "FT",
      };

      // Create first job
      const request1 = new NextRequest("http://localhost:3000/api/jobs/capture", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });
      const response1 = await POST(request1);
      expect(response1.status).toBe(201);

      // Try to create duplicate
      const request2 = new NextRequest("http://localhost:3000/api/jobs/capture", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });
      const response2 = await POST(request2);
      const data2 = await response2.json();

      expect(response2.status).toBe(200);
      expect(data2.duplicate).toBe(true);
      expect(data2.message).toBe("Duplicate job detected");
      expect(data2.existingJobId).toBeTruthy();
    });

    it("should detect duplicate by similar URL (ignoring tracking params)", async () => {
      const requestBody1 = {
        jobTitle: "Software Engineer",
        company: "TechCorp",
        jobUrl: "https://techcorp.com/jobs/123",
        jobType: "FT",
      };

      const requestBody2 = {
        jobTitle: "Software Engineer",
        company: "TechCorp",
        jobUrl: "https://techcorp.com/jobs/123?utm_source=linkedin&ref=twitter",
        jobType: "FT",
      };

      const request1 = new NextRequest("http://localhost:3000/api/jobs/capture", {
        method: "POST",
        body: JSON.stringify(requestBody1),
      });
      await POST(request1);

      const request2 = new NextRequest("http://localhost:3000/api/jobs/capture", {
        method: "POST",
        body: JSON.stringify(requestBody2),
      });
      const response2 = await POST(request2);
      const data2 = await response2.json();

      expect(response2.status).toBe(200);
      expect(data2.duplicate).toBe(true);
    });

    it("should detect duplicate by similar job title (same company)", async () => {
      const requestBody1 = {
        jobTitle: "Software Engineer",
        company: "TechCorp",
        jobType: "FT",
      };

      const requestBody2 = {
        jobTitle: "software engineer", // Different case
        company: "TechCorp",
        jobType: "FT",
      };

      const request1 = new NextRequest("http://localhost:3000/api/jobs/capture", {
        method: "POST",
        body: JSON.stringify(requestBody1),
      });
      await POST(request1);

      const request2 = new NextRequest("http://localhost:3000/api/jobs/capture", {
        method: "POST",
        body: JSON.stringify(requestBody2),
      });
      const response2 = await POST(request2);
      const data2 = await response2.json();

      expect(response2.status).toBe(200);
      expect(data2.duplicate).toBe(true);
    });

    it("should NOT detect duplicate for different companies", async () => {
      const requestBody1 = {
        jobTitle: "Software Engineer",
        company: "TechCorp",
        jobUrl: "https://techcorp.com/jobs/123",
        jobType: "FT",
      };

      const requestBody2 = {
        jobTitle: "Software Engineer",
        company: "OtherCorp", // Different company
        jobUrl: "https://othercorp.com/jobs/123",
        jobType: "FT",
      };

      const request1 = new NextRequest("http://localhost:3000/api/jobs/capture", {
        method: "POST",
        body: JSON.stringify(requestBody1),
      });
      await POST(request1);

      const request2 = new NextRequest("http://localhost:3000/api/jobs/capture", {
        method: "POST",
        body: JSON.stringify(requestBody2),
      });
      const response2 = await POST(request2);
      const data2 = await response2.json();

      expect(response2.status).toBe(201);
      expect(data2.duplicate).toBe(false);
    });

    it("should NOT detect duplicate for different job titles at same company", async () => {
      const requestBody1 = {
        jobTitle: "Software Engineer",
        company: "TechCorp",
        jobType: "FT",
      };

      const requestBody2 = {
        jobTitle: "Data Scientist", // Very different title
        company: "TechCorp",
        jobType: "FT",
      };

      const request1 = new NextRequest("http://localhost:3000/api/jobs/capture", {
        method: "POST",
        body: JSON.stringify(requestBody1),
      });
      await POST(request1);

      const request2 = new NextRequest("http://localhost:3000/api/jobs/capture", {
        method: "POST",
        body: JSON.stringify(requestBody2),
      });
      const response2 = await POST(request2);
      const data2 = await response2.json();

      expect(response2.status).toBe(201);
      expect(data2.duplicate).toBe(false);
    });

    it("should handle missing optional fields", async () => {
      const requestBody = {
        jobTitle: "Frontend Developer",
        company: "StartupCo",
        jobType: "FT",
        // No location, url, description, etc.
      };

      const request = new NextRequest("http://localhost:3000/api/jobs/capture", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.job.title).toBe("Frontend Developer");
      expect(data.job.company).toBe("StartupCo");
    });

    it("should return 400 for invalid job data", async () => {
      const requestBody = {
        jobTitle: "", // Invalid: empty title
        company: "TechCorp",
      };

      const request = new NextRequest("http://localhost:3000/api/jobs/capture", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid job data");
      expect(data.details).toBeTruthy();
    });

    it("should return 401 when not authenticated", async () => {
      (getCurrentUser as jest.Mock).mockResolvedValueOnce(null);

      const requestBody = {
        jobTitle: "Software Engineer",
        company: "TechCorp",
        jobType: "FT",
      };

      const request = new NextRequest("http://localhost:3000/api/jobs/capture", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Authentication required");

      // Restore mock
      (getCurrentUser as jest.Mock).mockResolvedValue({
        id: userId,
        name: "Capture Tester",
        email: "capture@example.com",
      });
    });

    it("should create default job source if not exists", async () => {
      const requestBody = {
        jobTitle: "Backend Engineer",
        company: "DevCorp",
        jobType: "FT",
      };

      const request = new NextRequest("http://localhost:3000/api/jobs/capture", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.job.source).toBe("Browser Extension");

      // Verify source was created
      const source = await prisma.jobSource.findUnique({
        where: { value: "extension" },
      });
      expect(source).toBeTruthy();
      expect(source?.label).toBe("Browser Extension");
    });

    it("should handle duplicate job title with parenthetical variations", async () => {
      const requestBody1 = {
        jobTitle: "Software Engineer (Remote)",
        company: "TechCorp",
        jobType: "FT",
      };

      const requestBody2 = {
        jobTitle: "Software Engineer",
        company: "TechCorp",
        jobType: "FT",
      };

      const request1 = new NextRequest("http://localhost:3000/api/jobs/capture", {
        method: "POST",
        body: JSON.stringify(requestBody1),
      });
      await POST(request1);

      const request2 = new NextRequest("http://localhost:3000/api/jobs/capture", {
        method: "POST",
        body: JSON.stringify(requestBody2),
      });
      const response2 = await POST(request2);
      const data2 = await response2.json();

      expect(response2.status).toBe(200);
      expect(data2.duplicate).toBe(true);
    });
  });
});
