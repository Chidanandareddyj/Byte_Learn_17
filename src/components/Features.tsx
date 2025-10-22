export function Features() {
  return (
    <section id="features" className="py-20">
      <div className="container mx-auto px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-lg border p-6">
            <h3 className="text-xl font-semibold">AI-powered animations</h3>
            <p className="mt-2 text-muted-foreground">Generate Manim animations from your prompts.</p>
          </div>
          <div className="rounded-lg border p-6">
            <h3 className="text-xl font-semibold">Interactive learning</h3>
            <p className="mt-2 text-muted-foreground">Explore concepts visually and intuitively.</p>
          </div>
          <div className="rounded-lg border p-6">
            <h3 className="text-xl font-semibold">Shareable results</h3>
            <p className="mt-2 text-muted-foreground">Export visuals and narrations to share.</p>
          </div>
        </div>
      </div>
    </section>
  );
}


