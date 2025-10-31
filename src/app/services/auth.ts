
// small typed helper for auth-related network calls

import { TokenManager } from "../utils/tokenUtils";

type VerifyResponse = {
  success: boolean;
  message?: string;
  error?: string

};

type ResendResponse = {
  success: boolean;
  message?: string;
};

type IdentityResponse = {
  success: boolean;
  message?: string;

};

const BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";

async function handleResponse(res: Response) {
  const text = await res.text();
  try {
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) {
      const msg = data?.message || data?.error || res.statusText;
      return {success: false, message:msg || "Request failed"}
    }
    return {success: true, ...data};
  } catch (error) {
    // if JSON parse fails but res.ok is true, return raw text
    if (res.ok) {
      return {success: true, message: text }
    }
    return {success: false, message: "Parse error"}
  }
}

/**
 * Verify an email with OTP code.
 * @param email user's email
 * @param code OTP code string (6 digits)
 * @param role the role string (e.g. "Runner" | "Tasker")
 */
export async function verifyEmail(
  email: string,
  otp: string
): Promise<VerifyResponse> {
  if (!BASE) throw new Error("Missing NEXT_PUBLIC_API_URL environment variable");

  const url = `${BASE}/auth/email/verify/`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  }

  const token = TokenManager.getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ email, otp}),
  });

  return handleResponse(res);
}

/**
 * Resend verification code to email.
 * @param email user's email
 */
export async function resendVerificationCode(
  email: string
): Promise<ResendResponse> {
  if (!BASE) throw new Error("Missing NEXT_PUBLIC_API_URL environment variable");

  const url = `${BASE}/auth/email/send-otp/`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // ✅ Add authorization header if token exists
  const token = TokenManager.getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ email }),
  });

  return handleResponse(res);
}

/**
 * Verify user identity by uploading a document.
 * @param email user's email
 * @param role user's role ("Runner" | "Tasker")
 * @param country selected country
 * @param documentType type of document (e.g. "passport", "id_card")
 * @param documentFile the file object of the document
 */
export async function verifyIdentity(
  email: string,
  role: string,
  userId: string,
  country: string,
  documentType: string,
  documentFile: File,
): Promise<IdentityResponse> {
  if (!BASE) throw new Error("Missing NEXT_PUBLIC_API_URL environment variable");

  const url = `${BASE}/verify-identity/${userId}/`;

  const formData = new FormData();
  formData.append("email", email);
  formData.append("role", role);
  formData.append("country",country);
  formData.append("document_type",documentType);
  formData.append("document_file",documentFile);

  const headers: HeadersInit = {};

  // ✅ Add authorization header if token exists
  const token = TokenManager.getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
  });

  return handleResponse(res);
}

export default {
  verifyEmail,
  resendVerificationCode,
  verifyIdentity,
};
