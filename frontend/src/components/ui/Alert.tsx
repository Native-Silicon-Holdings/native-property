import React from 'react';
import { clsx } from 'clsx';
import { X, Info, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The variant/type of the alert
   */
  variant?: 'info' | 'success' | 'warning' | 'danger';
  /**
   * Alert title
   */
  title?: string;
  /**
   * Is the alert dismissible?
   */
  dismissible?: boolean;
  /**
   * Callback when alert is dismissed
   */
  onDismiss?: () => void;
  /**
   * Custom icon (overrides default)
   */
  icon?: React.ReactNode;
  /**
   * Hide the icon completely
   */
  hideIcon?: boolean;
  /**
   * Alert contents
   */
  children: React.ReactNode;
}

/**
 * Alert component for notifications and messages
 */
export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      variant = 'info',
      title,
      dismissible = false,
      onDismiss,
      icon,
      hideIcon = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [isDismissed, setIsDismissed] = React.useState(false);

    const variantStyles = {
      info: {
        container: 'bg-blue-50 border-blue-200 text-blue-900',
        icon: 'text-blue-600',
        defaultIcon: Info,
      },
      success: {
        container: 'bg-green-50 border-green-200 text-green-900',
        icon: 'text-green-600',
        defaultIcon: CheckCircle,
      },
      warning: {
        container: 'bg-yellow-50 border-yellow-200 text-yellow-900',
        icon: 'text-yellow-600',
        defaultIcon: AlertTriangle,
      },
      danger: {
        container: 'bg-red-50 border-red-200 text-red-900',
        icon: 'text-red-600',
        defaultIcon: AlertCircle,
      },
    };

    const styles = variantStyles[variant];
    const DefaultIcon = styles.defaultIcon;

    const handleDismiss = () => {
      setIsDismissed(true);
      onDismiss?.();
    };

    if (isDismissed) return null;

    return (
      <div
        ref={ref}
        role="alert"
        className={clsx(
          'flex gap-3 p-4 border rounded-lg',
          styles.container,
          className
        )}
        {...props}
      >
        {!hideIcon && (
          <div className={clsx('flex-shrink-0', styles.icon)}>
            {icon || <DefaultIcon className="h-5 w-5" />}
          </div>
        )}

        <div className="flex-1">
          {title && (
            <h4 className="font-semibold mb-1">
              {title}
            </h4>
          )}
          <div className="text-sm">{children}</div>
        </div>

        {dismissible && (
          <button
            onClick={handleDismiss}
            className={clsx(
              'flex-shrink-0 rounded-md p-1 hover:bg-black/5 transition-colors',
              styles.icon
            )}
            aria-label="Dismiss alert"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);

Alert.displayName = 'Alert';
