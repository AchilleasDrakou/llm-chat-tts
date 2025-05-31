import * as React from "react"
import { MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  className?: string
}

export function EmptyState({ className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center h-full p-8 text-center", className)}>
      <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Start a conversation
      </h3>
      <p className="text-muted-foreground max-w-md">
        Send a message to begin chatting with the AI assistant. You can ask questions, request help, or just have a conversation.
      </p>
    </div>
  )
} 