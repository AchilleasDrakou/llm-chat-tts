import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface ApiKeyFormProps {
  onSave?: (apiKey: string) => void
  className?: string
}

export function ApiKeyForm({ onSave, className }: ApiKeyFormProps) {
  const [apiKey, setApiKey] = React.useState("")
  const [showKey, setShowKey] = React.useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave?.(apiKey)
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-4 p-6", className)}>
      <div>
        <h3 className="text-lg font-semibold mb-4">API Configuration</h3>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="api-key">API Key</Label>
        <div className="relative">
          <Input
            id="api-key"
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your API key"
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setShowKey(!showKey)}
          >
            {showKey ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      
      <Button type="submit" className="w-full">
        Save API Key
      </Button>
    </form>
  )
} 