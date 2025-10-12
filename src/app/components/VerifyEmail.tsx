"use client";

import {  useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { verifyEmail, resendVerificationCode } from "../services/auth";
import { MdOutlineArrowBackIos } from "react-icons/md";


interface verifyEmailProps {
    role: "tasker" | "runner"
    userId: string
  }

export default function VerifyEmailPage({ role, userId }: verifyEmailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";
  const [email] = useState(initialEmail)
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]); // 6 digits
  const [timer, setTimer] = useState(0)
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  // Refs for OTP inputs
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Join OTP array into string
  const otpCode = otp.join("");

 useEffect(() => {
  if (!email) {
    setError("Email not found. Please restart the signup process.")
  }
 }, [email])


  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000)
      return () => clearInterval(interval)
    }
  }, [timer])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleChange = (index: number, value: string) => {
    if (/^\d?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < otp.length - 1) {
        inputRefs.current[index + 1]?.focus();
      }else if (!value && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
      
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }

    if (e.key === "ArrowRight" && index < otp.length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (otpCode.length < 6) return;


    setLoading(true);
    setError("");
    try {
     const data = await verifyEmail(email, otpCode);
      if (data.success) {
      router.push(`/signup/${role}/${userId}/verify-identity/?email=${encodeURIComponent(email)}`)
      } else {
        setError(data.error || data.message || "Verification failed. Try again");
      }
    } catch (err: any) {
      setError(err.message || "Network error. Please try again");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return  // Prevent resending of otp before countdown ends
    
    if (!email) {
      setError("No Email found. Please restart the signup process.")
      return
    }

    setResendMessage("");
    setError("");

    setOtp(Array(6).fill(""))
    inputRefs.current[0]?.focus()

    try {
      const data = await resendVerificationCode(email);
      if (data.success) {
      setResendMessage(data.message || "A new OTP code has been sent to your email.")
      setTimer(30)

      setTimeout(() => setResendMessage(""), 20000)
    } else {
      setError(data.message || "Could not resend code.");
      setTimer(0)
      }
    } catch (err: any) {
      setError(err.message || "Network error. Please try again.");
      setTimer(0)
    }
  };

  return (
    <div className="h-screen flex bg-[#424BE0] overflow-hidden">
      {/* Left Section (Form) */}
      <div className="flex-1 flex flex-col bg-white px-8 md:px-12 justify-center items-center rounded-tr-[60px] rounded-br-[60px]">
        <div className="w-full max-w-md mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center text-lg text-gray-600 mb-32 font-semibold"
          >
            <MdOutlineArrowBackIos className="mr-2" /> Back
          </button>

          {/* Heading */}
          <h1 className="text-2xl sm:text-4xl font-semibold mb-4 text-[#252B42] ">
            Verify your Email
          </h1>
          <p className="mt-2 text-gray-600 mb-10">
            We sent a 6-digit code to <span className="font-medium">{email}</span>
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  onPaste={(e) => {
                    e.preventDefault();
                    const pasted = e.clipboardData.getData("text").slice(0, otp.length);
                    if (/^\d+$/.test(pasted)) {
                      const newOtp = pasted.split("");
                      setOtp(newOtp);
                      newOtp.forEach((digit, i) => {
                        if (inputRefs.current[i]) inputRefs.current[i]!.value = digit;
                      });
                      inputRefs.current[Math.min(pasted.length, otp.length - 1)]?.focus();
                    }
                  }}
                  className={`w-16 h-16 text-center border rounded-lg text-lg focus:outline-none transition-colors duration-500 ${digit
                    ? "border-[#E0E0E0] ring-2 ring-[#E0E0E0]"
                    : "border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#CBCCF8]"}`}
                  required
                />
              ))}
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
            {resendMessage && <p className="text-green-600 text-sm">{resendMessage}</p>}

            {/* Resend */}
            <p className="text-sm text-gray-600 text-center">
              Didn&aos;t receive the code?{" "}
              <button
                type="button"
                onClick={handleResend}
                className={`font-medium ${timer > 0 ? "text-gray-400 cursor-not-allowed" :"text-[#424BE0]" }`}
                disabled={loading || timer > 0}
              >
                {timer > 0 ? `Resend in ${timer}s` : "Resend"}
              </button>
            </p>

            {/* Continue Button */}
            <button
              type="submit"
              disabled={otpCode.length < 6 || loading}
              className={`w-full py-3 rounded-lg font-semibold transition ${
                otpCode.length === 6 && !loading
                  ? "bg-[#424BE0] text-white"
                  : "bg-[#E0E0E0] text-white cursor-not-allowed"
              }`}
            >
              {loading ? "Verifying..." : "Continue"}
            </button>
          </form>
        </div>
      </div>

      {/* Right Section (Illustration) */}
      <div className="hidden md:flex flex-1 items-center justify-center text-center px-8">
        <div>
          <h2 className="text-white text-2xl md:text-3xl font-semibold mb-6 max-w-lg leading-tight">
           {role === "tasker"
              ? "Whatever your errand is,\n Errand Tribe's got you \n covered!"
              : "Earn with every errand! safe,\n seamless, and rewarding \n with Errand Tribe."}
          </h2>
          <Image
            src= "/verify.png"
            alt="Email Verification Illustration"
            width={400}
            height={400}
            className="mx-auto"
          />
        </div>
      </div>
    </div>
  );
}
