import * as React from "react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface SettingsPanelProps {
  className?: string
}

export function SettingsPanel({ className }: SettingsPanelProps) {
  const [ttsEnabled, setTtsEnabled] = React.useState(true)
  const [volume, setVolume] = React.useState([80])
  const [voice, setVoice] = React.useState("default")

  return (
    <div className={cn("space-y-6 p-6", className)}>
      <div>
        <h3 className="text-lg font-semibold mb-4">Settings</h3>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="tts-enabled">Text-to-Speech</Label>
          <Switch
            id="tts-enabled"
            checked={ttsEnabled}
            onCheckedChange={setTtsEnabled}
          />
        </div>
        
        <div className="space-y-2">
          <Label>Volume</Label>
          <Slider
            value={volume}
            onValueChange={setVolume}
            max={100}
            step={1}
            disabled={!ttsEnabled}
          />
        </div>
        
        <div className="space-y-2">
          <Label>Voice</Label>
          <Select value={voice} onValueChange={setVoice} disabled={!ttsEnabled}>
            <SelectTrigger>
              <SelectValue placeholder="Select voice" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="male">Male</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
} 