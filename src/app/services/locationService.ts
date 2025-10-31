// services/locationService.ts
import { TokenManager } from '../utils/tokenUtils';

const BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";

export async function enableLocation(
  userId: string,
  locationPermission: 'while_using_app' | 'always',
  locationData?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    address?: string;
  }
): Promise<{ success: boolean; message?: string; user?: any }> {
  if (!BASE) throw new Error("Missing NEXT_PUBLIC_API_URL environment variable");

  const url = `${BASE}/users/${userId}/location-permission/`;

  const requestBody: any = {
    location_permission: locationPermission,
  };

  // Add location data if provided
  if (locationData) {
    requestBody.latitude = locationData.latitude;
    requestBody.longitude = locationData.longitude;
    requestBody.accuracy = locationData.accuracy;
    requestBody.timestamp = new Date().toISOString();
    if (locationData.address) {
      requestBody.address = locationData.address;
    }
  }

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
    body: JSON.stringify(requestBody),
  });

  const text = await res.text();
  try {
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) {
      return { success: false, message: data?.error || data?.message || "Location enable failed" };
    }
    return { success: true, ...data };
  } catch (error) {
    return { success: false, message: "Parse error" };
  }
}