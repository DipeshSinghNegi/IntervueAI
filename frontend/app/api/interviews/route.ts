// app/api/interviews/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // adjust the path if needed

// POST: Save interview
export async function POST(req: Request) {
  const formData = await req.formData();

  const scenario = formData.get("scenario") as string;
  const company = formData.get("company") as string;
  const position = formData.get("position") as string;
  const objective = formData.get("objective") as string;
  const resume = formData.get("resume") as File | null;

  const resumeName = resume?.name || "";

  try {
    const result = await prisma.interview.create({
      data: {
        scenario,
        company,
        position,
        objective,
        resumeName,
      },
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Failed to submit interview:", error);
    return NextResponse.json({ success: false, error: "Database error" }, { status: 500 });
  }
}

// ✅ GET: Fetch interviews for display
export async function GET() {
  try {
    const interviews = await prisma.interview.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(interviews);
  } catch (error) {
    console.error("Failed to fetch interviews:", error);
    return NextResponse.json({ error: "Failed to fetch interviews" }, { status: 500 });
  }
}
