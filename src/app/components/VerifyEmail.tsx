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
  const [email, setEmail] = useState("")
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
    const storedEmail = sessionStorage.getItem("signup_email");
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, [])


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
  // Get only the last character if multiple chars are entered
  const numericValue = value.replace(/[^0-9]/g, '').slice(-1);
  
  if (numericValue || value === '') {
    const newOtp = [...otp];
    newOtp[index] = numericValue;
    setOtp(newOtp);

    // Auto-focus next input
    if (numericValue && index < otp.length - 1) {
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 0);
    }
  }
};

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === "Backspace") {
    e.preventDefault();
    const newOtp = [...otp];

    if (otp[index]) {
      // Clear current box only
      newOtp[index] = "";
      setOtp(newOtp);
    } else if (index > 0) {
      // Move focus to previous and clear it, if current box is empty
      newOtp[index - 1] = "";
      setOtp(newOtp);
      setTimeout(() => {
        inputRefs.current[index - 1]?.focus();
      }, 0);
    }
  }

  if (e.key === "ArrowLeft" && index > 0) {
    e.preventDefault();
    setTimeout(() => {
      inputRefs.current[index - 1]?.focus();
    }, 0);
  }

  if (e.key === "ArrowRight" && index < otp.length - 1) {
    e.preventDefault();
    setTimeout(() => {
      inputRefs.current[index + 1]?.focus();
    }, 0);
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
        sessionStorage.removeItem("signup_email")
      router.push(`/signup/${role}/${userId}/verify-identity`)
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

      setTimeout(() => setResendMessage(""), 2000)
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
            We sent a 6-digit code to <strong>{email}</strong>
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
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, '').slice(0, otp.length);
                    
                    if (pasted) {
                      const newOtp = [...otp];
                      pasted.split('').forEach((char, i) => {
                        if (i < otp.length) {
                          newOtp[i] = char;
                        }
                      });
                      setOtp(newOtp);
                      
                      // Focus the next empty input or the last one
                      const nextIndex = Math.min(pasted.length, otp.length - 1);
                      setTimeout(() => {
                        inputRefs.current[nextIndex]?.focus();
                      }, 0);
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
              Didn&apos;t receive the code?{" "}
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
