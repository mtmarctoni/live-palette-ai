import { Sparkles, History } from "lucide-react"
import UserPresence from "@/components/collaboration/user-presence"
import { ThemeToggle } from "@/components/theme-toggle"
import AuthButton from "@/components/auth/auth-button"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  onShowHistory: () => void
  showHistoryDisabled: boolean
}

export default function Header({ onShowHistory, showHistoryDisabled }: HeaderProps) {
  return (
    <header className="border-b border-border bg-gradient-to-r from-background via-card to-background backdrop-blur-sm sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">AI Color Palette Generator</h1>
              <div className="flex gap-1 mt-1">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <div className="w-2 h-2 bg-secondary rounded-full"></div>
                <div className="w-2 h-2 bg-accent rounded-full"></div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <UserPresence />
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={onShowHistory}
              disabled={showHistoryDisabled}
              className="border-primary/20 hover:bg-primary/5"
            >
              <History className="w-4 h-4 mr-2" />
              History
            </Button>
            <AuthButton />
          </div>
        </div>
      </div>
    </header>
  )
}
