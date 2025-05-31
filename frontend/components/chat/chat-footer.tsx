import * as React from "react"
import { cn } from "@/lib/utils"

interface ChatFooterProps {
  className?: string
}

export function ChatFooter({ className }: ChatFooterProps) {
  return (
    <div className={cn("p-4 border-t text-center text-xs text-muted-foreground", className)}>
      AI responses may be inaccurate. Please verify important information.
    </div>
  )
} 