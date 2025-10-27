import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import { createPromptForUser } from "@/lib/generation/service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const prompt: string | undefined = body?.prompt;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const clerkUser = await currentUser();

    const { prompt: promptRecord, user } = await createPromptForUser(
      prompt.trim(),
      clerkUser?.id ?? null
    );

    return NextResponse.json({
      success: true,
      promptId: promptRecord.promptId,
      promptRecordId: promptRecord.id,
      prompt: promptRecord.prompt,
      userId: user.id,
    });
  } catch (error) {
    console.error("Error creating prompt:", error);
    return NextResponse.json(
      { error: "Failed to create prompt" },
      { status: 500 }
    );
  }
}
