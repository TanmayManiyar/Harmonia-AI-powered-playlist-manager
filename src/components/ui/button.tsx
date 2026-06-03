import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-1 focus-visible:ring-offset-paper disabled:opacity-50 disabled:pointer-events-none select-none',
  {
    variants: {
      variant: {
        accent: 'bg-accent text-accent-contrast hover:brightness-95 active:brightness-90',
        outline: 'border border-line-strong bg-transparent text-ink hover:bg-paper-2',
        ghost: 'bg-transparent text-ink-soft hover:bg-paper-2 hover:text-ink',
        danger: 'border border-transparent bg-transparent text-danger hover:bg-danger/10',
        subtle: 'bg-paper-2 text-ink hover:bg-line/60',
      },
      size: {
        sm: 'h-8 px-3 text-[0.8rem]',
        md: 'h-10 px-4 text-sm',
        lg: 'h-11 px-5 text-sm',
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
