import * as React from "react"
import { cn } from "@/lib/utils"
import { Message } from "@/lib/types"

interface ChatMessageProps {
  message: Message
  className?: string
}

export function ChatMessage({ message, className }: ChatMessageProps) {
  return (
    <div className={cn("mb-4", className)}>
      <div className={cn(
        "p-4 rounded-lg",
        message.role === "user" 
          ? "bg-blue-50 dark:bg-blue-950 border-blue-100 dark:border-blue-900 ml-8" 
          : "bg-green-50 dark:bg-green-950 border-green-100 dark:border-green-900 mr-8"
      )}>
        <div className="text-sm font-medium mb-2 capitalize">
          {message.role}
        </div>
        <div className="text-sm">
          {message.content}
        </div>
      </div>
    </div>
  )
} 