import { Languages, Globe, Sparkles } from "lucide-react";

export function Features() {
  return (
    <section id="features" className="py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Why Choose ByteLearn?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience learning like never before with our cutting-edge features designed for modern education.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-lg border p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">AI-powered animations</h3>
            <p className="text-muted-foreground">Generate Manim animations from your prompts with advanced AI technology.</p>
          </div>

          <div className="rounded-lg border p-6 hover:shadow-lg transition-shadow relative">
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
              NEW
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 flex items-center justify-center mb-4">
              <Languages className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Indian Languages Narration</h3>
            <p className="text-muted-foreground">Learn in your preferred language with natural, conversational narration in Hindi, Telugu, Tamil, Kannada, Malayalam, Bengali, Marathi, and Gujarati.</p>
          </div>

          <div className="rounded-lg border p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
              <Globe className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Interactive learning</h3>
            <p className="text-muted-foreground">Explore concepts visually and intuitively with synchronized animations and narration.</p>
          </div>
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2 text-sm text-muted-foreground">
            <Languages className="w-4 h-4" />
            <span>Supporting 9 languages for inclusive education</span>
          </div>
        </div>
      </div>
    </section>
  );
}


