import { currentUser } from "@clerk/nextjs/server";
import { PrismaClient } from "generated/prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { createClient } from "@supabase/supabase-js";
import { text } from "stream/consumers";

// Singleton pattern for PrismaClient to avoid connection issues
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Initialize ElevenLabs client
const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key for server-side operations
);

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
      await new Promise((resolve) => setTimeout(resolve, delay));
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
      description:
        "A detailed ChatGPT-style explanation of the mathematical concept. Explain the intuition, key ideas, and walk through the concept step-by-step in a conversational manner.",
    },
    scenes: {
      type: Type.ARRAY,
      description: "An array of Manim animation scenes that make up the video. Generate 8-15 scenes for a 4-5 minute video.",
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
              "Python Manim code for this scene. CRITICAL: Use proper Python indentation (4 spaces per level). Verify that all lines inside construct() are indented correctly. Include generous wait times (self.wait(1) to self.wait(3)) and slower run_time values (run_time=2 to run_time=4) to allow viewers to absorb information. Build animations step-by-step. Avoid complex features like updaters. Make it production-ready code that can be executed directly in a Manim Scene class without syntax errors. Each scene should be 20-45 seconds long.",
          },
          narration: {
            type: Type.STRING,
            description:
              "The voice-over narration script for this scene. Write DETAILED narration (150-200 words for longer scenes). Speak slowly and clearly. Use conversational language and explain WHY, not just WHAT. This narration should take 20-40 seconds to speak at normal pace. Build intuition and explain step-by-step as if teaching a curious student who needs time to understand.",
          },
          duration: {
            type: Type.NUMBER,
            description: "Estimated duration of this scene in seconds. Should be between 20-45 seconds depending on complexity. Longer scenes (35-45s) for core concepts, shorter scenes (20-30s) for transitions.",
          },
        },
        required: ["sceneNumber", "manimScript", "narration", "duration"],
      },
    },
  },
  required: ["title", "explanation", "scenes"],
};


const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  const clerkid = await currentUser();
  const { prompt } = await request.json();

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  const systemInstruction = `You are an expert mathematics educator and content creator, in the style of 3Blue1Brown. 
  
  🚨 CRITICAL: DO NOT USE UPDATERS OR DYNAMIC FUNCTIONS 🚨
  NEVER use: add_updater, always_redraw, ValueTracker, UpdateFromAlphaFunc
  These functions WILL cause TypeError and crash the rendering.
  Only use simple static animations: Create, FadeIn, FadeOut, Write, Transform
  
  Your task is to generate a complete package for an animated math video that is COMPREHENSIVE and EDUCATIONAL:
  1. A detailed explanation (like ChatGPT would provide) - intuitive, step-by-step, conversational
  2. Manim animation scenes with actual Python/Manim code
  3. Narration scripts synchronized with each scene
  
  VIDEO LENGTH REQUIREMENTS:
  - Target video length: 4-5 minutes (240-300 seconds total)
  - Generate 8-15 scenes to achieve this length
  - Each scene should be 20-40 seconds long
  - Don't rush - take time to build intuition and show step-by-step reasoning
  - Include pauses (self.wait()) to let concepts sink in
  
  SCENE STRUCTURE - Create a comprehensive learning journey:
  1. **Introduction Scene** (20-30s): Hook the viewer, state the topic clearly
  2. **Context/Motivation Scene** (25-35s): Why this topic matters, real-world applications
  3. **Foundation Scenes** (2-3 scenes, 30-40s each): Build prerequisite knowledge
  4. **Main Concept Scenes** (3-5 scenes, 30-45s each): Core topic with deep explanations
  5. **Example/Application Scenes** (2-4 scenes, 25-40s each): Concrete examples, step-by-step solutions
  6. **Visual Proof/Derivation Scene** (30-45s): Show mathematical reasoning visually
  7. **Summary Scene** (20-30s): Recap key points
  8. **Conclusion Scene** (15-20s): Final thoughts, teaser for related topics
  
  NARRATION GUIDELINES:
  - Write DETAILED narration (150-200 words per scene for longer scenes)
  - Speak slowly and clearly - assume the viewer needs time to process
  - Use conversational language: "Let's think about...", "Notice that...", "Here's the key insight..."
  - Explain WHY, not just WHAT - build intuition
  - Add natural pauses in narration where animations happen
  - Each narration should take 20-40 seconds to speak at normal pace
  
  For the Manim code:
  - Write production-ready Python code using the Manim Community Edition (latest version)
  - ALWAYS include necessary imports at the top: "from manim import *" and "import numpy as np" if using numpy
  
  CRITICAL PYTHON SYNTAX RULES (MUST FOLLOW TO AVOID ERRORS):
  - **USE CONSISTENT INDENTATION**: Always use 4 spaces for indentation (never mix tabs and spaces)
  - **PROPER CLASS STRUCTURE**: Each scene class must have proper indentation for all methods
  - **CHECK YOUR INDENTATION**: Every line inside construct() must be indented exactly 8 spaces (2 levels)
  - **NO INDENTATION ERRORS**: Python is sensitive to whitespace - verify all code blocks align correctly
  - **LAMBDA FUNCTIONS**: When using lambda, ensure proper spacing: "lambda x: x**2" not "lambda x:x**2"
  - **METHOD CALLS**: Ensure all method calls are properly indented within their parent scope
  
  ⚠️ ABSOLUTELY FORBIDDEN - THESE WILL CAUSE ERRORS ⚠️:
  - ❌ NEVER use .add_updater() - CAUSES TypeError
  - ❌ NEVER use .clear_updaters() - CAUSES TypeError
  - ❌ NEVER use UpdateFromAlphaFunc - CAUSES TypeError
  - ❌ NEVER use always_redraw() - CAUSES TypeError
  - ❌ NEVER use ValueTracker - CAUSES errors
  - ❌ NEVER define update functions inside construct()
  - ❌ NEVER use axes.get_tangent() - DOES NOT EXIST
  - ❌ NEVER use axes.get_secant_slope_group() - DOES NOT EXIST
  - ❌ NEVER use ApplyMethod - DEPRECATED
  - ❌ NEVER use ShowCreation - DEPRECATED (use Create instead)
  
  ✅ ONLY USE THESE SAFE PATTERNS:
  - Use direct object creation and simple animations
  - For movement: self.play(obj.animate.move_to([x, y, 0]), run_time=2)
  - For transformations: self.play(Transform(obj1, obj2), run_time=2)
  - For visual effects: Create, FadeIn, FadeOut, Write only
  - Keep all animations simple and straightforward
  
  SAFE ANIMATION PATTERNS (USE THESE):
  - ✅ self.play(Create(obj), run_time=2)
  - ✅ self.play(FadeIn(obj), run_time=2)
  - ✅ self.play(FadeOut(obj), run_time=1)
  - ✅ self.play(Write(text), run_time=2)
  - ✅ self.play(Transform(obj1, obj2), run_time=2)
  - ✅ self.play(obj.animate.shift(RIGHT*2), run_time=2)
  - ✅ self.play(obj.animate.move_to([x, y, 0]), run_time=2)
  - ✅ self.wait(2)
  
  HOW TO SHOW A TANGENT LINE WITHOUT UPDATERS:
  Create the tangent line as a static Line object, not with updaters or always_redraw.
  Example: dot = Dot(axes.coords_to_point(2, 4), color=RED)
  Then: tangent = Line(start_point, end_point, color=GREEN)
  Then: self.play(Create(dot), Create(tangent), run_time=2)
  
  CORRECT INDENTATION EXAMPLE:
  "class MyScene(Scene):
      def construct(self):
          title = Text('Hello', font_size=48)
          self.play(Write(title), run_time=2)
          self.wait(1)"
  
  - Use ONLY these verified Manim classes and methods:
    * Shapes: Circle, Square, Rectangle, Triangle, Polygon, Line, Arrow, Dot, Ellipse
    * Text/Math: Text, MathTex (for math only - use Text() for regular text to avoid LaTeX errors)
    * Graphs: Axes (with axis_config={"include_numbers": True} for labels), NumberPlane, Graph
    * Groups: VGroup, VDict
    * Animations: Create, FadeIn, FadeOut, Transform, ReplacementTransform, Write, GrowFromCenter, Indicate, Circumscribe
    * Movement: Use .animate syntax - obj.animate.shift(), obj.animate.move_to(), obj.animate.rotate(), obj.animate.scale()
    * Methods: .shift(), .next_to(), .to_edge(), .move_to(), .scale(), .rotate(), .set_color(), .set_opacity()
    * AVOID: add_updater, clear_updaters, UpdateFromAlphaFunc, ApplyMethod, ShowCreation
  
  ANIMATION PACING (CRITICAL for longer videos):
  - Use run_time parameters generously: run_time=2 to run_time=4 for important animations
  - Add self.wait(1) to self.wait(3) between major steps to let viewers absorb information
  - Build animations step-by-step rather than all at once
  - Example: Instead of showing everything at once, reveal elements one by one:
    * self.play(Write(title), run_time=2)
    * self.wait(1.5)
    * self.play(FadeIn(equation), run_time=2)
    * self.wait(2)
  - Use slower transitions for complex concepts
  - Each scene should have multiple self.wait() calls
  
  ANIMATING MOVEMENT (use .animate syntax, NOT updaters):
  - To move objects: self.play(dot.animate.move_to([x, y, 0]), run_time=2)
  - To shift objects: self.play(obj.animate.shift(RIGHT*2), run_time=2)
  - To scale objects: self.play(obj.animate.scale(1.5), run_time=2)
  - To rotate objects: self.play(obj.animate.rotate(PI/4), run_time=2)
  - Multiple properties: self.play(obj.animate.shift(UP).scale(2).set_color(RED), run_time=2)
  
  CRITICAL TEXT RENDERING RULES:
  - **NEVER use Tex() class** - it causes LaTeX compilation errors
  - **ALWAYS use Text() for regular text** - e.g., Text("Hello World") instead of Tex("Hello World")
  - **Only use MathTex() for mathematical formulas** - e.g., MathTex(r"x^2 + 2x + 1")
  - For titles, labels, descriptions: Use Text()
  - For equations, formulas, symbols: Use MathTex()
  
  - For Axes: Use axis_config={"include_numbers": True} to show numbers. DO NOT use add_coordinate_labels() - it doesn't exist
  - For Riemann rectangles: Use axes.get_riemann_rectangles(graph, x_range=[a, b], dx=width, color=COLOR, fill_opacity=0.5)
  - For plotting functions: Use axes.plot(func, x_range=[a, b], color=COLOR) or axes.plot(lambda x: expression, ...)
  - AVOID deprecated methods: ShowCreation (use Create instead), ApplyMethod (use .animate syntax)
  - Each scene MUST be a complete class that extends Scene with a construct() method
  - Make animations smooth and visually appealing like 3Blue1Brown
  - Each scene should be self-contained and executable without errors
  
  LaTeX CONSTRAINTS (using minimal LaTeX installation):
  - ONLY use BASIC LaTeX math commands in MathTex(): \\frac{}{}, \\sqrt{}, ^{}, _{}, \\int, \\sum, \\lim, \\sin, \\cos, \\tan, \\pi, \\alpha, \\beta, \\theta
  - AVOID special packages: NO \\usepackage commands, NO \\mathbb, NO \\mathcal, NO \\bm, NO \\boldsymbol
  - For sets like ℝ, ℂ, ℕ: Use Text("R") with styling instead of MathTex(r"\\mathbb{R}")
  - For matrices: Use basic \\begin{matrix} or \\begin{array}{cc} (avoid amsmath extras)
  - Keep LaTeX simple and standard - stick to what's in basic LaTeX (1980s syntax)
  
  CONTENT DEPTH:
  - Don't assume prior knowledge - explain from first principles
  - Show multiple examples and perspectives
  - Include visual proofs where possible
  - Connect concepts to intuition and real-world applications
  - Each scene should add meaningful value to understanding
  
  MULTI-SCENE STRUCTURE:
  - Generate 8-15 scenes that flow together logically
  - Each scene should be a separate class with a unique descriptive name
  - The backend will automatically render all scenes and concatenate them into ONE final video
  - TOTAL video duration target: 240-300 seconds (4-5 minutes)
  - Each scene's duration should reflect its complexity (20-45 seconds)
  
  CRITICAL: Only use methods and attributes that exist in Manim Community Edition. If unsure, use basic proven methods.
  
  Respond with a valid JSON object that adheres to the provided schema.`;

  try {
    const clerkIdValue = clerkid?.id || "unknown";

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

    const response = await retryWithBackoff(async () => {
      return await ai.models.generateContent({
        model: "gemini-2.0-flash",
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
      .join("\n\n");

    // Extract and combine all narrations
    const fullNarration = result.scenes
      .map(
        (scene: any, index: number) =>
          `[Scene ${scene.sceneNumber}]\n${scene.narration}`
      )
      .join("\n\n");

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
      "Script generated and saved:",
      fullManimScript,
      "User:",
      clerkIdValue,
      "Prompt ID:",
      storedPrompt.promptId,
      "Script ID:",
      savedScript.scriptId
    );

    // Check if TTS is enabled (to save credits during testing)
    const enableTTS = process.env.ENABLE_TTS === "true";
    let audioUrl = "";
    
    if (enableTTS) {
      // Generate audio using ElevenLabs
      console.log("Generating audio with ElevenLabs...");
      const audioStream = await elevenlabs.textToSpeech.convert(
        "JBFqnCBsd6RMkjVDRZzb", // Default voice ID (you can change this)
        {
          text: fullNarration,
          modelId: "eleven_multilingual_v2",
          outputFormat: "mp3_44100_128",
        }
      );

      // Convert ReadableStream to Buffer
      const reader = audioStream.getReader();
      const chunks: Uint8Array[] = [];
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
      }
      
      const audioBuffer = Buffer.concat(chunks);

      // Upload audio to Supabase Storage
      const audioFileName = `${savedScript.scriptId}.mp3`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("audio")
        .upload(audioFileName, audioBuffer, {
          contentType: "audio/mpeg",
          upsert: true,
        });

      if (uploadError) {
        console.error("Error uploading audio to Supabase:", uploadError);
        throw new Error(`Failed to upload audio: ${uploadError.message}`);
      }

      // Get public URL for the audio file
      const { data: urlData } = supabase.storage
        .from("audio")
        .getPublicUrl(audioFileName);

      audioUrl = urlData.publicUrl;
      console.log("Audio uploaded successfully:", audioUrl);

      const storedAudio = await prisma.audio.create({
        data: {
          audioUrl: audioUrl,
          promptId: storedPrompt.id,
        },
      });
      console.log("Audio record saved in database:", storedAudio);
    } else {
      console.log("TTS disabled (ENABLE_TTS=false) - Skipping audio generation to save credits");
      audioUrl = "TTS_DISABLED";
    }

    // Backend will auto-detect all scene classes and render them sequentially
    console.log("Requesting video generation for all scenes in script");

    const videogeneration = await fetch(`${BACKEND_URL}/render-and-upload`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        script_code: fullManimScript,
        scene_name: "auto", // Backend will ignore this and auto-detect all scenes
        quality: "low"
      })
    });

    const videoResponse = await videogeneration.json();
    console.log("Video generation response:", videoResponse);

    if (!videogeneration.ok) {
      console.error("Video generation failed:", videoResponse);
      throw new Error(`Video generation failed: ${JSON.stringify(videoResponse)}`);
    }
    const storedVideo = await prisma.video.create({
      data: {
        videoUrl: videoResponse.video_url,
        promptId: storedPrompt.id,
      },
    });
    console.log("Video record saved in database:", storedVideo);

    // Return the complete result including database IDs and audio URL
    return NextResponse.json({
      success: true,
      promptId: storedPrompt.promptId,
      scriptId: savedScript.scriptId,
      audioUrl: audioUrl,
      videoUrl: videoResponse.video_url,
      videoMessage: videoResponse.message,
      result: {
        title: result.title,
        explanation: result.explanation,
        scenes: result.scenes,
        fullManimScript: fullManimScript,
        fullNarration: fullNarration,
      },
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
