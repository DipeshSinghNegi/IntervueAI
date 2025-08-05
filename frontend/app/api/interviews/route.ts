// app/api/interviews/route.ts

import { NextResponse } from "next/server";

// POST: Receive interview form data
export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const scenario = formData.get("scenario") as string;
    const company = formData.get("company") as string;
    const position = formData.get("position") as string;
    const objective = formData.get("objective") as string;
    const resume = formData.get("resume") as File | null;

    console.log("Interview data received:", {
      scenario,
      company,
      position,
      objective,
      resumeName: resume?.name,
    });

    return NextResponse.json({
      success: true,
      message: "Interview submitted successfully.",
    });
  } catch (error) {
    console.error("Error handling POST:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process form." },
      { status: 500 }
    );
  }
}

// GET: Return dummy interview data
export async function GET() {
  const dummyData = [
    {
      id: 1,
      company: "OpenAI",
      position: "ML Engineer",
      objective: "Evaluate AI reasoning",
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      company: "Meta",
      position: "Product Designer",
      objective: "Understand design thinking",
      createdAt: new Date().toISOString(),
    },
  ];

  return NextResponse.json(dummyData);
}
