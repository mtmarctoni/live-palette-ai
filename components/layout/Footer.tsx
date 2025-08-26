import { Sparkles } from "lucide-react"

export default function Footer() {
  return (
    <footer className="border-t border-border bg-gradient-to-r from-card via-background to-card relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5"></div>
      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-xl">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
            <h4 className="font-semibold text-foreground mb-2">AI Color Palette Generator</h4>
            <p className="text-sm text-muted-foreground">Transform ideas into beautiful color combinations</p>
          </div>

          <div className="text-center">
            <h4 className="font-semibold text-foreground mb-4">Color Harmony</h4>
            <div className="flex justify-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg shadow-md"></div>
              <div className="w-8 h-8 bg-secondary rounded-lg shadow-md"></div>
              <div className="w-8 h-8 bg-accent rounded-lg shadow-md"></div>
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg shadow-md"></div>
            </div>
            <p className="text-sm text-muted-foreground">Perfect color relationships</p>
          </div>

          <div className="text-center">
            <h4 className="font-semibold text-foreground mb-4">Live Preview</h4>
            <div className="space-y-2 mb-4">
              <div className="h-2 bg-gradient-to-r from-primary via-secondary to-accent rounded-full"></div>
              <div className="h-2 bg-gradient-to-r from-accent via-primary to-secondary rounded-full"></div>
              <div className="h-2 bg-gradient-to-r from-secondary via-accent to-primary rounded-full"></div>
            </div>
            <p className="text-sm text-muted-foreground">See changes in real-time</p>
          </div>
        </div>

        <div className="text-center pt-8 border-t border-border/50">
          <div className="flex justify-center gap-1 mb-4">
            <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-secondary rounded-full animate-pulse delay-200"></div>
            <div className="w-3 h-3 bg-accent rounded-full animate-pulse delay-400"></div>
          </div>
          <p className="text-muted-foreground">&copy; 2025 AI Color Palette Generator. Built with Next.js and AI.</p>
        </div>
      </div>
    </footer>
  )
}
