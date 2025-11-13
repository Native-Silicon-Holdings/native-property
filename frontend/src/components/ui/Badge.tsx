import React from 'react';
import { clsx } from 'clsx';
import { X } from 'lucide-react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * The variant/color of the badge
   */
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'gray';
  /**
   * Size of the badge
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Is the badge removable?
   */
  removable?: boolean;
  /**
   * Callback when remove button is clicked
   */
  onRemove?: () => void;
  /**
   * Icon to display (from lucide-react)
   */
  icon?: React.ReactNode;
  /**
   * Should the badge be rounded (pill shape)?
   */
  rounded?: boolean;
  /**
   * Badge contents
   */
  children: React.ReactNode;
}

/**
 * Badge component for status indicators and labels
 */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      removable = false,
      onRemove,
      icon,
      rounded = true,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center gap-1 font-medium transition-colors';

    const variantStyles = {
      primary: 'bg-blue-100 text-blue-800 border-blue-200',
      secondary: 'bg-gray-100 text-gray-800 border-gray-200',
      success: 'bg-green-100 text-green-800 border-green-200',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      danger: 'bg-red-100 text-red-800 border-red-200',
      info: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      gray: 'bg-gray-100 text-gray-600 border-gray-200',
    };

    const sizeStyles = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-0.5 text-sm',
      lg: 'px-3 py-1 text-base',
    };

    const iconSizeStyles = {
      sm: 'h-3 w-3',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
    };

    return (
      <span
        ref={ref}
        className={clsx(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          rounded ? 'rounded-full' : 'rounded-md',
          'border',
          className
        )}
        {...props}
      >
        {icon && <span className={iconSizeStyles[size]}>{icon}</span>}
        {children}
        {removable && onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className={clsx(
              'ml-0.5 rounded-full hover:bg-black/10 transition-colors',
              iconSizeStyles[size]
            )}
            aria-label="Remove badge"
            type="button"
          >
            <X className="w-full h-full" />
          </button>
        )}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
