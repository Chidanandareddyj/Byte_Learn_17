import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-bold transition-[background-color,border-color,color,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-50 active:translate-y-px [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border border-yellow bg-yellow text-slate hover:border-yellow-bright hover:bg-yellow-bright",
        destructive:
          "border border-pink bg-pink text-slate hover:bg-pink/90",
        outline:
          "border border-chalk/30 bg-transparent text-chalk hover:border-chalk/50 hover:bg-chalk/10",
        secondary:
          "border border-line bg-board text-chalk hover:border-chalk/30 hover:bg-line/60",
        ghost:
          "border border-transparent bg-transparent text-chalk/80 hover:bg-chalk/10 hover:text-chalk",
      },
      size: {
        default: "min-h-10 px-5 py-2",
        sm: "min-h-8 px-3 text-xs",
        lg: "min-h-12 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
