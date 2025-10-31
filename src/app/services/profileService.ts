// services/profileService.ts
import { TokenManager } from '../utils/tokenUtils';

const BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";

export async function uploadProfilePicture(
  userId: string,
  profilePicture: File
): Promise<{ success: boolean; message?: string; profile_picture_url?: string }> {
  if (!BASE) throw new Error("Missing NEXT_PUBLIC_API_URL environment variable");

  const url = `${BASE}/users/${userId}/upload-picture/`;

  const formData = new FormData();
  formData.append("profile_picture", profilePicture);

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

  const text = await res.text();
  try {
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) {
      return { success: false, message: data?.error || data?.message || "Upload failed" };
    }
    return { success: true, ...data };
  } catch (error) {
    return { success: false, message: "Parse error" };
  }
}