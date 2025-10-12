"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MdOutlineArrowBackIos } from "react-icons/md";

interface ErrandSelectionProps {
  role: string
  userId: string
}

export default function ErrandPreference({role, userId}: ErrandSelectionProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const errands = [
    { id: "local", label: "Local Errands", img: "/local-errands.png" },
    { id: "supermarket", label: "Supermarket Runs", img: "/supermarkets.png" },
    { id: "delivery", label: "Pickup & Delivery", img: "/pickup.png" },
    { id: "care", label: "Care Task", img: "/care.png" },
    { id: "verify", label: "Verify It", img: "/verifyIt.png" },
  ];

  const toggleSelection = (id: string) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (selected.length === 0) return
    setLoading(true)

    try {
      
    const userPreferences = {
      user_id: userId,
      role,
      preferences: selected,
    }

    localStorage.setItem("errand_preferences",
      JSON.stringify(userPreferences)
    )
    setTimeout(() => {
      if (role === "tasker") {
        router.push(`/dashboard`);
      } else {
        router.push(`/dashboard/`);
      }
      }, 1000)

      } catch(error) {
        console.error("Error saving preferences:", error)
      } finally {
        setLoading(false)
      }

  }
  return (
    <div className="h-screen flex flex-col md:flex-row bg-[#424BE0] overflow-hidden">
      {/* Left Section */}
      <div className="flex-1 bg-white rounded-tr-[70px] rounded-br-[70px] px-8 md:px-12 py-8 flex flex-col">
        {/* Back Navigation */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 ml-8"
        >
          <MdOutlineArrowBackIos className="text-lg" />
          <span>Back</span>
        </button>

        {/* Heading */}
        <h1 className="text-2xl font-semibold text-gray-900 mb-2 ml-8">
          Select Errand Preference
        </h1>
        <p className="text-gray-500 mb-8 text-sm ml-8">
          Choose the types of errands you're most likely to need help with.
        </p>

        {/* Errand Cards */}
        <div className="flex flex-col items-center gap-6 flex-grow">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full justify-items-center">
            {errands.slice(0, 3).map((errand) => (
              <label
                key={errand.id}
                className={`relative flex flex-col items-center p-4 rounded-xl cursor-pointer transition-transform hover:scale-105 ${
                  selected.includes(errand.id)
                    ? "ring-2 ring-[#424BE0] shadow-md"
                    : "shadow-sm"
                }`}
              >
                <div className="w-full flex items-start mb-2">
                  <input
                    type="checkbox"
                    value={errand.id}
                    checked={selected.includes(errand.id)}
                    onChange={() => toggleSelection(errand.id)}
                    className="w-3 h-3 accent-[#424BE0] cursor-pointer"
                  />
                </div>
                <Image
                  src={errand.img}
                  alt={errand.label}
                  width={180}
                  height={180}
                  className="rounded-md object-cover w-full h-24"
                />
                <div className="text-center mt-2 text-sm font-medium text-gray-700">
                  {errand.label}
                </div>
              </label>
            ))}
          </div>

          <div className="flex justify-center gap-6 w-full">
            {errands.slice(3).map((errand) => (
              <label
                key={errand.id}
                className={`relative flex flex-col items-center p-4 rounded-xl cursor-pointer transition-transform hover:scale-105 ${
                  selected.includes(errand.id)
                    ? "ring-2 ring-[#424BE0] shadow-md"
                    : "shadow-sm"
                }`}
              >
                <div className="w-full flex items-start mb-2">
                  <input
                    type="checkbox"
                    value={errand.id}
                    checked={selected.includes(errand.id)}
                    onChange={() => toggleSelection(errand.id)}
                    className="w-3 h-3 accent-[#424BE0] cursor-pointer"
                  />
                </div>
                <Image
                  src={errand.img}
                  alt={errand.label}
                  width={150}
                  height={150}
                  className="rounded-md object-cover w-full h-24"
                />
                <div className="text-center mt-2 text-sm font-medium text-gray-700">
                  {errand.label}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleSubmit}
          disabled={selected.length === 0 || loading}
          className={`mb-8 py-3 rounded-lg w-[80%] flex items-center justify-center gap-2 font-semibold transition ml-12 ${
            selected.length > 0
              ? "bg-[#424BE0] text-white hover:bg-indigo-700"
              : "bg-[#E0E0E0] text-gray-400 cursor-not-allowed"
          }`}
        >
          {loading ? (
            <>
              <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          "Continue"
        )}
      </button>
      </div>

      {/* Right Section */}
      <div className="hidden md:flex flex-1 items-center justify-center text-center px-8">
        <div>
          <h2 className="text-white text-2xl md:text-3xl font-semibold mb-6 max-w-lg leading-tight">
            Earn with every errand — safe, seamless, and rewarding with Errand
            Tribe.
          </h2>
          <Image
            src="/tasker-choice.png"
            alt="Errand preference selection"
            width={400}
            height={400}
            className="mx-auto"
          />
        </div>
      </div>
    </div>
  );
}
