"use client"

import React from 'react';
import { PenTool, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';
import { getBackendUrl } from '@/config';
import { useRouter } from 'next/navigation';
import { useFormValidation } from '@/hooks/useFormValidation';
import { ValidatedInput } from '@/component/ValidatedInput';
import { CreateUserSchema } from '@repo/common/types';
import axios from 'axios';

interface SignupForm {
  name: string;
  email: string;
  password: string;
}

export default function SignupPage() {
  const router = useRouter();

  const handleSignup = async (values: SignupForm) => {
    try {
      const response = await axios.post(`${getBackendUrl()}/signup`, values);
      
      if (response.data.success) {
        // Store token if provided
        if (response.data.token) {
          localStorage.setItem("authToken", response.data.token);
        }
        
        // Show success message and redirect
        router.push('/signin?message=Account created successfully! Please sign in.');
      } else {
        throw new Error(response.data.message || 'Signup failed');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } }; message?: string };
      if (err.response?.data?.message) {
        throw new Error(err.response.data.message);
      } else if (err.response?.data?.errors) {
        // Handle validation errors from server
        const errorMessages = Object.values(err.response.data.errors).flat();
        throw new Error(errorMessages.join(', '));
      } else {
        throw new Error(err.message || 'Network error. Please try again.');
      }
    }
  };

  const {
    values,
    validation,
    isSubmitting,
    submitError,
    handleChange,
    handleBlur,
    handleSubmit,
    getFieldError,
    isFieldValid
  } = useFormValidation({
    schema: CreateUserSchema,
    initialValues: {
      name: '',
      email: '',
      password: ''
    },
    onSubmit: handleSignup
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
            <PenTool className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <a 
            href="/signin" 
            className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
          >
            Sign in
          </a>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-2xl sm:px-10 border border-gray-100">
          {/* Submit Error */}
          {submitError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-sm text-red-600">{submitError}</p>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Name Field */}
            <ValidatedInput
              id="name"
              name="name"
              type="text"
              label="Full Name"
              placeholder="Enter your full name"
              value={values.name}
              onChange={(value) => handleChange('name', value)}
              onBlur={() => handleBlur('name')}
              error={getFieldError('name')}
              isValid={isFieldValid('name')}
              required
              autoComplete="name"
              icon={<User className="h-5 w-5" />}
            />

            {/* Email Field */}
            <ValidatedInput
              id="email"
              name="email"
              type="email"
              label="Email Address"
              placeholder="you@example.com"
              value={values.email}
              onChange={(value) => handleChange('email', value)}
              onBlur={() => handleBlur('email')}
              error={getFieldError('email')}
              isValid={isFieldValid('email')}
              required
              autoComplete="email"
              icon={<Mail className="h-5 w-5" />}
            />

            {/* Password Field */}
            <ValidatedInput
              id="password"
              name="password"
              type="password"
              label="Password"
              placeholder="Create a strong password"
              value={values.password}
              onChange={(value) => handleChange('password', value)}
              onBlur={() => handleBlur('password')}
              error={getFieldError('password')}
              isValid={isFieldValid('password')}
              required
              autoComplete="new-password"
              icon={<Lock className="h-5 w-5" />}
              showPasswordToggle
            />

            {/* Password Requirements */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li className={`flex items-center ${values.password.length >= 8 ? 'text-green-600' : ''}`}>
                  {values.password.length >= 8 ? <CheckCircle className="h-3 w-3 mr-1" /> : '•'} At least 8 characters
                </li>
                <li className={`flex items-center ${/[A-Z]/.test(values.password) ? 'text-green-600' : ''}`}>
                  {/[A-Z]/.test(values.password) ? <CheckCircle className="h-3 w-3 mr-1" /> : '•'} One uppercase letter
                </li>
                <li className={`flex items-center ${/[a-z]/.test(values.password) ? 'text-green-600' : ''}`}>
                  {/[a-z]/.test(values.password) ? <CheckCircle className="h-3 w-3 mr-1" /> : '•'} One lowercase letter
                </li>
                <li className={`flex items-center ${/\d/.test(values.password) ? 'text-green-600' : ''}`}>
                  {/\d/.test(values.password) ? <CheckCircle className="h-3 w-3 mr-1" /> : '•'} One number
                </li>
                <li className={`flex items-center ${/[@$!%*?&]/.test(values.password) ? 'text-green-600' : ''}`}>
                  {/[@$!%*?&]/.test(values.password) ? <CheckCircle className="h-3 w-3 mr-1" /> : '•'} One special character (@$!%*?&)
                </li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !validation.isValid}
              className={`
                w-full flex justify-center py-3 px-4 border border-transparent rounded-lg
                text-sm font-medium text-white transition-all duration-200
                ${isSubmitting || !validation.isValid
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }
              `}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Terms and Privacy */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              By creating an account, you agree to our{' '}
              <a href="#" className="text-blue-600 hover:text-blue-500">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-blue-600 hover:text-blue-500">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}