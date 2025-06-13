import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface CtaButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const CtaButton = forwardRef<HTMLButtonElement, CtaButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        className={cn('cta-button', className)}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);

CtaButton.displayName = 'CtaButton';

export { CtaButton };