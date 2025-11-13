import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { Check, ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /**
   * Available options
   */
  options: SelectOption[];
  /**
   * Selected value
   */
  value?: string;
  /**
   * Callback when value changes
   */
  onChange?: (value: string) => void;
  /**
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Label for the select
   */
  label?: string;
  /**
   * Error message
   */
  error?: string;
  /**
   * Is the select disabled?
   */
  disabled?: boolean;
  /**
   * Size of the select
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Full width?
   */
  fullWidth?: boolean;
}

/**
 * Select dropdown component
 */
export const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      options,
      value,
      onChange,
      placeholder = 'Select an option',
      label,
      error,
      disabled = false,
      size = 'md',
      fullWidth = false,
      className,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const selectRef = useRef<HTMLDivElement>(null);
    const optionsRef = useRef<(HTMLDivElement | null)[]>([]);

    const selectedOption = options.find((opt) => opt.value === value);

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-5 py-3 text-lg',
    };

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isOpen]);

    // Scroll focused option into view
    useEffect(() => {
      if (focusedIndex >= 0 && optionsRef.current[focusedIndex]) {
        optionsRef.current[focusedIndex]?.scrollIntoView({
          block: 'nearest',
        });
      }
    }, [focusedIndex]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;

      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else if (focusedIndex >= 0) {
            const option = options[focusedIndex];
            if (!option.disabled) {
              onChange?.(option.value);
              setIsOpen(false);
            }
          }
          break;

        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          break;

        case 'ArrowDown':
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            const nextIndex = focusedIndex < options.length - 1 ? focusedIndex + 1 : 0;
            setFocusedIndex(nextIndex);
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            const prevIndex = focusedIndex > 0 ? focusedIndex - 1 : options.length - 1;
            setFocusedIndex(prevIndex);
          }
          break;

        case 'Home':
          e.preventDefault();
          setFocusedIndex(0);
          break;

        case 'End':
          e.preventDefault();
          setFocusedIndex(options.length - 1);
          break;
      }
    };

    const handleSelect = (optionValue: string) => {
      onChange?.(optionValue);
      setIsOpen(false);
    };

    return (
      <div
        ref={ref}
        className={clsx('relative', fullWidth ? 'w-full' : 'w-auto', className)}
        {...props}
      >
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}

        <div ref={selectRef}>
          {/* Select Button */}
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className={clsx(
              'flex items-center justify-between w-full border rounded-md shadow-sm transition-colors',
              sizeStyles[size],
              error
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500',
              disabled
                ? 'bg-gray-100 cursor-not-allowed opacity-60'
                : 'bg-white hover:border-gray-400',
              'focus:outline-none focus:ring-2'
            )}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
          >
            <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <ChevronDown
              className={clsx(
                'ml-2 h-4 w-4 text-gray-400 transition-transform',
                isOpen && 'transform rotate-180'
              )}
            />
          </button>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              <div role="listbox">
                {options.map((option, index) => {
                  const isSelected = value === option.value;
                  const isFocused = focusedIndex === index;

                  return (
                    <div
                      key={option.value}
                      ref={(el) => (optionsRef.current[index] = el)}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => !option.disabled && handleSelect(option.value)}
                      onMouseEnter={() => setFocusedIndex(index)}
                      className={clsx(
                        'flex items-center justify-between px-4 py-2 cursor-pointer',
                        option.disabled
                          ? 'text-gray-400 cursor-not-allowed'
                          : isFocused
                          ? 'bg-blue-50 text-blue-900'
                          : 'text-gray-900 hover:bg-gray-50'
                      )}
                    >
                      <span>{option.label}</span>
                      {isSelected && (
                        <Check className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
