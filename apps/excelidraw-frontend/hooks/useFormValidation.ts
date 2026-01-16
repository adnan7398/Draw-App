import { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';

interface ValidationState {
  isValid: boolean;
  errors: Record<string, string[]>;
  touched: Record<string, boolean>;
}

interface UseFormValidationProps<T> {
  schema: z.ZodObject<any> | z.ZodSchema<T>;
  initialValues: T;
  onSubmit: (values: T) => Promise<void>;
}

export function useFormValidation<T extends Record<string, any>>({
  schema,
  initialValues,
  onSubmit
}: UseFormValidationProps<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [validation, setValidation] = useState<ValidationState>({
    isValid: false,
    errors: {},
    touched: {}
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Real-time validation
  const validateField = useCallback((fieldName: string, value: any) => {
    try {
      // Validate the entire form with the updated field value
      const testValues = { ...values, [fieldName]: value };
      schema.parse(testValues);
      
      // Clear error for this field
      setValidation(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          [fieldName]: []
        }
      }));
      
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.errors
          .filter(err => {
            const path = err.path.join('.');
            return path === fieldName || path.startsWith(fieldName + '.');
          })
          .map(err => err.message);
        
        setValidation(prev => ({
          ...prev,
          errors: {
            ...prev.errors,
            [fieldName]: fieldErrors
          }
        }));
      }
      return false;
    }
  }, [schema, values]);

  // Validate entire form
  const validateForm = useCallback(() => {
    try {
      schema.parse(values);
      setValidation(prev => ({
        ...prev,
        isValid: true,
        errors: {}
      }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string[]> = {};
        
        error.errors.forEach((err) => {
          const field = err.path.join('.');
          if (!errors[field]) {
            errors[field] = [];
          }
          errors[field].push(err.message);
        });

        setValidation(prev => ({
          ...prev,
          isValid: false,
          errors
        }));
      }
      return false;
    }
  }, [schema, values]);

  // Validate form whenever values change
  useEffect(() => {
    validateForm();
  }, [validateForm]);

  // Handle field changes with real-time validation
  const handleChange = useCallback((fieldName: string, value: any) => {
    setValues(prev => ({ ...prev, [fieldName]: value }));
    setSubmitError(null);
    
    // Mark field as touched
    setValidation(prev => ({
      ...prev,
      touched: {
        ...prev.touched,
        [fieldName]: true
      }
    }));

    // Validate field if it's been touched
    if (validation.touched[fieldName]) {
      validateField(fieldName, value);
    }
  }, [validateField, validation.touched]);

  // Handle field blur
  const handleBlur = useCallback((fieldName: string) => {
    setValidation(prev => ({
      ...prev,
      touched: {
        ...prev.touched,
        [fieldName]: true
      }
    }));
    
    validateField(fieldName, values[fieldName]);
  }, [validateField, values]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    
    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    
    setValidation(prev => ({
      ...prev,
      touched: allTouched
    }));

    // Validate entire form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit(values);
    } catch (error: any) {
      setSubmitError(error.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validateForm, onSubmit]);

  // Reset form
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setValidation({
      isValid: false,
      errors: {},
      touched: {}
    });
    setSubmitError(null);
    setIsSubmitting(false);
  }, [initialValues]);

  // Get field error
  const getFieldError = useCallback((fieldName: string): string | null => {
    const errors = validation.errors[fieldName];
    const isTouched = validation.touched[fieldName];
    
    if (isTouched && errors && errors.length > 0) {
      return errors[0];
    }
    
    return null;
  }, [validation]);

  // Check if field is valid
  const isFieldValid = useCallback((fieldName: string): boolean => {
    const error = getFieldError(fieldName);
    const isTouched = validation.touched[fieldName];
    
    return isTouched && !error;
  }, [getFieldError, validation.touched]);

  // Check if field has error
  const hasFieldError = useCallback((fieldName: string): boolean => {
    return !!getFieldError(fieldName);
  }, [getFieldError]);

  return {
    values,
    validation,
    isSubmitting,
    submitError,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    getFieldError,
    isFieldValid,
    hasFieldError,
    validateForm
  };
}
