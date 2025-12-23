import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold uppercase tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow-[0_8px_30px_rgba(0,0,0,0.35)]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-[#ff2e63] via-[#ffd166] to-[#00d1c1] text-slate-900 border-2 border-amber-300 hover:brightness-110 active:translate-y-[1px]",
        destructive:
          "bg-destructive text-destructive-foreground border-2 border-red-300 hover:brightness-110 active:translate-y-[1px]",
        outline:
          "border-2 border-amber-300 bg-transparent text-amber-100 hover:bg-amber-300/10 hover:text-foreground",
        secondary:
          "bg-gradient-to-r from-[#0f3b33] to-[#0d5c63] text-amber-100 border-2 border-emerald-500/70 hover:brightness-110 active:translate-y-[1px]",
        ghost: "hover:bg-amber-200/10 text-amber-100",
        link: "text-amber-200 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    (<Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />)
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
