import { z } from "zod";

// Enhanced email validation with better regex
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Enhanced password validation with more secure requirements
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const CreateUserSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .max(100, "Email must be less than 100 characters")
    .email("Please enter a valid email address")
    .regex(emailRegex, "Please enter a valid email format")
    .transform((email) => email.toLowerCase().trim()),
  
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces")
    .transform((name) => name.trim()),
  
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be less than 128 characters")
    .regex(passwordRegex, {
      message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)"
    })
    .refine((password) => {
      // Additional security checks - less restrictive
      const hasConsecutiveChars = /(.)\1{3,}/.test(password); // Only flag 4+ consecutive chars
      const hasCommonPatterns = /(password|admin|123456|qwerty)/i.test(password); // Only flag very common patterns
      return !hasConsecutiveChars && !hasCommonPatterns;
    }, {
      message: "Password cannot contain 4+ consecutive characters or very common patterns like 'password', 'admin', '123456', 'qwerty'"
    })
});

export const SigninSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .max(100, "Email must be less than 100 characters")
    .email("Please enter a valid email address")
    .transform((email) => email.toLowerCase().trim()),
  
  password: z
    .string()
    .min(1, "Password is required")
    .max(128, "Password must be less than 128 characters")
});

export const CreateRoomSchema = z.object({
  name: z
    .string()
    .min(3, "Room name must be at least 3 characters")
    .max(50, "Room name must be less than 50 characters")
    .regex(/^[a-zA-Z0-9\s-_]+$/, "Room name can only contain letters, numbers, spaces, hyphens, and underscores")
    .transform((name) => name.trim()),
  isPrivate: z.boolean().default(false),
  password: z
    .string()
    .min(4, "Password must be at least 4 characters")
    .max(50, "Password must be less than 50 characters")
    .optional()
    .refine((password, ctx) => {
      if (ctx.parent?.isPrivate && !password) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Password is required for private rooms"
        });
        return false;
      }
      return true;
    })
});

// Response types for better error handling
export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  userId?: string;
  errors?: Record<string, string[]>;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Enhanced error messages
export const AUTH_ERROR_MESSAGES = {
  EMAIL_ALREADY_EXISTS: "An account with this email already exists",
  INVALID_CREDENTIALS: "Invalid email or password",
  USER_NOT_FOUND: "No account found with this email",
  ACCOUNT_LOCKED: "Account temporarily locked due to too many failed attempts",
  EMAIL_NOT_VERIFIED: "Please verify your email address before signing in",
  WEAK_PASSWORD: "Password is too weak. Please choose a stronger password",
  INVALID_EMAIL_FORMAT: "Please enter a valid email address",
  NAME_TOO_SHORT: "Name must be at least 2 characters long",
  NAME_TOO_LONG: "Name must be less than 50 characters",
  PASSWORD_TOO_SHORT: "Password must be at least 8 characters long",
  PASSWORD_TOO_LONG: "Password must be less than 128 characters",
  PASSWORD_MISSING_UPPERCASE: "Password must contain at least one uppercase letter",
  PASSWORD_MISSING_LOWERCASE: "Password must contain at least one lowercase letter",
  PASSWORD_MISSING_NUMBER: "Password must contain at least one number",
  PASSWORD_MISSING_SPECIAL: "Password must contain at least one special character",
  NETWORK_ERROR: "Network error. Please check your connection and try again",
  SERVER_ERROR: "Server error. Please try again later",
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again"
} as const;