import React, { forwardRef } from 'react';
import { CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';

interface ValidatedInputProps {
  id: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'url';
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string | null;
  isValid?: boolean;
  required?: boolean;
  autoComplete?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  showPasswordToggle?: boolean;
  className?: string;
}

export const ValidatedInput = forwardRef<HTMLInputElement, ValidatedInputProps>(
  ({
    id,
    name,
    type = 'text',
    label,
    placeholder,
    value,
    onChange,
    onBlur,
    error,
    isValid,
    required = false,
    autoComplete,
    disabled = false,
    icon,
    showPasswordToggle = false,
    className = ''
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);

    const inputType = type === 'password' && showPassword ? 'text' : type;

    const getBorderColor = () => {
      if (error) return 'border-red-500 focus:border-red-500 focus:ring-red-500';
      if (isValid) return 'border-green-500 focus:border-green-500 focus:ring-green-500';
      if (isFocused) return 'border-blue-500 focus:border-blue-500 focus:ring-blue-500';
      return 'border-gray-300 focus:border-blue-500 focus:ring-blue-500';
    };

    const getBackgroundColor = () => {
      if (error) return 'bg-red-50';
      if (isValid) return 'bg-green-50';
      return 'bg-white';
    };

    return (
      <div className={`space-y-1 ${className}`}>
        <label 
          htmlFor={id} 
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        <div className="relative">
          {/* Icon on the left */}
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="h-5 w-5 text-gray-400">
                {icon}
              </div>
            </div>
          )}
          
          <input
            ref={ref}
            id={id}
            name={name}
            type={inputType}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => {
              setIsFocused(false);
              onBlur?.();
            }}
            onFocus={() => setIsFocused(true)}
            placeholder={placeholder}
            required={required}
            autoComplete={autoComplete}
            disabled={disabled}
            className={`
              block w-full px-3 py-2.5 rounded-lg border transition-all duration-200
              ${icon ? 'pl-10' : 'pl-3'}
              ${showPasswordToggle ? 'pr-12' : 'pr-3'}
              ${getBorderColor()}
              ${getBackgroundColor()}
              placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-opacity-50
              disabled:bg-gray-100 disabled:cursor-not-allowed
              text-sm leading-5
            `}
          />
          
          {/* Password toggle button */}
          {showPasswordToggle && type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          )}
          
          {/* Validation icons */}
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {error && (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            {isValid && !error && (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
          </div>
        </div>
        
        {/* Error message */}
        {error && (
          <p className="text-sm text-red-600 animate-fadeIn">
            {error}
          </p>
        )}
        
        {/* Success message */}
        {isValid && !error && (
          <p className="text-sm text-green-600 animate-fadeIn">
            Looks good!
          </p>
        )}
      </div>
    );
  }
);

ValidatedInput.displayName = 'ValidatedInput';
