"use client";

import React, { useEffect } from "react";
import { PenTool, Mail, Lock, AlertCircle, CheckCircle } from "lucide-react";
import { getBackendUrl } from "@/config";
import { useRouter, useSearchParams } from "next/navigation";
import { useFormValidation } from '@/hooks/useFormValidation';
import { ValidatedInput } from '@/component/ValidatedInput';
import { SigninSchema } from '@repo/common/types';
import axios from "axios";

interface SigninForm {
  email: string;
  password: string;
}

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const successMessage = searchParams.get('message');

  const handleSignin = async (values: SigninForm) => {
    try {
      const response = await axios.post(`${getBackendUrl()}/signin`, values);
      
      if (response.data.success) {
        const token = response.data.token;
        
        if (!token) {
          throw new Error("Token not received from server.");
        }
        
        localStorage.setItem("authToken", token);
        router.push('/room');
      } else {
        throw new Error(response.data.message || 'Signin failed');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.data?.errors) {
        // Handle validation errors from server
        const errorMessages = Object.values(error.response.data.errors).flat();
        throw new Error(errorMessages.join(', '));
      } else {
        throw new Error(error.message || 'Network error. Please try again.');
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
    isFieldValid,
    hasFieldError
  } = useFormValidation({
    schema: SigninSchema,
    initialValues: {
      email: '',
      password: ''
    },
    onSubmit: handleSignin
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
          Sign in to DrawApp
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{" "}
          <a 
            href="/signup" 
            className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
          >
            create a new account
          </a>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-2xl sm:px-10 border border-gray-100">
          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                <p className="text-sm text-green-600">{successMessage}</p>
              </div>
            </div>
          )}

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
              placeholder="Enter your password"
              value={values.password}
              onChange={(value) => handleChange('password', value)}
              onBlur={() => handleBlur('password')}
              error={getFieldError('password')}
              isValid={isFieldValid('password')}
              required
              autoComplete="current-password"
              icon={<Lock className="h-5 w-5" />}
              showPasswordToggle
            />

            {/* Forgot Password Link */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot your password?
                </a>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`
                w-full flex justify-center py-3 px-4 border border-transparent rounded-lg
                text-sm font-medium text-white transition-all duration-200
                ${isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }
              `}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Social Sign-in Options */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="ml-2">Google</span>
              </button>

              <button
                type="button"
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
                <span className="ml-2">Twitter</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
