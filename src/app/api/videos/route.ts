import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const prompts = await prisma.prompt.findMany({
      where: {
        OR: [
          { clerkId: clerkUser.id },
        ]
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
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log("Prompts found for user:", prompts.length);

    const videos = prompts.map((prompt) => {
      const latestMux = prompt.muxes[0];
      const latestVideo = prompt.videos[0];

      return {
        id: prompt.promptId,
        title: prompt.scripts[0]?.explanation || prompt.prompt.substring(0, 50) + "...",
        prompt: prompt.prompt,
        createdAt: prompt.createdAt.toISOString(),
        videoUrl: latestMux?.finalvideoUrl || null,
        status: latestMux?.status ?? latestVideo?.status ?? "QUEUED",
        stage: latestMux?.stage ?? null,
        errorMessage:
          latestMux?.errorMessage ?? latestVideo?.errorMessage ?? null,
      };
    });

    return NextResponse.json(videos);
  } catch (error) {
    console.error("Error fetching videos:", error);
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 }
    );
  }
}
