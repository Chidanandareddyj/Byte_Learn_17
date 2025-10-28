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

    // Fetch all prompts for this user with their related videos and muxes
    // Include prompts with null clerkId to show existing videos created before the fix
    const prompts = await prisma.prompt.findMany({
      where: {
        OR: [
          { clerkId: clerkUser.id },
          { clerkId: null }, // Include prompts without a clerkId (old data)
          { clerkId: "unknown" }, // Include prompts with "unknown" clerkId (old data)
        ]
      },
      include: {
        scripts: {
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

    // Transform the data to match the expected Video interface
    const videos = prompts.map((prompt) => ({
      id: prompt.promptId,
      title: prompt.scripts[0]?.explanation || prompt.prompt.substring(0, 50) + "...",
      prompt: prompt.prompt,
      createdAt: prompt.createdAt.toISOString(),
      videoUrl: prompt.muxes[0]?.finalvideoUrl || null,
    }));

    return NextResponse.json(videos);
  } catch (error) {
    console.error("Error fetching videos:", error);
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 }
    );
  }
}
