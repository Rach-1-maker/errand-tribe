"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MdOutlineArrowBackIos, MdOutlineClear } from "react-icons/md";
import { LiaRedoAltSolid } from "react-icons/lia";

interface ProfileUploadProps{
  role: "tasker" | "runner"
  userId: string


}

export default function ProfileUploadPage({role, userId}: ProfileUploadProps) {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setError("");
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError("Please upload a profile picture");
      return;
    }

    setLoading(true);
    setError("");

    try {
      
     const formData = new FormData()
     formData.append("profile_picture", file)
     formData.append("role", role)
     formData.append("userId", userId)

     const res = await fetch(`${API_URL}/users/${userId}/upload-picture/`, {
      method: "POST",
      body: formData
     })

     if(!res.ok) {
      const errorData = await res.json()
      throw new Error(errorData.message || "Upload failed")
     }

      // After successful upload
      router.push(`/signup/${role}/${userId}/location-access/`);
    } catch (err: any) {
      setError(err.message || "Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex bg-[#424BE0]">
      {/* Form Section */}
      <div className="flex-1 flex flex-col bg-white shadow-lg rounded-tr-[60px] rounded-br-[60px] px-8 justify-center">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 mb-6 hover:text-gray-800 mt-4"
        >
          <MdOutlineArrowBackIos className="mr-2 ml-16" /> Back
        </button>

        {/* Heading */}
        <h1 className="text-2xl md:text-3xl font-bold ml-16 text-gray-800 mb-2">
          Upload Picture
        </h1>
        <p className="text-gray-500 mb-6 text-sm ml-16">
          Let&apos;s add a profile picture to personalize your account
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Upload Document */}
          <div className="ml-24">
            <div className="border border-[#EFEFEF] rounded-xl p-6 w-[80%]">
              <label className="text-gray-700 font-medium block mb-4 pb-3 border-b border-[#EFEFEF]">
                Upload Picture
              </label>
              <div className="flex flex-col items-center">
                <div
                  className="border-2 bg-[#F6F7FE] border-dashed border-gray-300 rounded-xl px-6 py-14 w-full flex flex-col items-center justify-center cursor-pointer hover:border-[#424BE0] relative"
                  onClick={() => fileInputRef.current?.click()}
                >
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
                        Upload Profile
                      </p>
                      <span className="text-[#424BE0] cursor-pointer underline text-xs">
                        Click to Browse
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <LiaRedoAltSolid className="text-gray-500 text-2xl mb-2" />
                      <div className="flex items-center gap-2">
                        <p className="mt-3 text-gray-700 text-sm truncate max-w-[180px]">
                          {file.name}
                        </p>
                        <MdOutlineClear
                          className="text-red-500 text-xl mt-4 cursor-pointer flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile();
                          }}
                        />
                      </div>
                      <p className="text-gray-500 text-xs mt-2">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && <p className="text-red-500 text-sm ml-16">{error}</p>}

          {/* Continue Button */}
          <button
            type="submit"
            disabled={!file || loading}
            className={`py-3 rounded-lg font-semibold transition w-[75%] ml-18 mb-20 ${
              file && !loading
                ? "bg-[#424BE0] text-white hover:bg-indigo-700"
                : "bg-[#E0E0E0] text-white cursor-not-allowed"
            }`}
          >
            {loading ? "Uploading..." : "Continue"}
          </button>
        </form>
      </div>

      {/* Right Section (Illustration) */}
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