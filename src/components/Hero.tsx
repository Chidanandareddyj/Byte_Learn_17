import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { BorderBeam } from "@/components/ui/border-beam";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { RetroGrid } from "@/components/ui/retro-grid";
// Use public/ path directly to avoid bundling issues with images
const heroImage = "/generated_images/Manim_math_animation_demo_14bc8a1a.png";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      <RetroGrid className="opacity-10" />
      <div className="container relative z-10 mx-auto px-6">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl">
            Learn concepts visually,{" "}
            <AnimatedGradientText
              className="text-5xl md:text-6xl lg:text-7xl font-bold"
              colorFrom="#60a5fa"
              colorTo="#a855f7"
              speed={1.5}
            >
              one byte at a time
            </AnimatedGradientText>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Transform your learning prompts into stunning visual explanations with AI-generated Manim animations and synchronized narration.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="gap-2 group" data-testid="button-cta-start">
                Start Learning 
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" data-testid="button-learn-more">
                Learn More
              </Button>
            </Link>
          </div>

          <div className="relative mt-16 rounded-xl overflow-hidden shadow-2xl border">
            <BorderBeam size={200} duration={12} delay={5} />
            <Image
              src={heroImage}
              alt="Manim mathematical animation demonstration"
              width={1200}
              height={675}
              className="w-full h-auto"
              data-testid="img-hero-demo"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
