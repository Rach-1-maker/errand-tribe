"use client";

import { useSearchParams, useRouter } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { verifyEmail, resendVerificationCode } from "../../services/auth";
import { AiOutlineArrowLeft } from "react-icons/ai";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const role = searchParams.get("role") || "User";
  const email = searchParams.get("email") || "example@gmail.com";

  const [otp, setOtp] = useState<string[]>(["", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  // Refs for OTP inputs
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Join OTP array into string
  const otpCode = otp.join("");

  const handleChange = (index: number, value: string) => {
    if (/^\d?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < otp.length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (otpCode.length < 6) return;

    setLoading(true);
    setError("");
    try {
      await verifyEmail(email, otpCode);
      router.push(`/identity-verification?role=${role}&email=${email}`);
    } catch (err: any) {
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await resendVerificationCode(email);
      setResendMessage("A new code has been sent to your email.");
    } catch (err: any) {
      setResendMessage(err.message || "Could not resend code.");
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left Section (Form) */}
      <div className="flex-1 flex flex-col bg-white px-8 md:px-16 justify-center">
        <div className="w-full max-w-md mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center text-sm text-gray-600 mb-6"
          >
            <AiOutlineArrowLeft className="mr-2" /> Back
          </button>

          {/* Heading */}
          <h1 className="text-2xl md:text-3xl font-bold text-[#252B42] text-center">
            Verify your email
          </h1>
          <p className="mt-2 mb-6 text-gray-600 text-center">
            We have sent an OTP with an activation code to your email{" "}
            <span className="font-medium">{email}</span>
          </p>

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* OTP Fields */}
            <div className="flex justify-between space-x-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el
                    if (index === 0 && el) el.focus()
                }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`w-12 h-12 text-center border rounded-lg text-lg focus:outline-none transition-colors duration-200 ${digit
                    ? "border-[#E0E0E0] ring-2 ring-[#E0E0E0]"
                    : "border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#CBCCF8]"}`}
                  required
                />
              ))}
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            {/* Resend */}
            <p className="text-sm text-gray-600 text-center">
              Didn't receive the code?{" "}
              <span
                className="text-[#424BE0] font-medium cursor-pointer"
                onClick={handleResend}
              >
                Resend
              </span>
            </p>
            {resendMessage && (
              <p className="text-green-600 text-sm text-center">{resendMessage}</p>
            )}

            {/* Continue Button */}
            <button
              type="submit"
              className={`w-full py-3 rounded-lg font-semibold transition ${
                otpCode.length === 5 && !loading
                  ? "bg-[#424BE0] text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              disabled={otpCode.length < 5 || loading}
            >
              {loading ? "Verifying..." : "Continue"}
            </button>
          </form>
        </div>
      </div>

      {/* Right Section (Illustration) */}
      <div className="hidden md:flex flex-1 bg-[#424BE0] items-center justify-center text-center px-8">
        <div>
          <h2 className="text-white text-2xl md:text-3xl font-semibold mb-6">
            Whatever your errand is, <br />
            Errand Tribe's got you covered!
          </h2>
          <Image
            src={role === "Tasker" ? "/tasker-illustration.png" : "/runner-illustration.png"}
            alt="Signup Illustration"
            width={400}
            height={400}
            className="mx-auto"
          />
        </div>
      </div>
    </div>
  );
}
