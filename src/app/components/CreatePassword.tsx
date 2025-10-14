"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import Image from "next/image";
import { AiOutlineEye} from "react-icons/ai";
import { RxEyeClosed } from "react-icons/rx";
import { MdOutlineArrowBackIos } from "react-icons/md";


interface PasswordPageProps {
  
    role: "tasker" | "runner"
    userId: string
  }


export default function CreatePassword({ role, userId }: PasswordPageProps) {

  const router = useRouter()
  const [formValues, setFormValues] = useState({
    password: "",
    confirmPassword: "",
    email: ""
  });
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [errors, setErrors] = useState("")
  const [generalError, setGeneralError] = useState("")
  const [isFormValid, setIsFormValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("signup_email")
    if (storedEmail) setEmail(storedEmail)
  }, [])

  useEffect(() => {
    if (!userId) {
      setGeneralError("Invalid signup session. Please start the signup process again.");
        router.push('/signup')
    }
    
    }, [userId, router])

    // Password validator
  const validatePassword = (password: string): boolean => {
    return (
        password.length >= 8 && // Minimum length
        /[A-Z]/.test(password) && // At least one uppercase letter
        /\d/.test(password) && // At least one digit
        /[@$!%*#?&]/.test(password) // At least one special character
    );
  }

  // Update form validity
  useEffect(() => {
    const { password, confirmPassword } = formValues

    if (password && confirmPassword && password !== confirmPassword) {
        setErrors("Passwords do not match")
        setIsFormValid(false);

    } else if (password && !validatePassword(password)) {
        setErrors("Password must be at least 8 characters, including an uppercase, number, and special character")
        setIsFormValid(false);

    } else if (password && confirmPassword && password === confirmPassword) {
        setErrors("")
      setIsFormValid(true);
    } else {

        setErrors("")
      setIsFormValid(false);
    }
  }, [formValues]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({ ...formValues, [e.target.name]: e.target.value });
    setGeneralError("")
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userId) {
      setGeneralError("User ID is missing. Please restart the signup process.")
      return; 
    }

    if (!isFormValid) return
    setLoading(true)
    setGeneralError("")


    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    if (!API_URL) {
    console.error("API URL is not defined.");
    setGeneralError("Configuration error. Please contact support.")
    setLoading(false)
    return;
  }

  const requestUrl = `${API_URL}/users/${userId}/set-password/`;

    try {
      // API to complete signup (with role info attached)
      
      const res = await fetch(requestUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: formValues.password,
          confirm_password: formValues.confirmPassword
          }),
      })

    const data = await res.json()

    if (!res.ok) {
        const errorMsg = (data?.message || "Failed to set password, please try again")
        setGeneralError(errorMsg)
        return
    }

    sessionStorage.setItem("signup_email", email)
    router.push(`/signup/${role}/${userId}/verify-email`)

    } catch (error: any) {
        setGeneralError(error.message || "Unable to connect. Please try again.")
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex bg-[#424BE0] overflow-hidden">
      {/* Left Section (Form) */}
      <div className="flex-1 flex flex-col justify-center items-center rounded-tr-[60px] rounded-br-[60px] bg-white px-8 md:px-12">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center text-lg text-gray-600 mb-6"
          >
            <MdOutlineArrowBackIos className="mr-2 text-lg" /> Back
          </button>
          {/* Heading */}
          <h1 className="text-2xl md:text-3xl font-bold mb-1 text-[#252B42]">
            Signup as a {role}
          </h1>
          <p className="mb-6 text-gray-600">
            {role === "tasker"
              ? "Simplify your life by letting runners handle your errands"
              : "Start earning and completing tasks near you today"}
          </p>

          {/* Form */}
          {generalError && (
            <div className="mb-4">
              <p className="text-red-600 text-sm">{generalError}</p>
            </div>
          )}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={formValues.password}
                onChange={handleChange}
                className="border border-[#E6E5E5] focus:outline-none focus:ring-1 focus:ring-[#CBCCF8] rounded-lg px-4 py-3 w-full pr-10"
                required
                disabled={!userId}
                />
                </label>
              <span className="absolute right-6 top-8 cursor-pointer text-gray-500" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <AiOutlineEye size={20} />
                ) : (
                     <RxEyeClosed size={20} />
                    )}
              </span>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              <input
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formValues.confirmPassword}
                onChange={handleChange}
                className="border border-[#E6E5E5] focus:outline-none focus:ring-1 focus:ring-[#CBCCF8] rounded-lg px-4 py-3 w-full"
                required
                disabled={!userId}
                />
                </label>
              <span className="absolute right-6 top-8 cursor-pointer text-gray-500" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? (
                    <AiOutlineEye size={20} />  
                  ) : (
                    <RxEyeClosed size={20} />
                )}
              </span>

              {errors && <p className="text-red-500 text-sm mt-1">{errors}</p>}
            </div>

            {/* Continue Button */}
            <button
              type="submit"
              className={`w-full py-3 rounded-lg font-semibold transition ${
                isFormValid && !loading && userId
                  ? "bg-[#424BE0] text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              disabled={!isFormValid || loading || !userId}
            >
              {loading ? "Processing..." : "Continue"}
            </button>
          </form>

          {/* OR Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-300" />
            <span className="mx-4 text-gray-500">Or</span>
            <div className="flex-1 border-t border-gray-300" />
          </div>

          {/* Social Auth Buttons */}
          <div className="flex flex-col items-center w-full mt-4">
          <button className="flex items-center justify-center w-4/5 py-3 mb-3 border border-[#CBCCF8] text-[#979797] rounded-lg hover:bg-gray-50">
            <FcGoogle className="text-xl mr-2" />
            Continue with Google
          </button>
          <button className="flex items-center justify-center w-4/5 py-3 border border-[#CBCCF8] text-[#979797] rounded-lg hover:bg-gray-50">
            <FaApple className="text-xl mr-2" />
            Continue with Apple
          </button>
          </div>
        </div>
      </div>

      {/* Right Section (Illustration) */}
      <div className="hidden md:flex flex-1 items-center justify-center text-center px-8">
        <div>
         <h2 className="text-white text-2xl md:text-3xl font-semibold mb-6 max-w-lg">
            {role === "tasker"
              ? "Whatever your errand is,\n Errand Tribe's got you \n covered!"
              : "Earn with every errand! safe,\n seamless, and rewarding \n with Errand Tribe."}
        </h2>
        <Image
            src={role === "tasker" ? "/tasker-illustration.png" : "/runner-illustration.png"}
            alt={role === "tasker" ? "Tasker Illustration" : "Runner Illustration"}
            width={400}
            height={400}
            className="mx-auto"
         />
        </div>
      </div>
    </div>
  );
    }



