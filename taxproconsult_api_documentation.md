# TaxProConsult API Documentation

This document outlines the available endpoints, request structures, and response formats for the **TaxProConsult Backend API**, specifically focusing on the Multi-Language Support flow.

## Base URL
All API requests should be prefixed with: `https://taxproconsult.co.tz/api/v1/`

## Standard Response Formats

The API uses standardized DTOs for responses. 

**Success Response (20X):**
```json
{
  "success": true,
  "message": "Success message string",
  "data": { } // Object, Array, or null depending on the endpoint
}
```

**Error Response (40X, 50X):**
```json
{
  "success": false,
  "message": "Error description string"
}
```

---

## 1. Authentication (Public Routes)

### 1.1 Login
- **Endpoint:** `POST /login`
- **Description:** Authenticates a user and returns a Sanctum access token.
- **Request Body:**
```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```
- **Response `data`:**
```json
{
  "user": { /* User Object */ },
  "token": "1|abc123xyz..."
}
```

### 1.2 Register
- **Endpoint:** `POST /register`
- **Description:** Registers a new user.
- **Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phoneNumber": "255712345678",
  "password": "securepassword",
  "role": "USER" // Enum: USER, ADMIN, etc.
}
```

### 1.3 Send OTP
- **Endpoint:** `POST /send-otp`
- **Description:** Generates a 6-digit OTP and sends it via SMS.
- **Request Body:**
```json
{
  "email": "john@example.com"
}
```

### 1.4 Verify OTP
- **Endpoint:** `POST /verify-otp`
- **Description:** Verifies the sent OTP.
- **Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

### 1.5 Reset Password
- **Endpoint:** `POST /reset-password`
- **Description:** Resets the user's password.
- **Request Body:**
```json
{
  "email": "john@example.com",
  "newPassword": "newsecurepassword"
}
```

### 1.6 Logout (Protected - Requires Token)
- **Endpoint:** `POST /logout`
- **Headers:** `Authorization: Bearer {token}`
- **Response `data`:** `null`

---

## 2. Public Service Requests

### 2.1 Submit a Service Request
- **Endpoint:** `POST /service-requests`
- **Description:** Allows unauthenticated users (customers) to request a service. Triggers SMS to Admins and the Customer.
- **Request Body:**
```json
{
  "serviceId": 1,
  "fullName": "Jane Doe",
  "email": "jane.doe@example.com",
  "phone": "255789123456",
  "message": "I need help with tax consultation.",
  "locale": "en" // Optional: "en", "sw" - Defines the customer's language
}
```
- **Response `data`:** The newly created `UserRequestService` object.

---

## 3. Protected Routes (Require `Authorization: Bearer {token}`)

### 3.1 Languages Management
Manages the supported languages for the multi-language features.

- **List Languages:** `GET /languages`
- **Create Language:** `POST /languages`
  - **Request Body:**
  ```json
  {
    "name": "English",
    "code": "en",
    "nativeName": "English",
    "flag": "gb"
  }
  ```
- **Update Language:** `PUT /languages/{id}`
  - **Request Body:**
  ```json
  {
    "name": "Swahili",
    "code": "sw",
    "nativeName": "Kiswahili",
    "flag": "tz"
  }
  ```
- **Delete Language:** `DELETE /languages/{id}`

### 3.2 Services Management (Multi-Language Supported)
Services include translatable fields (title, description, offers).

- **List Services:** `GET /services`
  - **Response `data`:** Array of services containing their `translations`.
- **Create Service:** `POST /services`
  - **Request Body:**
  ```json
  {
    "status": "ACTIVE", // Optional Enum
    "translations": [
      {
        "languageId": 1,
        "title": "Tax Consultation",
        "description": "Comprehensive tax advisory service.",
        "offers": ["Audit", "Filing"]
      },
      {
        "languageId": 2,
        "title": "Ushauri wa Kodi",
        "description": "Huduma kamili ya ushauri wa kodi.",
        "offers": ["Ukaguzi", "Kujaza fomu"]
      }
    ]
  }
  ```
- **Update Service:** `PUT /services/{id}`
  - **Request Body:** Uses the exact same JSON structure as the `Create` endpoint.
- **Delete Service:** `DELETE /services/{id}`

### 3.3 Document Types Management (Multi-Language Supported)

- **List Document Types:** `GET /document-types`
- **Create Document Type:** `POST /document-types`
  - **Request Body:**
  ```json
  {
    "status": "ACTIVE",
    "translations": [
      {
        "languageId": 1,
        "name": "Tax Form"
      },
      {
        "languageId": 2,
        "name": "Fomu ya Kodi"
      }
    ]
  }
  ```
- **Bulk Create Document Types:** `POST /document-types/bulk`
  - **Request Body:**
  ```json
  {
    "documentTypes": [
      {
        "status": "ACTIVE",
        "translations": [
          { "languageId": 1, "name": "Report" },
          { "languageId": 2, "name": "Ripoti" }
        ]
      }
    ]
  }
  ```
- **Update Document Type:** `PUT /document-types/{id}`
  - **Request Body:** Uses the exact same JSON structure as the `Create` endpoint.
- **Delete Document Type:** `DELETE /document-types/{id}`

### 3.4 Documents Management (Multi-Language Supported)
Requires `multipart/form-data` for file uploads.

- **List Documents:** `GET /documents`
- **Create Document:** `POST /documents`
  - **Request Body (`multipart/form-data`):**
  > [!NOTE]
  > Because of the file upload, submit this payload as `multipart/form-data` instead of `application/json`.
  ```json
  {
    "documentTypeId": 1,
    "status": "ACTIVE",
    "document": "<BINARY_FILE_ALLOWED: pdf, xlsx, xls, doc, docx, png, jpg, jpeg | MAX: 20MB>",
    "custom_file_name": "my-document.pdf",
    "translations": [
      {
        "languageId": 1,
        "title": "Q1 Financials",
        "description": "Report for Q1"
      },
      {
        "languageId": 2,
        "title": "Taarifa ya Fedha Q1",
        "description": "Ripoti ya Q1"
      }
    ]
  }
  ```
- **Update Document:** `PUT /documents/{id}` 
  - **Request Body (`multipart/form-data`):** Uses the same structure as Create, but the `document` file field is **optional** (only include it if you want to replace the existing file).
  > [!WARNING]
  > Because PHP/Laravel cannot natively parse `multipart/form-data` on `PUT` requests, you **must** send this as a `POST` request to `/documents/{id}` and include `"_method": "PUT"` in your JSON/FormData payload.
- **Delete Document:** `DELETE /documents/{id}`

### 3.5 Posters Management (Multi-Language Supported)
Requires `multipart/form-data` for image uploads.

- **List Posters:** `GET /posters`
- **Create Poster:** `POST /posters`
  - **Request Body (`multipart/form-data`):**
  > [!NOTE]
  > Because of the image upload, submit this payload as `multipart/form-data` instead of `application/json`.
  ```json
  {
    "status": "ACTIVE",
    "image": "<BINARY_FILE_ALLOWED: jpeg, png, jpg, gif, svg, webp | MAX: 10MB>",
    "custom_file_name": "promo.jpg",
    "translations": [
      {
        "languageId": 1,
        "title": "Promo 2026",
        "description": "Huge discounts on consultation."
      },
      {
        "languageId": 2,
        "title": "Punguzo 2026",
        "description": "Punguzo kubwa kwenye ushauri."
      }
    ]
  }
  ```
- **Update Poster:** `PUT /posters/{id}`
  - **Request Body (`multipart/form-data`):** Uses the same structure as Create, but the `image` field is **optional** (only include it if you want to replace the existing image).
  > [!WARNING]
  > Because PHP/Laravel cannot natively parse `multipart/form-data` on `PUT` requests, you **must** send this as a `POST` request to `/posters/{id}` and include `"_method": "PUT"` in your JSON/FormData payload.
- **Delete Poster:** `DELETE /posters/{id}`

### 3.6 Users Management (Admin)
- **List Users:** `GET /users`
- **Create User:** `POST /users`
  - **Description:** Uses the same request body as the Register endpoint.
- **Update User:** `PUT /users/{id}`
  - **Request Body:**
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.update@example.com",
    "phoneNumber": "255712345678",
    "role": "USER"
  }
  ```
- **Delete User:** `DELETE /users/{id}`
- **Change Password:** `PUT /users/{id}/change-password`
  - **Request Body:**
  ```json
  {
    "oldPassword": "currentpassword",
    "newPassword": "newsecurepassword"
  }
  ```

### 3.7 Service Requests (Admin View)
- **List All User Service Requests:** `GET /service-requests`
  - **Description:** Fetches all requests submitted via the public endpoint, including relation to the requested service.