import { NextRequest, NextResponse } from "next/server";
import { captureJob, previewCapturedJob } from "@/actions/capture.actions";
import { z } from "zod";

const CaptureJobSchema = z.object({
  url: z.string().url("Invalid URL"),
  scrapedData: z.object({
    title: z.string().optional(),
    company: z.string().optional(),
    location: z.string().optional(),
    description: z.string().optional(),
    url: z.string(),
    logoUrl: z.string().optional(),
    salaryRange: z.string().optional(),
  }).optional(),
});

/**
 * POST /api/jobs/capture
 * Capture a job from a URL
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = CaptureJobSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid input",
          errors: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { url, scrapedData } = validationResult.data;

    // Capture the job
    const result = await captureJob({ url, scrapedData });

    if (!result.success) {
      return NextResponse.json(result, { 
        status: result.isDuplicate ? 409 : 500 
      });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error in capture job API:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/jobs/capture?url=<job_url>
 * Preview job data from a URL without saving
 */
export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        {
          error: "URL parameter is required",
        },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        {
          error: "Invalid URL format",
        },
        { status: 400 }
      );
    }

    const result = await previewCapturedJob(url);

    if ('error' in result) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error in preview job API:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
