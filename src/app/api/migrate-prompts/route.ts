import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Utility endpoint to migrate existing prompts without a clerkId to the current user.
 * This fixes the issue where old prompts weren't associated with users.
 * 
 * Usage: Just call GET /api/migrate-prompts once
 */
export async function GET() {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Update all prompts that have null or "unknown" clerkId to use the current user's clerkId
    const result = await prisma.prompt.updateMany({
      where: {
        OR: [
          { clerkId: null },
          { clerkId: "unknown" }
        ]
      },
      data: {
        clerkId: clerkUser.id
      }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully migrated ${result.count} prompts to user ${clerkUser.id}`,
      count: result.count
    });
  } catch (error) {
    console.error("Error migrating prompts:", error);
    return NextResponse.json(
      { error: "Failed to migrate prompts" },
      { status: 500 }
    );
  }
}
