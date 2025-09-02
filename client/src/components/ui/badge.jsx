import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Eco-themed variants untuk GreenLoop branding
        "eco-green": "border-transparent bg-eco-green-500 text-white hover:bg-eco-green-600",
        "eco-blue": "border-transparent bg-eco-blue-500 text-white hover:bg-eco-blue-600",
        "eco-outline": "border-eco-green-500 text-eco-green-700 bg-eco-green-50",
        // Network/Testnet badges
        "network": "border-transparent bg-eco-blue-100 text-eco-blue-800 font-mono",
        "testnet": "border-transparent bg-eco-amber-100 text-eco-amber-800 font-mono",
        // Status variants untuk proof states
        "status-pending": "border-transparent bg-eco-amber-100 text-eco-amber-800",
        "status-verified": "border-transparent bg-eco-green-100 text-eco-green-800",
        "status-failed": "border-transparent bg-red-100 text-red-800",
        "status-processing": "border-transparent bg-eco-blue-100 text-eco-blue-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
