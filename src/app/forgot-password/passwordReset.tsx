"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaArrowLeftLong } from "react-icons/fa6";
import { MdOutlineArrowBackIos } from "react-icons/md";

export default function PasswordReset({
  userType = "tasker",
  userId,
}: {
  userType?: "tasker" | "runner";
  userId: string;
}) {
  const [step, setStep] = useState<number>(1);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // OTP state
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [otpError, setOtpError] = useState<string | null>(null);
  const [canResend, setCanResend] = useState(false);
  const [timer, setTimer] = useState(20);

  // New password
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Debug the props and validate UUID
  useEffect(() => {
    console.log("🔍 PasswordReset Debug:", {
      userType,
      userId,
      isValidUUID: isValidUUID(userId),
      API_URL,
      fullPath: window.location.href
    });

    // If userId is not a valid UUID, show error immediately
    if (userId && !isValidUUID(userId)) {
      setEmailError("Invalid user identifier. Please use the correct password reset link.");
    }
  }, [userType, userId]);

  // UUID validation function
  function isValidUUID(uuid: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  function isValidEmail(value: string) {
    return /^[\w-.]+@[\w-]+\.[a-zA-Z]{2,}$/.test(value);
  }

  function showError(msg: string, setter: (s: string | null) => void) {
    setter(msg);
  }

  // ✅ FIXED: Forgot password - only needs email and role
  async function apiSendReset(email: string, userType: string) {
    console.log("📤 Sending reset request:", { email, userType });
    
    const res = await fetch(`${API_URL}/auth/forgot-password/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        email, 
        role: userType,
        // Don't send userId here - backend should look up user by email+role
      }),
    });

    console.log("📨 Reset response status:", res.status);

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error("Credentials do not match our records");
      }
      // Try to get more detailed error message
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Something went wrong");
    }
    
    const responseData = await res.json();
    console.log("✅ Forgot password response:", responseData);
    return responseData;
  }

  // ✅ FIXED: OTP verification
  async function apiVerifyOtp(email: string, code: string, userType: string) {
    console.log("📤 Verifying OTP:", { email, code, userType });
    
    const res = await fetch(`${API_URL}/auth/email/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        email, 
        code, 
        role: userType,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Invalid or expired code");
    }
    
    const responseData = await res.json();
    console.log("✅ OTP verification response:", responseData);
    return responseData;
  }

  // ✅ FIXED: Reset password - uses the UUID from URL
  async function apiResetPassword(email: string, newPassword: string, userType: string, userId: string) {
    console.log("📤 Resetting password:", { email, userType, userId });
    
    // Validate UUID before making the request
    if (!isValidUUID(userId)) {
      throw new Error("Invalid user identifier format");
    }

    const res = await fetch(`${API_URL}/users/${userId}/reset-password/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        email, 
        password: newPassword, 
        role: userType,
        // Don't send userId in body since it's in the URL
      }),
    });

    console.log("📨 Reset password response status:", res.status);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Unable to reset password");
    }
    
    const responseData = await res.json();
    console.log("✅ Password reset successful:", responseData);
    return responseData;
  }

  // ✅ FIXED: Handle continue without userId
  async function handleContinue(e?: React.FormEvent) {
    e?.preventDefault();
    setEmailError(null);
    
    if (!isValidEmail(email)) {
      showError("Please enter a valid email address.", setEmailError);
      return;
    }

    setIsSubmitting(true);
    try {
      // Only send email and userType - backend should find user by email+role
      await apiSendReset(email, userType);
      setStep(2);
      setTimer(20);
      setCanResend(false);
      setOtp(Array(6).fill(""));
      setOtpError(null);
    } catch (err: any) {
      console.error("❌ Forgot password error:", err);
      if (err.message.includes("records")) {
        showError("Credentials do not match our records.", setEmailError);
      } else {
        showError(err.message || "Something went wrong. Please try again.", setEmailError);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function startTimer() {
    setCanResend(false);
    setTimer(20);
  }

  useEffect(() => {
    if (step !== 2) return;
    if (timer <= 0) {
      setCanResend(true);
      return;
    }
    const id = setTimeout(() => setTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timer, step]);

  async function handleResend() {
    if (!canResend) return;
    setIsSubmitting(true);
    try {
      await apiSendReset(email, userType);
      startTimer();
    } catch (error: any) {
      setOtpError(error.message || "Unable to resend code. Try again later.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleOtpChange(index: number, value: string) {
    if (!/^[0-9]?$/.test(value)) return;
    const copy = [...otp];
    copy[index] = value;
    setOtp(copy);
    setOtpError(null);
  }

  // ✅ FIXED: OTP verification without userId
  async function handleVerifyOtp(e?: React.FormEvent) {
    e?.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) {
      setOtpError("Please enter the 6-digit code.");
      return;
    }
    setIsSubmitting(true);
    try {
      await apiVerifyOtp(email, code, userType);
      setStep(3);
      setPassword("");
      setConfirm("");
      setPasswordError(null);
    } catch (error: any) {
      setOtpError(error.message || "Invalid or expired code.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function validatePassword(value: string) {
    const checks = [
      { ok: value.length >= 8, msg: "At least 8 characters" },
      { ok: /[A-Z]/.test(value), msg: "An uppercase letter" },
      { ok: /[0-9]/.test(value), msg: "A number" },
      { ok: /[^A-Za-z0-9]/.test(value), msg: "A special character" },
    ];
    const failed = checks.filter((c) => !c.ok).map((c) => c.msg);
    return failed;
  }

  // ✅ FIXED: Reset password with UUID validation
  async function handleReset(e?: React.FormEvent) {
    e?.preventDefault();
    setPasswordError(null);
    
    // Validate UUID
    if (!isValidUUID(userId)) {
      setPasswordError("Invalid user identifier. Please use the correct reset link.");
      return;
    }

    const failed = validatePassword(password);
    if (failed.length) {
      setPasswordError(`Password must contain: ${failed.join(", ")}`);
      return;
    }
    if (password !== confirm) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiResetPassword(email, password, userType, userId);
      setStep(4);
    } catch (error: any) {
      setPasswordError(error.message || "Unable to reset password. Try again later.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Debug info component
  const DebugInfo = () => (
    <div className="bg-yellow-50 p-3 rounded-lg mb-4 text-xs">
      <strong>Debug Info:</strong>
      <div>Step: {step}</div>
      <div>User Type: {userType}</div>
      <div>User ID: {userId}</div>
      <div>Is Valid UUID: {isValidUUID(userId) ? "Yes" : "No"}</div>
      <div>Email: {email}</div>
      <div>API URL: {API_URL}</div>
    </div>
  );

  // Show error if UUID is invalid
  if (userId && !isValidUUID(userId)) {
    return (
      <div className="min-h-screen bg-[#ECEDFC] flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-md px-8 py-12 text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-4">Invalid Reset Link</h2>
            <p className="text-sm text-gray-600 mb-6">
              The password reset link appears to be invalid or expired.
            </p>
            <Link 
              href={`/forgot-password?userType=${userType}`}
              className="text-[#424BE0] hover:underline"
            >
              Request a new reset link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ECEDFC] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-8"
        >
          <MdOutlineArrowBackIos className="mr-2" /> Back
        </button>

        <div className="bg-white rounded-2xl shadow-md px-8 py-12">
          {/* Debug info - remove in production */}
          <DebugInfo />

          {step === 1 && (
            <form onSubmit={handleContinue}>
              <h2 className="text-xl font-semibold text-[#1A202C] mb-4">Forgot password?</h2>
              <p className="text-sm text-[#222124] mb-6">
                Don&apos;t worry, it happens. Please enter the email associated with your
                account.
              </p>

              <label className="block text-xs text-[#2E2E2E] mb-2">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => {
                  if (email && !isValidEmail(email)) 
                    setEmailError("Please enter a valid email address.");
                }}
                className={`w-full rounded-lg border px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 ${
                  emailError ? "border-red-400" : "border-[#EDEDF3]"
                }`}
                placeholder="name@gmail.com"
                type="email"
                aria-invalid={!!emailError}
              />
              {emailError && <p className="text-xs text-red-500 mb-3">{emailError}</p>}

              <button
                disabled={!isValidEmail(email) || isSubmitting}
                className={`w-full rounded-lg py-2 text-white font-medium mb-3 ${
                  !isValidEmail(email) || isSubmitting 
                    ? "bg-[#E0E0E0] cursor-not-allowed" 
                    : "bg-[#424BE0] hover:bg-[#3539b0]"
                }`}
              >
                {isSubmitting ? "Sending..." : "Continue"}
              </button>

              <p className="text-center text-sm text-[#333333]">
                Remember password? <Link href={`/login?userType=${userType}`} className="text-[#424BE0] hover:underline">Log in</Link>
              </p>
            </form>
          )}

          {/* Steps 2, 3, and 4 remain the same as before */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp}>
              <h2 className="text-lg font-semibold mb-2">Please check your email</h2>
              <p className="text-sm text-slate-500 mb-6">
                We have sent a code to <span className="font-medium">{email}</span>
              </p>

              <div className="flex gap-2 justify-center mb-4">
                {otp.map((d, i) => (
                  <input
                    key={i}
                    value={d}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    id={`otp-${i}`}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    className="w-12 h-12 text-center rounded-md border shadow-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200"
                  />
                ))}
              </div>

              {otpError && <p className="text-xs text-red-500 mb-3">{otpError}</p>}

              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  disabled={!canResend || isSubmitting}
                  onClick={handleResend}
                  className={`text-sm ${canResend ? "text-indigo-600 hover:underline" : "text-slate-400"}`}
                >
                  {canResend ? "Send code again" : `Send code again in ${timer}s`}
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Verifying..." : "Verify"}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleReset}>
              <h2 className="text-lg font-semibold mb-2">Reset password</h2>
              <p className="text-sm text-slate-500 mb-6">
                Changing your password for <span className="font-medium">{email}</span>
              </p>

              <label className="block text-xs text-slate-600 mb-2">New password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                className="w-full rounded-lg border px-3 py-2 mb-1 focus:outline-none focus:ring-2 focus:ring-indigo-200 border-slate-200"
                placeholder="Enter new password"
              />

              <div className="text-xs text-slate-500 mb-3">
                Minimum 8 characters with an uppercase letter, number and special character
              </div>

              <label className="block text-xs text-slate-600 mb-2">Confirm password</label>
              <input
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                type="password"
                className="w-full rounded-lg border px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-200 border-slate-200"
                placeholder="Confirm password"
              />

              {passwordError && <p className="text-xs text-red-500 mb-3">{passwordError}</p>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg py-2 text-white mb-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Reset Password"}
              </button>
            </form>
          )}

          {step === 4 && (
            <div className="text-center">
              <div className="mx-auto mb-4 w-20 h-20 flex items-center justify-center rounded-full bg-green-500 text-white text-3xl">
                ✓
              </div>
              <h2 className="text-lg font-semibold mb-2">Password changed</h2>
              <p className="text-sm text-slate-500 mb-6">
                Your password has been updated successfully.
              </p>

              <button
                onClick={() => router.push(`/login?userType=${userType}`)}
                className="w-full rounded-lg py-2 text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Back to Log in
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}