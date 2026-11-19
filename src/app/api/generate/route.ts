import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import { generateUniqueId } from "@/lib/ids";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const clerkIdValue = clerkUser.id;

    const body = await request.json();
    const prompt: string | undefined = body?.prompt;
    const language: string = body?.language ?? "english";

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const trimmedPrompt = prompt.trim();

    const promptRecord = await prisma.$transaction(async (tx) => {
      await tx.user.upsert({
        where: { clerkId: clerkIdValue },
        update: {},
        create: { clerkId: clerkIdValue },
      });

      const createdPrompt = await tx.prompt.create({
        data: {
          promptId: generateUniqueId(),
          prompt: trimmedPrompt,
          language,
          clerkId: clerkIdValue,
        },
      });

      await tx.video.create({
        data: {
          promptId: createdPrompt.id,
          status: "QUEUED",
        },
      });

      await tx.mux.create({
        data: {
          promptId: createdPrompt.id,
          status: "QUEUED",
          stage: "queued",
        },
      });

      return createdPrompt;
    });

    return NextResponse.json(
      {
        success: true,
        promptId: promptRecord.promptId,
        promptRecordId: promptRecord.id,
      },
      { status: 202 }
    );
  } catch (error) {
    console.error("Error generating content:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}
