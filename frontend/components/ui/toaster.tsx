"use client"

import * as React from "react"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map(function ({ id, title, description, variant, ...props }) {
        return (
          <div
            key={id}
            className={cn(
              "group pointer-events-auto relative flex w-full items-center justify-between space-x-2 overflow-hidden rounded-md border p-4 pr-6 shadow-lg transition-all",
              variant === "destructive"
                ? "border-destructive bg-destructive text-destructive-foreground"
                : "border bg-background text-foreground"
            )}
            {...props}
          >
            <div className="grid gap-1">
              {title && (
                <div className="text-sm font-semibold">{title}</div>
              )}
              {description && (
                <div className="text-sm opacity-90">{description}</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
} 