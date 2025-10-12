"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import { useRouter } from "next/navigation";

type SignupFormProps = {
  role: "tasker" | "runner";
}

type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

type FormErrors = {
  email:string
  phone:string
}


export default function SignupForm({ role }: SignupFormProps) {
  const [loading, setLoading] = useState<boolean>(false)
  const [generalError, setGeneralError] = useState<string>("")
  const [isFormValid, setIsFormValid] = useState<boolean>(false)
  const router = useRouter()


  // Track form values
  const [formValues, setFormValues] = useState<FormValues>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const [errors, setErrors] = useState<FormErrors>({
    email: "",
    phone: "",
  });

  // Validation regex patterns
  const validateEmail = (email: string): boolean => 
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const validatePhone = (phone: string): boolean => {
  // Nigerian format: 080..., 070..., 090..., 081..., or +234
  const nigeriaRegex = /^(?:\+234|0)[789][01]\d{8}$/;

  // Generic international E.164 format: + followed by 1–15 digits
  const internationalRegex = /^\+?[1-9]\d{1,14}$/;

  return nigeriaRegex.test(phone) || internationalRegex.test(phone);
};


  // Update form validity whenever inputs change
  useEffect(() => {
    const { firstName, lastName, email, phone } = formValues;
    if (firstName && lastName && email && phone) {
      setIsFormValid(true);
    } else {
      setIsFormValid(false);
    }
  }, [formValues]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
     setFormValues((prev) => ({ ...prev, [name]: value }));

    // Validate email
    if (name === "email") {
      setErrors((prev) => ({
        ...prev,
        email: validateEmail(value) ? "" : "Enter a valid email",
      }))
    }

    // Validate phone
    if (name === "phone") {
      setErrors((prev) => ({
        ...prev,
        phone: validatePhone(value) ? "" : "Invalid phone number",
      }))
    }
  }

  // Update form validity whenever errors change
  useEffect(() => {
    const {firstName, lastName, email, phone} = formValues
    const noErrors = !errors.email && !errors.phone

    if (firstName && lastName && email && phone && noErrors) {
      setIsFormValid(true)
    } else {
      setIsFormValid(false)
    }
  }, [formValues, errors])

  const API_URL = process.env.NEXT_PUBLIC_API_URL

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isFormValid) return; // prevent submit if invalid
    setLoading(true);
    setGeneralError ("")

    try {
      const payload = {
        first_name: formValues.firstName,
        last_name: formValues.lastName,
        email: formValues.email,
        phone_number: formValues.phone,
        role: role.toLowerCase(), 
      }

      const response = await fetch(`${API_URL}/auth/signup/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.errors) {
          setErrors((prev) => ({
            ...prev,
            email: data.errors.email || "",
            phone: data.errors.phone || "",
          }))
        } else {
          setGeneralError(data.message || "Signup failed. Please try again.")
        }
        return
      }
      
      const userId = data.user_id
      router.push(`/signup/${role}/${userId}/create-password?email=${encodeURIComponent(formValues.email)}`)
    } catch (err) {
      console.error(err);
      setGeneralError("Unable to connect. Please try again.")
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-screen flex overflow-hidden bg-[#424BE0]">
      {/* Left Section (Form) */}
      <div className="flex-1 flex flex-col justify-center items-center rounded-tr-[60px] rounded-br-[60px] bg-white px-8 md:px-16 overflow-hidden">
        <div className="w-full max-w-md ">
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
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                <input
                  name="firstName"
                  type="text"
                  value={formValues.firstName}
                  onChange={handleChange}
                  autoComplete="given-name"
                  className="border border-[#E6E5E5] focus:outline-none focus:ring-1 focus:ring-[#CBCCF8] rounded-lg px-4 py-3 w-full"
                  required
                  />
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                <input
                  name="lastName"
                  type="text"
                  value={formValues.lastName}
                  onChange={handleChange}
                  autoComplete="family-name"
                  className="border border-[#E6E5E5] focus:outline-none focus:ring-1 focus:ring-[#CBCCF8]  rounded-lg px-4 py-3 w-full"
                  required
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              <input
                name="email"
                type="email"
                value={formValues.email}
                onChange={handleChange}
                autoComplete="email"
                className="border border-[#E6E5E5] focus:outline-none focus:ring-1 focus:ring-[#CBCCF8] rounded-lg px-4 py-3 w-full"
                required
                />
              </label>
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              <input
                name="phone"
                type="tel"
                value={formValues.phone}
                onChange={handleChange}
                autoComplete="tel"
                className="border border-[#E6E5E5] focus:outline-none focus:ring-1 focus:ring-[#CBCCF8] rounded-lg px-4 py-3 w-full"
                required
                />
                </label>
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>

            {/* Continue Button */}
            <button
              type="submit"
              className={`w-full py-3 rounded-lg font-semibold transition ${
                isFormValid && !loading
                  ? "bg-[#424BE0] text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              disabled={!isFormValid || loading}
            >
              {loading ? "Signing up..." : `Continue as ${role}`}
            </button>
            {generalError && (
              <p className="text-red-500 text-sm text-center mt-2">{generalError}</p>
            )}
          </form>

          {/* OR Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-300" />
            <span className="mx-4 text-gray-500">Or</span>
            <div className="flex-1 border-t border-gray-300" />
          </div>

          {/* Social Auth Buttons */}
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
        <p className="mt-4 text-center text-sm text-gray-600">Already have an account?{" "} <a href="/login" className="text-[#424BE0] font-medium hover:underline">Log in</a></p>
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
            className="mx-auto" priority
          />

        </div>
      </div>
    </div>
  );
}
