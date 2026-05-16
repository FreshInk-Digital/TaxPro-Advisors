// File: src/lib/schemas.js
// Zod validation schemas for all forms in TaxProConsult

import { z } from "zod";

// --------------------------------------------------------------------------
// Auth Schemas
// --------------------------------------------------------------------------
export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Please enter a valid email address"),
  password: z
    .string({ required_error: "Password is required" })
    .min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  firstName: z
    .string({ required_error: "First name is required" })
    .min(2, "First name must be at least 2 characters"),
  lastName: z
    .string({ required_error: "Last name is required" })
    .min(2, "Last name must be at least 2 characters"),
  email: z
    .string({ required_error: "Email is required" })
    .email("Please enter a valid email address"),
  phoneNumber: z
    .string({ required_error: "Phone number is required" })
    .regex(/^255\d{9}$/, "Phone number must start with 255 followed by 9 digits"),
  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters"),
  role: z.enum(["user", "admin"]).default("user"),
});

export const sendOtpSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Please enter a valid email address"),
});

export const verifyOtpSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Please enter a valid email address"),
  otp: z
    .string({ required_error: "OTP is required" })
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only digits"),
});

export const resetPasswordSchema = z
  .object({
    email: z
      .string({ required_error: "Email is required" })
      .email("Please enter a valid email address"),
    newPassword: z
      .string({ required_error: "New password is required" })
      .min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string({ required_error: "Please confirm your password" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// --------------------------------------------------------------------------
// Service Request (Public) Schema
// --------------------------------------------------------------------------
export const serviceRequestSchema = z.object({
  serviceId: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .refine((v) => !isNaN(v) && v > 0, "Please select a service"),
  fullName: z
    .string({ required_error: "Full name is required" })
    .min(3, "Full name must be at least 3 characters"),
  email: z
    .string({ required_error: "Email is required" })
    .email("Please enter a valid email address"),
  phone: z
    .string({ required_error: "Phone number is required" })
    .regex(/^255\d{9}$/, "Phone must start with 255 followed by 9 digits"),
  message: z
    .string({ required_error: "Message is required" })
    .min(10, "Message must be at least 10 characters"),
  locale: z.enum(["en", "sw"]).default("en"),
});

// --------------------------------------------------------------------------
// Language Schema
// --------------------------------------------------------------------------
export const languageSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .min(2, "Name must be at least 2 characters"),
  code: z
    .string({ required_error: "Code is required" })
    .min(2, "Code must be at least 2 characters (e.g. en, sw)"),
  nativeName: z
    .string({ required_error: "Native name is required" })
    .min(2, "Native name must be at least 2 characters"),
  flag: z.string().optional().or(z.literal("")),
});

// --------------------------------------------------------------------------
// Translation item shared
// --------------------------------------------------------------------------
const translationBaseSchema = z.object({
  languageId: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .refine((v) => !isNaN(v) && v > 0, "Language is required"),
});

// --------------------------------------------------------------------------
// Service Schema (multi-language)
// --------------------------------------------------------------------------
const serviceTranslationSchema = translationBaseSchema.extend({
  title: z
    .string({ required_error: "Title is required" })
    .min(2, "Title must be at least 2 characters"),
  description: z
    .string({ required_error: "Description is required" })
    .min(10, "Description must be at least 10 characters"),
  offers: z
    .array(z.string().trim().min(1, "Offer is required"))
    .min(1, "At least one offer is required"),
});

export const serviceSchema = z
  .object({
    status: z.enum(["active", "notActive"]).default("active"),
    translations: z
      .array(serviceTranslationSchema)
      .min(1, "At least one translation is required"),
  })
  .superRefine((data, ctx) => {
    const offerCount = data.translations[0]?.offers?.length || 0;

    data.translations.forEach((translation, index) => {
      if ((translation.offers?.length || 0) !== offerCount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["translations", index, "offers"],
          message: "Every language must have the same number of translated offers",
        });
      }
    });
  });

// --------------------------------------------------------------------------
// Document Type Schema (multi-language)
// --------------------------------------------------------------------------
const docTypeTranslationSchema = translationBaseSchema.extend({
  name: z
    .string({ required_error: "Name is required" })
    .min(2, "Name must be at least 2 characters"),
});

export const documentTypeSchema = z.object({
  status: z.enum(["active", "notActive"]).default("active"),
  translations: z
    .array(docTypeTranslationSchema)
    .min(1, "At least one translation is required"),
});

// --------------------------------------------------------------------------
// Document Schema (multi-language + file upload)
// --------------------------------------------------------------------------
const documentTranslationSchema = translationBaseSchema.extend({
  title: z
    .string({ required_error: "Title is required" })
    .min(2, "Title must be at least 2 characters"),
  description: z
    .string({ required_error: "Description is required" })
    .min(5, "Description must be at least 5 characters"),
});

export const documentSchema = z.object({
  documentTypeId: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .refine((v) => !isNaN(v) && v > 0, "Document type is required"),
  status: z.enum(["active", "notActive"]).default("active"),
  custom_file_name: z.string().optional(),
  translations: z
    .array(documentTranslationSchema)
    .min(1, "At least one translation is required"),
});

// --------------------------------------------------------------------------
// Poster Schema (multi-language + image upload)
// --------------------------------------------------------------------------
const posterTranslationSchema = translationBaseSchema.extend({
  title: z
    .string({ required_error: "Title is required" })
    .min(2, "Title must be at least 2 characters"),
  description: z
    .string({ required_error: "Description is required" })
    .min(5, "Description must be at least 5 characters"),
});

export const posterSchema = z.object({
  status: z.enum(["active", "notActive"]).default("active"),
  custom_file_name: z.string().optional(),
  translations: z
    .array(posterTranslationSchema)
    .min(1, "At least one translation is required"),
});

// --------------------------------------------------------------------------
// User Schema
// --------------------------------------------------------------------------
export const userSchema = z.object({
  firstName: z
    .string({ required_error: "First name is required" })
    .min(2, "First name must be at least 2 characters"),
  lastName: z
    .string({ required_error: "Last name is required" })
    .min(2, "Last name must be at least 2 characters"),
  email: z
    .string({ required_error: "Email is required" })
    .email("Please enter a valid email address"),
  phoneNumber: z
    .string({ required_error: "Phone number is required" })
    .regex(/^\d{10,15}$/, "Phone must be 10-15 digits (including country code)"),
  role: z.enum(["user", "admin"]).default("user"),
});

export const changePasswordSchema = z
  .object({
    oldPassword: z
      .string({ required_error: "Current password is required" })
      .min(6, "Password must be at least 6 characters"),
    newPassword: z
      .string({ required_error: "New password is required" })
      .min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string({ required_error: "Please confirm your new password" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
