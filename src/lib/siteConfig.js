// File: src/lib/siteConfig.js
import { parsePhoneNumberFromString } from "libphonenumber-js";
const env = import.meta.env;

function readEnv(key, fallback) {
  const value = env[key];
  return typeof value === "string" && value.trim() !== "" ? value.trim() : fallback;
}

function toTelHref(value) {
  const parsed = parsePhoneNumberFromString(String(value || ""));
  if (parsed?.number) return parsed.number;
  const digits = String(value || "").replace(/[^\d+]/g, "");
  return digits.startsWith("+") ? digits : `+${digits}`;
}

const companyName = readEnv("VITE_COMPANY_NAME", "TaxProConsult");
const companyPhone = readEnv("VITE_COMPANY_PHONE", "+255 (0) 800 000 000");

export const siteConfig = {
  companyName,
  companyEmail: readEnv("VITE_COMPANY_EMAIL", "info@taxproconsult.co.tz"),
  companyPhone,
  companyPhoneHref: toTelHref(companyPhone),
  companyAddress: readEnv("VITE_COMPANY_ADDRESS", "Dar es Salaam, Tanzania"),
  footerDescription: readEnv(
    "VITE_COMPANY_FOOTER_DESCRIPTION",
    "Practical tax advisory, documentation, and compliance support for growing businesses and individuals."
  ),
  adminDefaultEmail: readEnv("VITE_ADMIN_DEFAULT_EMAIL", "admin@taxproconsult.co.tz"),
  copyrightText: readEnv(
    "VITE_COMPANY_COPYRIGHT_TEXT",
    `© ${new Date().getFullYear()} ${companyName}. All rights reserved.`
  ),
};
