"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  InfoIcon,
  Loader2Icon,
  TriangleAlertIcon,
} from "lucide-react"

/**
 * Toaster do shadcn sobre o sonner, sem `next-themes`: o painel só tem tema
 * claro (ver DESIGN.md). Cores vêm dos tokens do DS via CSS vars do sonner;
 * raio de card (20px), pill no botão de ação e copy em minúscula.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="bottom-right"
      closeButton
      className="toaster group"
      icons={{
        success: <CheckCircle2Icon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <AlertCircleIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border-strong)",
          "--border-radius": "20px",
          "--font-family": "var(--font-brand)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "font-normal shadow-md",
          title: "text-sm font-normal text-carvao",
          description: "!text-muted-fg text-xs",
          error: "[&_[data-icon]]:text-destructive",
          success: "[&_[data-icon]]:text-carvao",
          actionButton:
            "!rounded-full !bg-carvao !text-branco !font-normal lowercase hover:!bg-coral",
          cancelButton:
            "!rounded-full !bg-carvao-50 !text-carvao !font-normal lowercase",
          closeButton: "!border-border !bg-branco !text-muted-fg",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
