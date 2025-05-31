import * as React from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function ChatInput({ 
  value, 
  onChange, 
  onSubmit, 
  disabled = false,
  placeholder = "Type your message...",
  className 
}: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className={cn("flex items-end gap-2 p-4 border-t", className)}>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="min-h-[60px] max-h-[200px] resize-none"
      />
      <Button 
        onClick={onSubmit}
        disabled={disabled || !value.trim()}
        size="icon"
        className="mb-1"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  )
} 