"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import { RxEyeClosed } from "react-icons/rx";
import { AiOutlineEye } from "react-icons/ai";
import { useRoleModal } from "../context/RoleModalContext";
import { useUser } from "../context/UserContext";
import { MdOutlineArrowBackIos } from "react-icons/md";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { openModal } = useRoleModal();

  const isFormValid = email.trim() !== "" && password.trim() !== "";
  const {login} = useUser()

  // Load remembered email if available
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Optional — preload name from signup if stored locally
  useEffect(() => {
    const storedData = localStorage.getItem("signupData");
    if (storedData) {
      const parsed = JSON.parse(storedData);
      setLastName(parsed.lastName || "");
    }
  }, []);

  // Handle login submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setError("");

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      if (!API_URL) throw new Error("API URL not set in .env");

      const res = await fetch(`${API_URL}/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error) {
          setError(data.error);
        } else if (data.errors) {
          // Format: {"errors": {"email": ["This field is required."]}}
          const errorMsg = Object.values(data.errors).flat().join(', ');
          setError(errorMsg);
        } else if (data.detail) {
          // JWT or other DRF errors
          setError(data.detail);
        } else {
          setError(data.message || "Login failed. Please try again.");
        }
        return;
      }

    if (data.success && data.tokens && data.user) {
      const { tokens, user } = data;

      login(user, tokens)

      // Remember email if checked
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }
      localStorage.removeItem("signupData");

      // Redirect user based on role
      setTimeout(() => {
        if (user.role === "tasker") {
          router.push(`/tasker/dashboard/[id]/${user.id}`);
        } else if (user.role === "runner") {
          router.push(`/runner/dashboard/[id]/${user.id}`)
        } else {
          router.push("/"); // fallback
        }
      }, 300)

    } else {
      throw new Error("Invalid response format from server")
    }
    } catch (err) {
      console.error("Login failed:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-[#424BE0]">
      {/* Left Section (Form) */}
      <div className="flex-1 flex flex-col justify-center items-center rounded-tr-[60px] rounded-br-[60px] bg-white px-8 md:px-12 overflow-hidden">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center text-lg text-gray-600 mb-6"
          >
            <MdOutlineArrowBackIos className="mr-2 text-lg" /> Back
          </button>
          {/* Heading */}
          <h1 className="text-2xl md:text-3xl font-bold mb-8 text-[#252B42]">
            Welcome back {lastName && `${lastName}`} 👋
          </h1>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="border border-[#E6E5E5] text-sm focus:outline-none focus:ring-1 focus:ring-[#CBCCF8] rounded-lg px-4 py-3 w-full"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="border border-[#E6E5E5] text-sm focus:outline-none focus:ring-1 focus:ring-[#CBCCF8] rounded-lg px-4 py-3 w-full"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-8 top-4 cursor-pointer text-gray-500"
                >
                  {showPassword ? (
                    <AiOutlineEye size={20} />
                  ) : (
                    <RxEyeClosed size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

            {/* Remember me & Forgot password */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="accent-[#424BE0]"
                />
                Remember me
              </label>
              <a
                href="/forgot-password"
                className="text-[#424BE0] hover:underline"
              >
                Forgot password?
              </a>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={!isFormValid || loading}
              className={`w-full py-3 rounded-lg font-semibold transition ${
                isFormValid && !loading
                  ? "bg-[#424BE0] text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* OR Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-300" />
            <span className="mx-4 text-gray-500">Or</span>
            <div className="flex-1 border-t border-gray-300" />
          </div>

          {/* Social Auth */}
          <div className="flex flex-col items-center w-full mt-4">
            <button className="flex items-center border-[#CBCCF8] justify-center text-[#979797] w-4/5 py-2 px-3 mb-3 border rounded-lg hover:bg-gray-50">
              <FcGoogle className="text-lg mr-2" />
              Continue with Google
            </button>
            <button className="flex items-center justify-center border-[#CBCCF8] text-[#979797] w-4/5 px-3 py-2 border rounded-lg hover:bg-gray-50">
              <FaApple className="text-lg mr-2" />
              Continue with Apple
            </button>
          </div>
        </div>

        {/* Signup link */}
        <p className="mt-4 text-center text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={openModal}
            className="text-[#424BE0] font-medium hover:underline"
          >
            Sign up
          </button>
        </p>
      </div>

      {/* Right Section (Illustration) */}
      <div className="hidden md:flex flex-1 items-center justify-center text-center px-8">
        <div>
          <h2 className="text-white text-2xl md:text-3xl font-semibold mb-6 max-w-lg">
            {"Whatever your errand is, Errand Tribe's got you covered!"}
          </h2>
          <Image
            src="/login-illustration.png"
            alt="Login Illustration"
            width={400}
            height={400}
            className="mx-auto"
            priority
          />
        </div>
      </div>
    </div>
  );
}
