import { currentUser } from "@clerk/nextjs/server";
import { PrismaClient } from "generated/prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

// Singleton pattern for PrismaClient to avoid connection issues
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Retry helper function for API calls
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a retryable error (503, 429, etc.)
      const isRetryable = error.status === 503 || error.status === 429;
      
      if (!isRetryable || i === maxRetries - 1) {
        throw error;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = initialDelay * Math.pow(2, i);
      console.log(`Retry attempt ${i + 1}/${maxRetries} after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

const scriptGenerationSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "A concise, engaging title for the math explanation video.",
    },
    explanation: {
      type: Type.STRING,
      description: "A detailed ChatGPT-style explanation of the mathematical concept. Explain the intuition, key ideas, and walk through the concept step-by-step in a conversational manner.",
    },
    scenes: {
      type: Type.ARRAY,
      description: "An array of Manim animation scenes that make up the video.",
      items: {
        type: Type.OBJECT,
        properties: {
          sceneNumber: {
            type: Type.NUMBER,
            description: "The sequential number of this scene (1, 2, 3, etc.)",
          },
          manimScript: {
            type: Type.STRING,
            description:
              "Python Manim code for this scene. Write actual Manim code using classes like Text, MathTex, Circle, Square, Arrow, Create, Transform, FadeIn, FadeOut, Write, etc. Make it production-ready code that can be executed directly in a Manim Scene class.",
          },
          narration: {
            type: Type.STRING,
            description:
              "The voice-over narration script for this scene. Keep it clear, concise, and synchronized with the animation timing. Write as if you're explaining to a curious student.",
          },
          duration: {
            type: Type.NUMBER,
            description: "Estimated duration of this scene in seconds.",
          },
        },
        required: ["sceneNumber", "manimScript", "narration", "duration"],
      },
    },
  },
  required: ["title", "explanation", "scenes"],
};
export async function POST(request: NextRequest) {
  const clerkid = await currentUser();
  const { prompt } = await request.json();

  if (!prompt) {
    return NextResponse.json(
      { error: "Prompt is required" },
      { status: 400 }
    );
  }

  const systemInstruction = `You are an expert mathematics educator and content creator, in the style of 3Blue1Brown. 
  Your task is to generate a complete package for an animated math video:
  1. A detailed explanation (like ChatGPT would provide) - intuitive, step-by-step, conversational
  2. Manim animation scenes with actual Python/Manim code
  3. Narration scripts synchronized with each scene
  
  For the Manim code:
  - Write production-ready Python code using the Manim library
  - Use proper Manim classes: Text, MathTex, Tex, Circle, Square, Rectangle, Arrow, Dot, VGroup, etc.
  - Use animations: Create, FadeIn, FadeOut, Transform, Write, ShowCreation, ApplyMethod, etc.
  - Include positioning: .shift(), .next_to(), .to_edge(), .move_to()
  - Make animations smooth and visually appealing like 3Blue1Brown
  - Each scene should be self-contained and executable
  
  Respond with a valid JSON object that adheres to the provided schema.`;

  try {
    const clerkIdValue = clerkid?.id || "unknown";

    // Parallel execution: user upsert and prompt storage don't depend on each other
    const [user, storedPrompt] = await Promise.all([
      prisma.user.upsert({
        where: { clerkId: clerkIdValue },
        update: {},
        create: { clerkId: clerkIdValue },
      }),
      prisma.prompt.create({
        data: {
          promptId: generateUniqueId(),
          prompt: prompt,
        },
      }),
    ]);

    // AI generation with retry logic (this is the slow part)
    const response = await retryWithBackoff(async () => {
      return await ai.models.generateContent({
        model: "gemini-2.0-flash", // More stable than gemini-2.5-pro
        contents: `Generate a video script for the topic: "${prompt}"`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: scriptGenerationSchema,
        },
      });
    });

    const jsonText = response.text?.trim();
    
    if (!jsonText) {
      throw new Error("Empty response from AI");
    }

    const result = JSON.parse(jsonText);
    
    // Extract and combine all scene scripts
    const fullManimScript = result.scenes
      .map((scene: any) => `# Scene ${scene.sceneNumber}\n${scene.manimScript}`)
      .join('\n\n');
    
    // Extract and combine all narrations
    const fullNarration = result.scenes
      .map((scene: any, index: number) => `[Scene ${scene.sceneNumber}]\n${scene.narration}`)
      .join('\n\n');
    
    // Store the complete script in the database
    const savedScript = await prisma.script.create({
      data: {
        scriptId: generateUniqueId(),
        script: fullManimScript,
        explanation: result.explanation,
        narration: fullNarration,
        promptId: storedPrompt.id, // Link to the prompt using the actual database ID
      },
    });
    
    console.log(
      "Script generated and saved:", fullManimScript,
      "User:", clerkIdValue,
      "Prompt ID:", storedPrompt.promptId,
      "Script ID:", savedScript.scriptId
    );
    
    // Return the complete result including database IDs
    return NextResponse.json({ 
      success: true,
      promptId: storedPrompt.promptId,
      scriptId: savedScript.scriptId,
      result: {
        title: result.title,
        explanation: result.explanation,
        scenes: result.scenes,
        fullManimScript: fullManimScript,
        fullNarration: fullNarration,
      }
    });
  } catch (error) {
    console.error("Error generating content:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}

function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
