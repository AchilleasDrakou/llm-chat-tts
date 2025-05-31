import * as React from "react"
import { Button } from "@/components/ui/button"
import { Settings, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatHeaderProps {
  onSettings?: () => void
  onReset?: () => void
  className?: string
}

export function ChatHeader({ onSettings, onReset, className }: ChatHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between p-4 border-b", className)}>
      <div>
        <h1 className="text-xl font-semibold">Chat Assistant</h1>
        <p className="text-sm text-muted-foreground">AI-powered conversation</p>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onReset}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={onSettings}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
} 