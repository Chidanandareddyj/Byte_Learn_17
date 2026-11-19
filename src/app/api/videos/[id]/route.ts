import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const prompt = await prisma.prompt.findUnique({
      where: {
        promptId: id,
      },
      include: {
        scripts: {
          take: 1,
          orderBy: {
            createdAt: "desc",
          },
        },
        videos: {
          take: 1,
          orderBy: {
            createdAt: "desc",
          },
        },
        muxes: {
          take: 1,
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!prompt) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    if (
      prompt.clerkId &&
      prompt.clerkId !== "unknown" &&
      prompt.clerkId !== clerkUser.id
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const script = prompt.scripts[0];
    const mux = prompt.muxes[0];
    const videoRecord = prompt.videos[0];

    const jobStatus = mux?.status ?? videoRecord?.status ?? "QUEUED";
    const jobError = mux?.errorMessage ?? videoRecord?.errorMessage ?? null;

    let parsedExplanation = "";
    let parsedNarration = "";

    try {
      parsedExplanation = script?.explanation || "";
      parsedNarration = script?.narration || "";
    } catch (error) {
      console.error("Error parsing script data:", error);
    }

    const video = {
      id: prompt.promptId,
      title: prompt.prompt.substring(0, 50) + (prompt.prompt.length > 50 ? "..." : ""),
      prompt: prompt.prompt,
      explanation: parsedExplanation,
      narration: parsedNarration,
      videoUrl: mux?.finalvideoUrl || null,
      status: jobStatus,
      stage: mux?.stage ?? null,
      errorMessage: jobError,
      createdAt: prompt.createdAt.toISOString(),
    };

    return NextResponse.json(video);
  } catch (error) {
    console.error("Error fetching video:", error);
    return NextResponse.json(
      { error: "Failed to fetch video" },
      { status: 500 }
    );
  }
}
