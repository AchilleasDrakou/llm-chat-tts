import * as React from "react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react"
import { cn } from "@/lib/utils"

interface VoiceControlsProps {
  isRecording?: boolean
  isSpeaking?: boolean
  onToggleRecording?: () => void
  onToggleSpeaking?: () => void
  className?: string
}

export function VoiceControls({ 
  isRecording = false,
  isSpeaking = false,
  onToggleRecording,
  onToggleSpeaking,
  className 
}: VoiceControlsProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="outline"
        size="icon"
        onClick={onToggleRecording}
        className={cn(
          "transition-colors",
          isRecording && "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400"
        )}
      >
        {isRecording ? (
          <MicOff className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>
      
      <Button
        variant="outline"
        size="icon"
        onClick={onToggleSpeaking}
        className={cn(
          "transition-colors",
          isSpeaking && "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
        )}
      >
        {isSpeaking ? (
          <VolumeX className="h-4 w-4" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
} 