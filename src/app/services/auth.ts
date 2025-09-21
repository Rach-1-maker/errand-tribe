// src/services/auth.ts

// Verify Email
export async function verifyEmail(email: string, code: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-email/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Email verification failed");
    }

    return await res.json();
  } catch (err: any) {
    throw new Error(err.message || "Network error");
  }
}

// Resend OTP Code
export async function resendVerificationCode(email: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/resend-code/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to resend code");
    }

    return await res.json();
  } catch (err: any) {
    throw new Error(err.message || "Network error");
  }
}
