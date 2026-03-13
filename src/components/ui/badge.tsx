import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-lg border px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-all duration-200 overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-sm [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive/90 text-white shadow-sm [a&]:hover:bg-destructive/80",
        outline:
          "border-border/50 text-muted-foreground bg-background [a&]:hover:bg-muted/50 [a&]:hover:text-foreground",
        // 扩展的状态变体 - 使用柔和的莫兰迪色系
        success:
          "border-transparent bg-[oklch(0.92_0.02_160)] text-[oklch(0.35_0.08_160)] dark:bg-[oklch(0.25_0.03_160)] dark:text-[oklch(0.85_0.05_160)]",
        warning:
          "border-transparent bg-[oklch(0.94_0.03_70)] text-[oklch(0.40_0.08_70)] dark:bg-[oklch(0.28_0.04_70)] dark:text-[oklch(0.88_0.06_70)]",
        info:
          "border-transparent bg-[oklch(0.93_0.02_240)] text-[oklch(0.35_0.06_240)] dark:bg-[oklch(0.26_0.03_240)] dark:text-[oklch(0.86_0.05_240)]",
        error:
          "border-transparent bg-[oklch(0.92_0.02_25)] text-[oklch(0.38_0.10_25)] dark:bg-[oklch(0.25_0.03_25)] dark:text-[oklch(0.85_0.06_25)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
