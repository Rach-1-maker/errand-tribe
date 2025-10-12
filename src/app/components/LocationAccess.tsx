"use client";

import { useState } from "react";
import { useRouter} from "next/navigation";
import Image from "next/image";
import { MdOutlineArrowBackIos } from "react-icons/md";
import { IoIosArrowDown } from "react-icons/io";

interface LocationAccessProps{
  role: "tasker" | "runner"
  userId: string
}

export default function LocationPermissionPage({role, userId}: LocationAccessProps) {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSelect = (option: string) => {
    setSelectedOption(option);
    setShowDropdown(false);
    setError("")
  };

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOption) {
      setError("Please select a location access option")
      return;
    }
    setLoading(true)
    setError("")

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL
      if (!API_URL) throw new Error("Configuration error")

      const response = await fetch(`${API_URL}/users/${userId}/location-permission/`, {
        method: "POST",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify({
          location_permission: selectedOption,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || "Failed to save location access")
      } 
      
      console.log("Routing to:",`/signup/${role}/${userId}/welcome-intro/`)
      router.push(`/signup/${role}/${userId}/welcome-intro/`)
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err.message || "Unable to save location access. Try again.")
    } finally {
      setLoading(false)
    }
  };

  return (
    <div className="h-screen flex bg-[#424BE0]">
      {/* Left Section (Form) */}
      <div className="flex-1 flex flex-col bg-white shadow-lg rounded-tr-[60px] rounded-br-[60px] px-8 justify-center">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 mb-24 hover:text-gray-800 mt-4 "
        >
          <MdOutlineArrowBackIos className="mr-2 ml-16" /> Back
        </button>

        {/* Heading */}
        <h1 className="text-2xl md:text-3xl font-bold ml-16 text-gray-800 mb-4">
          Enable Location
        </h1>
        <p className="text-gray-500 mb-8 text-sm ml-16 max-w-md ">
          {role === "tasker"
          ? "Help taskers find you and get accurate delivery estimates"
          : "Allow Errand Tribe to access your location for better matching and accurate delivery."
          }
        </p>

        {/* Form */}
        <form onSubmit={handleContinue} className="space-y-6">
          <div className="ml-16">
            <label className="block text-gray-700 font-medium mb-4">
              Location Access
            </label>

            {/* Dropdown Field */}
            <div
              onClick={() => setShowDropdown((prev) => !prev)}
              className="border border-gray-300 text-sm rounded-lg p-3 flex items-center justify-between cursor-pointer w-[80%] hover:border-[#424BE0] transition focus:ring-2 focus:ring-[#424BE0] focus:outline-none"
            >
              <span className={selectedOption ? "text-[#424BE0]" : "text-gray-400"}>
                {selectedOption === "while_using_app"
                ? "While Using App"
                : selectedOption === "always"
                ? "Always"
                : "While Using App"}
              </span>
              <IoIosArrowDown
                className={`text-2xl transition-transform text-[#93a1b1] ${
                  showDropdown ? "rotate-180" : "rotate-0"
                }`}
              />
            </div>

            {/* Dropdown Options */}
            {showDropdown && (
              <div className={`absolute left-16 mt-1 w-[80%] bg-white border border-gray-200 rounded-lg shadow-sm transition-all duration-300 overflow-hidden z-10 ${
                showDropdown ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
              }`}>
                <div
                  onClick={() => handleSelect("while_using_app")}
                  className="p-2 hover:bg-gray-100 cursor-pointer text-gray-700"
                >
                  While Using App
                </div>
                <div
                  onClick={() => handleSelect("always")}
                  className="p-2 hover:bg-[#EFF0FD] cursor-pointer text-gray-700"
                >
                  Always
                </div>
              </div>
            )}
            {error && (
            <p className="text-red-500 text-sm ml-16">{error}</p>
          )}
          </div>


          {/* Continue Button */}
          <button
            type="submit"
            disabled={!selectedOption || loading}
            className={`py-3 rounded-lg font-semibold transition w-[75%] ml-16 mt-20 ${
              selectedOption
                ? "bg-[#424BE0] text-white hover:bg-indigo-700"
                : "bg-[#E0E0E0] text-white cursor-not-allowed"
            }`}
          >
            {loading ? "Processing..." : "Continue"}
          </button>
        </form>
      </div>

      {/* Right Section (Illustration) */}
      <div className="hidden md:flex flex-1 bg-[#424BE0] items-center justify-center text-center px-8">
        <div>
          <h2 className="text-white text-2xl md:text-3xl font-semibold mb-6 max-w-lg leading-tight whitespace-pre-line">
            {role === "tasker"
              ? "Whatever your errand is,\n Errand Tribe's got you \n covered!"
              : "Earn with every errand! Safe,\n seamless, and rewarding \n with Errand Tribe."}
          </h2>
          <Image
            src="/location-access.png"
            alt="Location Access Illustration"
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
