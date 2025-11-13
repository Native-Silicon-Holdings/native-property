import React from 'react';
import { clsx } from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * Label for the input
   */
  label?: string;
  /**
   * Error message to display
   */
  error?: string;
  /**
   * Help text to display below the input
   */
  helpText?: string;
  /**
   * Is the input in an error state?
   */
  hasError?: boolean;
  /**
   * Size of the input
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Should the input take full width?
   */
  fullWidth?: boolean;
}

/**
 * Input component for forms
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helpText,
      hasError = false,
      size = 'md',
      fullWidth = false,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const showError = hasError || !!error;

    const baseStyles = 'block border rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors';

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-5 py-3 text-lg',
    };

    const stateStyles = showError
      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500';

    return (
      <div className={clsx('flex flex-col', fullWidth ? 'w-full' : 'w-auto')}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          className={clsx(
            baseStyles,
            sizeStyles[size],
            stateStyles,
            fullWidth && 'w-full',
            props.disabled && 'bg-gray-100 cursor-not-allowed opacity-60',
            className
          )}
          aria-invalid={showError}
          aria-describedby={
            error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined
          }
          {...props}
        />

        {error && (
          <p className="mt-1 text-sm text-red-600" id={`${inputId}-error`}>
            {error}
          </p>
        )}

        {helpText && !error && (
          <p className="mt-1 text-sm text-gray-500" id={`${inputId}-help`}>
            {helpText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
