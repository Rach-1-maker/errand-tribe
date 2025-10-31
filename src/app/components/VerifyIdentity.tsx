"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { verifyIdentity } from "../services/auth"
import { MdOutlineArrowBackIos, MdOutlineClear } from "react-icons/md";
import { IoIosArrowDown } from "react-icons/io";
import { LiaRedoAltSolid } from "react-icons/lia";

const countries = ["Nigeria", "Kenya", "Togo", "Ghana"];

interface VerifyIdentityProps{
  role: "tasker" | "runner"
  userId: string
}

export default function VerifyIdentityPage({role, userId}: VerifyIdentityProps) {
  const router = useRouter();
  const [email, setEmail] = useState("")
 

  const [country, setCountry] = useState("Nigeria")
  const [showCountries, setShowCountries] = useState(false)
  const [documentType, setDocumentType] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("")

  const fileInputRef = useRef<HTMLInputElement | null>(null)


  // Document options per country
  const documentOptions: Record<string, string[]> = {
    Nigeria: ["National ID", "Driver's License", "Passport"],
    Ghana: ["National ID", "Driver's License", "Passport"],
    Kenya: ["National ID", "Driver's License", "Passport", "Alien Card"],
    Togo: ["National ID", "Driver's License", "Passport", "Carte Nationale d'Identité"],
  };

  useEffect(() => {
      const storedEmail = sessionStorage.getItem("signup_email");
      if (storedEmail) {
        setEmail(storedEmail);
      }
    }, [])

  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
   const selected = e.target.files?.[0]
   if (selected) {
    setFile(selected)
   }
  };

  const removeFile = () => {
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentType || !file) {
      setError("Please select a document type and upload your document.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await verifyIdentity(email, role, userId, country, documentType, file );
      if (res.success) {
        setSuccess(res.message || "Identity verified successfully!");
        sessionStorage.removeItem("signup_email")
        router.push(`/signup/${role}/${userId}/upload-profile`);
      } else {
        setError(res.message || "Identity verification failed.");
      }
    } catch (err: any) {
      setError(err.message || "Network error.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="h-screen flex bg-[#424BE0] ">
      {/* Form Section */}
      <div className="flex-1 flex flex-col bg-white shadow-lg rounded-tr-[60px] rounded-br-[60px] px-8 justify-center ">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 mb-6 hover:text-gray-800 mt-4"
        >
          <MdOutlineArrowBackIos className="mr-2 ml-16" /> Back
        </button>

        {/* Heading */}
        <h1 className="text-2xl md:text-3xl font-bold ml-16 text-gray-800 mb-2">Verify Identity</h1>
        <p className="text-gray-500 mb-6 text-sm ml-16">
          Let&apos;s verify your identity to keep our community safe
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Country dropdown*/}
          <div className="relative">
            <label className="block text-gray-700 font-medium mb-2 ml-16">Country</label>
            <div onClick={() => setShowCountries((prev) => !prev)}
              className=" border ml-16 text-sm border-gray-300 text-gray-400 rounded-lg p-3 flex items-center justify-between cursor-pointer focus:ring-2 focus:ring-[#424BE0] focus:outline-none"
            >
              <span className="text-[#424BE0]">{country}</span>
              <IoIosArrowDown className={`transition-transform text-[#292D32] ${showCountries ? "rotate-180": "rotate-0"} text-xl`}/>
            </div>

            {showCountries && (
              <div className="absolute w-[90%] ml-16 bg-white border border-gray-200 rounded-lg mt-1 z-10 shadow-sm">
                {countries.map((c) => (
                <div
                key={c}
                onClick={() => {
                  setCountry(c)
                  setShowCountries(false)
                }}
                className={`p-2 hover:bg-gray-200 cursor-pointer transition ${
                  country === c
                  ? "text-[#424BE0] bg-[#F4FBFA]"
                  : "text-gray-700"
                }`}
                >
                  {c}
                </div>
              ))}
              </div>
            )}
          </div>

          {/* Document Type */}
          <div>
            <label className="block text-gray-700 font-medium mb-2 ml-16">Document type</label>
            <div className="space-y-2 ml-16">
              {documentOptions[country].map((doc) => (
                <label key={doc} className="flex items-center space-x-3 focus:ring-[#424BE0]">
                  <input
                    type="radio"
                    name="documentType"
                    value={doc}
                    checked={documentType === doc}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="h-4 w-4 border-gray-300"
                  />
                  <span className="text-gray-700 text-sm">{doc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Upload Document */}
          <label className="text-gray-700 font-medium ml-16">Upload Document</label>
          <div className="flex flex-col items-center">
            <div className="border-2 bg-[#F6F7FE] border-dashed border-gray-300 rounded-xl px-6 py-10 mt-2 w-[70%] flex flex-col items-center justify-center cursor-pointer hover:border-[#424BE0] relative" 
            onClick={() => fileInputRef.current?.click()}>
              {!file ? (
              <div className="flex flex-col items-center justify-center">
              <Image
                src="/upload-icon.png"
                alt="Upload"
                width={50}
                height={50}
                className="mb-1"
              />
              <p className="text-gray-500 text-center mb-1 text-xs">
                Upload document{" "} 
              </p>
                <span className="text-[#424BE0] cursor-pointer underline text-xs">Click to Browse</span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <LiaRedoAltSolid className="text-gray-500 text-2xl mb-2"/>
                  <div className="flex items-center gap-2">
                  <p className="mt-3 text-gray-700 text-sm truncate max-w-[180px]">{file.name}</p>
            
                  <MdOutlineClear 
                  className="text-red-500 text-xl mt-4 cursor-pointer flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFile()
                  }}
                  />
                  </div>
                  <p className="text-gray-500 text-xs mt-2">{(file.size/ 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                )}
              <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" />
            </div>
          </div>

          {/* Error / Success Messages */}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">{success}</p>}

          {/* Continue Button */}
          <button
            type="submit"
            disabled={loading}
            className={`py-3 rounded-lg font-semibold transition w-[80%] ml-16 ${
              !loading
                ? "bg-[#424BE0] text-white hover:bg-indigo-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {loading ? "Verifying..." : "Continue"}
          </button>
        </form>
      </div>

        <div className="hidden md:flex flex-1 bg-[#424BE0] items-center justify-center text-center px-8">
          <div>
            <h2 className="text-white text-2xl md:text-3xl font-semibold mb-6 max-w-lg leading-tight whitespace-pre-line">
              {role === "tasker"
                ? "Whatever your errand is,\n Errand Tribe's got you \n covered!"
                : "Earn with every errand! safe,\n seamless, and rewarding \n with Errand Tribe."}
            </h2>
            <Image
              src="/verify.png"
              alt="Verification Illustration"
              width={400}
              height={400}
              className="mx-auto"
            />
          </div>
        </div>
    </div>
  );
}
