import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:opacity-50 disabled:pointer-events-none select-none active:scale-[0.97]',
  {
    variants: {
      variant: {
        accent: 'bg-accent text-accent-contrast shadow-[0_4px_0_0_rgba(0,0,0,0.22)] hover:brightness-110 hover:shadow-[0_2px_0_0_rgba(0,0,0,0.22)] hover:translate-y-0.5',
        outline: 'border-2 border-line-strong bg-transparent text-ink hover:border-accent hover:text-accent-ink',
        ghost: 'bg-transparent text-ink-soft hover:bg-paper-2 hover:text-ink',
        danger: 'border-2 border-transparent bg-transparent text-danger hover:bg-danger/10',
        subtle: 'bg-paper-2 text-ink hover:bg-line/60',
      },
      size: {
        sm: 'h-8 px-3.5 text-[0.8rem]',
        md: 'h-10 px-4.5 text-sm',
        lg: 'h-12 px-6 text-[0.95rem]',
        icon: 'h-9 w-9',
        iconSm: 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'outline',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
);
Button.displayName = 'Button';
