// File: src/lib/api.js
// TaxProConsult API Client — Base URL: https://taxproconsult.co.tz/api/v1/
// Accept-Language is passed on ALL GET calls so the server returns
// already-localized data in the current user locale (en | sw | zh).

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(/\/+$/, "");


// --------------------------------------------------------------------------
// Token helpers (session-scoped)
// --------------------------------------------------------------------------
export function getToken() {
  return sessionStorage.getItem("adminToken") || null;
}
export function setToken(token) {
  sessionStorage.setItem("adminToken", token);
}
export function clearToken() {
  sessionStorage.removeItem("adminToken");
  sessionStorage.removeItem("adminAuth");
}

// --------------------------------------------------------------------------
// Active locale helper — read current locale stored by LanguageContext
// --------------------------------------------------------------------------
export function getLocale() {
  return localStorage.getItem("app_locale") || "en";
}

// --------------------------------------------------------------------------
// Core fetch wrapper
// All GET requests automatically carry Accept-Language: <current_locale>
// --------------------------------------------------------------------------
async function apiFetch(path, options = {}) {
  const { method = "GET", body, isFormData = false, locale } = options;

  const token = getToken();
  // Use explicit locale arg, or fall back to the globally active one
  const activeLocale = locale || getLocale();

  const headers = {};

  if (token) headers["Authorization"] = `Bearer ${token}`;

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
    headers["Accept"] = "application/json";
  }

  // Always set Accept-Language so server localizes its response
  headers["Accept-Language"] = activeLocale;

  const cleanPath = path.replace(/^\/+/, "");
  const url = `${BASE_URL}/${cleanPath}`;

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
      mode: "cors", // Explicitly set CORS mode
    });

    const contentType = res.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await res.json()
      : await res.text();

    if (!res.ok) {
      // Handle Laravel validation errors or other non-200 responses
      const message =
        typeof data === "object"
          ? data?.message || `Error ${res.status}: ${res.statusText}`
          : `Error ${res.status}: ${res.statusText}`;
      
      const error = new Error(message);
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.name === "TypeError" && error.message === "Failed to fetch") {
      console.error("[API Network Error] Possible CORS issue or server is down:", url);
      throw new Error("Unable to connect to the server. Please check your internet or CORS settings.");
    }
    console.error(`[API Error] ${method} ${path}:`, error);
    throw error;
  }
}


// --------------------------------------------------------------------------
// 1. AUTHENTICATION
// --------------------------------------------------------------------------
export const authApi = {
  login: (email, password) =>
    apiFetch("/login", { method: "POST", body: { email, password } }),

  register: (payload) =>
    apiFetch("/register", { method: "POST", body: payload }),

  sendOtp: (email) =>
    apiFetch("/send-otp", { method: "POST", body: { email } }),

  verifyOtp: (email, otp) =>
    apiFetch("/verify-otp", { method: "POST", body: { email, otp } }),

  resetPassword: (email, newPassword) =>
    apiFetch("/reset-password", { method: "POST", body: { email, newPassword } }),

  logout: () => apiFetch("/logout", { method: "POST" }),
};

// --------------------------------------------------------------------------
// 2. PUBLIC SERVICE REQUESTS
// --------------------------------------------------------------------------
export const publicApi = {
  submitServiceRequest: (payload) =>
    apiFetch("/service-requests", { method: "POST", body: payload }),
};

// --------------------------------------------------------------------------
// 3. LANGUAGES (Protected)
// --------------------------------------------------------------------------
export const languagesApi = {
  /** GET /languages — Accept-Language auto-injected */
  list: (locale) => apiFetch("/languages", { locale }),

  create: (payload) =>
    apiFetch("/languages", { method: "POST", body: payload }),

  update: (id, payload) =>
    apiFetch(`/languages/${id}`, { method: "PUT", body: payload }),

  delete: (id) => apiFetch(`/languages/${id}`, { method: "DELETE" }),
};

// --------------------------------------------------------------------------
// 4. SERVICES (Protected, Multi-Language)
// --------------------------------------------------------------------------
export const servicesApi = {
  /** GET /services — Accept-Language auto-injected */
  list: (locale) => apiFetch("/services", { locale }),

  create: (payload) =>
    apiFetch("/services", { method: "POST", body: payload }),

  update: (id, payload) =>
    apiFetch(`/services/${id}`, { method: "PUT", body: payload }),

  delete: (id) => apiFetch(`/services/${id}`, { method: "DELETE" }),
};

// --------------------------------------------------------------------------
// 5. DOCUMENT TYPES (Protected, Multi-Language)
// --------------------------------------------------------------------------
export const documentTypesApi = {
  /** GET /document-types — Accept-Language auto-injected */
  list: (locale) => apiFetch("/document-types", { locale }),

  create: (payload) =>
    apiFetch("/document-types", { method: "POST", body: payload }),

  bulkCreate: (documentTypes) =>
    apiFetch("/document-types/bulk", { method: "POST", body: { documentTypes } }),

  update: (id, payload) =>
    apiFetch(`/document-types/${id}`, { method: "PUT", body: payload }),

  delete: (id) => apiFetch(`/document-types/${id}`, { method: "DELETE" }),
};

// --------------------------------------------------------------------------
// 6. DOCUMENTS (Protected, Multi-Language, multipart/form-data)
// --------------------------------------------------------------------------
export const documentsApi = {
  /** GET /documents — Accept-Language auto-injected */
  list: (locale) => apiFetch("/documents", { locale }),

  create: (formData) =>
    apiFetch("/documents", { method: "POST", body: formData, isFormData: true }),

  /**
   * Laravel cannot parse multipart PUT — send as POST with _method:"PUT"
   */
  update: (id, formData) => {
    formData.append("_method", "PUT");
    return apiFetch(`/documents/${id}`, {
      method: "POST",
      body: formData,
      isFormData: true,
    });
  },

  delete: (id) => apiFetch(`/documents/${id}`, { method: "DELETE" }),
};

// --------------------------------------------------------------------------
// 7. POSTERS (Protected, Multi-Language, multipart/form-data)
// --------------------------------------------------------------------------
export const postersApi = {
  /** GET /posters — Accept-Language auto-injected */
  list: (locale) => apiFetch("/posters", { locale }),

  create: (formData) =>
    apiFetch("/posters", { method: "POST", body: formData, isFormData: true }),

  /**
   * Laravel cannot parse multipart PUT — send as POST with _method:"PUT"
   */
  update: (id, formData) => {
    formData.append("_method", "PUT");
    return apiFetch(`/posters/${id}`, {
      method: "POST",
      body: formData,
      isFormData: true,
    });
  },

  delete: (id) => apiFetch(`/posters/${id}`, { method: "DELETE" }),
};

// --------------------------------------------------------------------------
// 8. USERS (Admin)
// --------------------------------------------------------------------------
export const usersApi = {
  list: () => apiFetch("/users"),

  create: (payload) =>
    apiFetch("/users", { method: "POST", body: payload }),

  update: (id, payload) =>
    apiFetch(`/users/${id}`, { method: "PUT", body: payload }),

  delete: (id) => apiFetch(`/users/${id}`, { method: "DELETE" }),

  changePassword: (id, oldPassword, newPassword) =>
    apiFetch(`/users/${id}/change-password`, {
      method: "PUT",
      body: { oldPassword, newPassword },
    }),
};

// --------------------------------------------------------------------------
// 9. SERVICE REQUESTS (Admin View)
// --------------------------------------------------------------------------
export const serviceRequestsApi = {
  list: () => apiFetch("/service-requests"),
};
