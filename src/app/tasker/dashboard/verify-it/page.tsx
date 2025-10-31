// app/tasker/dashboard/verify-it/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import SideBar from "@/app/components/SideBar";
import TopBar from "@/app/components/TopBar";
import { MdClear } from "react-icons/md";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { VerifyItTaskData } from "@/app/types/task";
import { useTaskStorage } from "@/app/hooks/useTaskStorage";
import { useUser } from "@/app/context/UserContext";
import { TokenManager } from "@/app/utils/tokenUtils";

type FormStep = "title" | "verificationType" | "location" | "details1" | "details2" | "price";

interface VerifyFormData {
  title: string;
  startDate: Date | null;
  deadline: Date | null;
  time: string;
  location: string;
  verificationType: string;
  verificationTypeOther: string;
  taskDescription: string;
  afterCompletion: string[];
  afterCompletionOther: string;
  shouldSpeak: "yes" | "no" | "";
  contactName: string;
  contactPhone: string;
  savePhone: boolean;
  price: number;
  imagePreview?: string | null
}

export default function VerifyItPage() {
  const router = useRouter();
  const { saveTaskToStorage } = useTaskStorage();
  const { userData } = useUser();

  const [currentStep, setCurrentStep] = useState<FormStep>("title");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [formData, setFormData] = useState<VerifyFormData>({
    title: "",
    startDate: null,
    deadline: null,
    time: "",
    location: "",
    verificationType: "",
    verificationTypeOther: "",
    taskDescription: "",
    afterCompletion: [],
    afterCompletionOther: "",
    shouldSpeak: "",
    contactName: "",
    contactPhone: "",
    savePhone: false,
    price: 25000,
  });

  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showDeadlineCalendar, setShowDeadlineCalendar] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPosting, setIsPosting] = useState(false);

  // Helper functions
  const handleField = (field: keyof VerifyFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const toggleAfterCompletion = (value: string) => {
    setFormData((prev) => {
      const exists = prev.afterCompletion.includes(value);
      const next = exists
        ? prev.afterCompletion.filter((v) => v !== value)
        : [...prev.afterCompletion, value];
      return { ...prev, afterCompletion: next };
    });
  };

  const quickSelectStart = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    handleField("startDate", d);
  };

  const handleUseCurrentLocation = async () => {
  setLoadingLocation(true);
  if (!navigator.geolocation) {
    setErrors((p) => ({ ...p, location: "Geolocation not supported by your browser." }));
    setLoadingLocation(false);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords;

      try {
        // Fetch human-readable address from coordinates
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
        const data = await res.json();
        const readableAddress = data.display_name || `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`;
        handleField("location", readableAddress);
      } catch (err) {
        handleField("location", `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
      } finally {
        setLoadingLocation(false);
      }
    },
    () => {
      setErrors((p) => ({ ...p, location: "Unable to retrieve your location." }));
      setLoadingLocation(false);
    }
  );
};


  // Validation
  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    switch (currentStep) {
      case "title":
        if (!formData.title) newErrors.title = "Title is required";
        if (!formData.startDate) newErrors.startDate = "Start date is required";
        if (!formData.deadline) newErrors.deadline = "Deadline is required";
        if (!formData.time) newErrors.time = "Time is required";
        break;
      case "verificationType":
        if (!formData.verificationType) newErrors.verificationType = "Please select verification type";
        if (formData.verificationType === "others" && !formData.verificationTypeOther) {
          newErrors.verificationTypeOther = "Please specify verification type";
        }
        break;
      case "location":
        if (!formData.location) newErrors.location = "Location is required";
        break;
      case "details1":
        if (!formData.taskDescription) newErrors.taskDescription = "Task description is required";
        if (formData.afterCompletion.length === 0) newErrors.afterCompletion = "Select at least one completion action";
        if (formData.afterCompletion.includes("others") && !formData.afterCompletionOther) {
          newErrors.afterCompletionOther = "Please specify other action";
        }
        break;
      case "details2":
        if (!formData.shouldSpeak) newErrors.shouldSpeak = "Please specify if runner should speak to anyone";
        if (!formData.contactPhone) newErrors.contactPhone = "Phone number is required";
        break;
      case "price":
        if (!formData.price || formData.price < 25000) newErrors.price = "Choose a valid price";
        break;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const next = () => {
    if (!validateStep()) return;
    const order: FormStep[] = ["title", "verificationType", "location", "details1", "details2", "price"];
    const idx = order.indexOf(currentStep);
    if (idx < order.length - 1) setCurrentStep(order[idx + 1]);
    else handleSubmit();
  };

  const prev = () => {
    const order: FormStep[] = ["title", "verificationType", "location", "details1", "details2", "price"];
    const idx = order.indexOf(currentStep);
    if (idx > 0) setCurrentStep(order[idx - 1]);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setIsPosting(true);

    try {
      // Get authentication token
      let token = TokenManager.getAccessToken();

      if (token && TokenManager.isTokenExpired(token)) {
        console.log("🔐 Token expired, attempting refresh...");
        const newToken = await TokenManager.refreshAccessToken();
        if (newToken) {
          token = newToken;
          console.log("🔐 Token refreshed successfully");
        } else {
          throw new Error("Session expired. Please log in again.");
        }
      }

      if (!token) {
        throw new Error("No authentication token found");
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      if (!API_URL) throw new Error("API URL not configured");

      const payload = {
        title: formData.title,
        start_date: formData.startDate ? formData.startDate.toISOString().split("T")[0] : "",
        end_date: formData.deadline ? formData.deadline.toISOString().split("T")[0] : "",
        time: formData.time,
        location: formData.location,
        verification_type: formData.verificationType,
        verification_type_other: formData.verificationTypeOther,
        task_description: formData.taskDescription,
        after_completion: formData.afterCompletion,
        after_completion_other: formData.afterCompletionOther,
        should_speak: formData.shouldSpeak,
        contact_name: formData.contactName,
        contact_phone: formData.contactPhone,
        save_phone: formData.savePhone,
        price: formData.price,
      };

      const response = await fetch(`${API_URL}/api/verification-tasks/`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error("API Error:", data);
        if (response.status === 401) {
          throw new Error("Authentication failed.");
        }
        throw new Error(data.detail || data.message || "Failed to create verification task");
      }

      // ✅ Create the task data for storage
      const taskData: VerifyItTaskData = {
        id: data.id || `task-${Date.now()}`,
        type: "Verify It",
        title: formData.title,
        location: formData.location,
        deadline: formData.deadline!,
        price: formData.price,
        status: "posted",
        createdAt: new Date().toISOString(),
        startDate: formData.startDate || null,
        time: formData.time,
        description: formData.taskDescription,
        verificationType: formData.verificationType,
        verificationTypeOther: formData.verificationTypeOther,
        taskDescription: formData.taskDescription,
        afterCompletion: formData.afterCompletion,
        afterCompletionOther: formData.afterCompletionOther,
        shouldSpeak: formData.shouldSpeak,
        contactName: formData.contactName,
        contactPhone: formData.contactPhone,
        imagePreview: formData.imagePreview || undefined,
      };

      // ✅ Use the custom hook to save the task
      const saveSuccess = saveTaskToStorage(taskData);
      
      if (saveSuccess) {
        console.log("✅ Verify It task successfully saved to user-specific storage");
      } else {
        console.warn("⚠️ Failed to save task to storage, using fallback");
        // Fallback to old method
        localStorage.setItem("lastPostedTask", JSON.stringify(taskData));
      }

      toast.success("Verification task created successfully!");
      setTimeout(() => router.push("/tasker/dashboard/[id]"), 1200);

    } catch (error: any) {
      console.error("Submit error:", error);
      if (error instanceof Error) {
        toast.error(error.message || "Failed to create task. Please ");
        
        if (error.message.includes("authentication") || error.message.includes("session")) {
          setTimeout(() => router.push("/login"), 2000);
        }
      } else {
        toast.error("Failed to create task. Please try again.");
      }
    } finally {
      setIsPosting(false);
    }
  };

  const getNextButtonText = () => (currentStep === "price" ? "Post Task" : "Next");

  // Mini sidebar steps
  const miniSteps = [
    { id: "title", label: "Time & Date" },
    { id: "verificationType", label: "Verification Type" },
    { id: "location", label: "Location" },
    { id: "details1", label: "Details" },
    { id: "price", label: "Fix Price" },
  ];

  return (
    <div className="h-screen flex bg-[#F2F2FD] overflow-hidden">
      {/* Sidebar (desktop) */}
      <div className="hidden md:flex h-screen">
        <SideBar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
          <div className="fixed top-0 left-0 h-screen w-64 bg-white shadow-lg z-50 md:hidden">
            <SideBar onClose={() => setIsSidebarOpen(false)} />
          </div>
        </>
      )}

      <div className="flex-1 flex flex-col h-screen w-full">
        {/* TopBar with mobile menu toggle */}
        <div className="sticky top-0 z-10">
          <TopBar onMenuClick={() => setIsSidebarOpen(true)} />
        </div>

        <div className="flex flex-1 flex-col lg:flex-row p-4 lg:p-6 gap-4 lg:gap-6 ">
          {/* Mini Sidebar - Made responsive */}
          <aside className="w-full lg:w-72 bg-white rounded-3xl shadow-sm p-4 lg:p-6 h-fit">
            <div className="flex items-center gap-3 mb-6">
              <Image src="/verify-task.svg" alt="Verify It" width={32} height={32} className="lg:w-11 lg:h-11" />
              <h3 className="text-gray-800 text-base lg:text-lg">Verify It</h3>
            </div>

            <nav className="space-y-2 lg:space-y-3">
              {miniSteps.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setCurrentStep(s.id as FormStep)}
                  className={`w-full text-left p-2 lg:p-3 rounded-xl text-sm lg:text-base transition ${
                    currentStep === s.id
                      ? "bg-[#EFF0FD] text-[#424BE0] font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content - Made responsive */}
          <div className="flex-1 cursor-pointer flex justify-center relative flex-col">
            {/* Close Button - Made responsive */}
            <button
              onClick={() => router.push("/tasker/dashboard/[id]")}
              className="absolute cursor-pointer top-2 lg:top-4 right-2 lg:right-4 z-50 text-black hover:scale-105 transition"
              aria-label="Close"
            >
              <MdClear className="w-6 h-6 lg:w-9 lg:h-9 bg-white rounded-full p-1 shadow" />
            </button>
            
            <div className="w-full max-w-lg mx-auto mb-28">
              {/* Step 1: Title & Date - Made responsive */}
              {currentStep === "title" && (
                <section className="bg-white rounded-2xl shadow-sm p-4 lg:p-6">
                  <h2 className="text-xl lg:text-2xl text-center font-semibold text-gray-800 mb-4 lg:mb-6">
                    Let's Start With The Basics
                  </h2>

                  {/* Title */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Errand Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleField("title", e.target.value)}
                      placeholder="e.g., Verify business address"
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#424BE0] focus:outline-none ${
                        errors.title ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                  </div>

                  {/* When do you need this done */}
                  <div className="relative mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">When do you need this done? *</label>
                    <button
                      onClick={() => setShowStartCalendar(!showStartCalendar)}
                      className={`w-full cursor-pointer text-left px-3 py-2 text-sm border rounded-lg bg-white ${
                        errors.startDate ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      {formData.startDate ? formData.startDate.toDateString() : "Select date"}
                    </button>
                    {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
                    {showStartCalendar && (
                      <div className="absolute z-30 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-2">
                        <DayPicker
                          mode="single"
                          selected={formData.startDate ?? undefined}
                          onSelect={(date) => {
                            handleField("startDate", date ?? null);
                            setShowStartCalendar(false);
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Deadline + Time - Made responsive */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="relative grid sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Deadline *</label>
                      <button
                        onClick={() => setShowDeadlineCalendar(!showDeadlineCalendar)}
                        className={`w-full cursor-pointer text-left px-3 py-2 text-sm border rounded-lg bg-white ${
                          errors.deadline ? "border-red-500" : "border-gray-300"
                        }`}
                      >
                        {formData.deadline ? formData.deadline.toDateString() : "Select deadline"}
                      </button>
                      {errors.deadline && <p className="text-red-500 text-sm mt-1">{errors.deadline}</p>}
                      {showDeadlineCalendar && (
                        <div className="absolute z-30 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-2">
                          <DayPicker
                            mode="single"
                            selected={formData.deadline ?? undefined}
                            onSelect={(date) => {
                              handleField("deadline", date ?? null);
                              setShowDeadlineCalendar(false);
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="grid">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Time *</label>
                      <input
                        type="time"
                        value={formData.time}
                        onChange={(e) => handleField("time", e.target.value)}
                        className={`w-full px-3 py-2 border text-sm rounded-lg focus:ring-2 focus:ring-[#424BE0] ${
                          errors.time ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.time && <p className="text-red-500 text-sm mt-1">{errors.time}</p>}
                    </div>
                  </div>

                  {/* Quick Select */}
                  <div className="mt-4 flex gap-2 flex-wrap">
                    {[
                      { label: "Today", days: 0 },
                      { label: "Tomorrow", days: 1 }, 
                      { label: "Next Week", days: 7 }
                    ].map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => quickSelectStart(opt.days)}
                        className="px-3 py-2 cursor-pointer border rounded-lg text-sm text-[#424BE0] hover:bg-[#EFF0FD] border-gray-300"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-center mt-6">
                    <button onClick={next} className="w-full cursor-pointer sm:w-auto px-8 sm:px-40 py-2 rounded-lg font-medium bg-[#424BE0] text-white">
                      Next
                    </button>
                  </div>
                </section>
              )}

              {/* Step 2: Verification Type - Made responsive */}
              {currentStep === "verificationType" && (
                <section className="bg-white rounded-2xl shadow-sm p-4 lg:p-6 space-y-6">
                  <h2 className="text-xl lg:text-2xl font-semibold text-gray-800 mb-4 text-center">Verification Type</h2>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      What kind of verification is it?
                    </label>

                    <div className="flex flex-col sm:flex-row gap-3">
                      {[
                        { value: "address", label: "Address Check" },
                        { value: "document", label: "Document Verification" },
                        { value: "other", label: "Others" },
                      ].map((type) => (
                        <button
                          key={type.value}
                          onClick={() => handleField("verificationType", type.value)}
                          className={`flex-1 cursor-pointer px-4 py-3 rounded-lg text-sm text-center border-2 transition-colors ${
                            formData.verificationType === type.value
                              ? "bg-[#424BE0] text-white"
                              : "border-gray-200 hover:border-gray-300 text-[#424BE0]"
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {formData.verificationType === "others" && (
                    <input
                      type="text"
                      value={formData.verificationTypeOther}
                      onChange={(e) => handleField("verificationTypeOther", e.target.value)}
                      placeholder="Please specify verification type"
                      className={`w-full px-3 py-2 border rounded-lg text-sm ${
                        errors.verificationTypeOther ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                  )}

                  {errors.verificationType && (
                    <p className="text-red-500 text-sm text-center">{errors.verificationType}</p>
                  )}

                  <div className="flex justify-between gap-4">
                    <button
                      onClick={prev}
                      className="flex-1 cursor-pointer py-2 rounded-lg bg-[#EFF0FD] text-[#424BE0]"
                    >
                      Back
                    </button>
                    <button
                      onClick={next}
                      className="flex-1 cursor-pointer py-2 rounded-lg bg-[#424BE0] text-white"
                    >
                      Next
                    </button>
                  </div>
                </section>
              )}

              {/* Step 3: Location - Made responsive */}
              {currentStep === "location" && (
                <section className="bg-white rounded-2xl shadow-sm p-4 lg:p-6 w-full">
                  <h2 className="text-xl lg:text-2xl font-semibold text-gray-800 mb-4 lg:mb-6 text-center">Tell Us Where</h2>

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What's the exact location for this verification?
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleField("location", e.target.value)}
                    placeholder="📍 Enter address"
                    className={`w-full px-3 py-2 border text-sm rounded-lg focus:ring-2 focus:ring-[#424BE0] focus:outline-none ${
                      errors.location ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}

                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    className="flex items-center cursor-pointer gap-2 mt-3 text-green-500 text-sm hover:underline"
                  >
                    {loadingLocation ? "Fetching current location..." : "Use your current location"}
                  </button>

                  <div className="flex justify-between mt-6 gap-4">
                    <button onClick={prev} className="flex-1 cursor-pointer py-2 rounded-lg bg-[#EFF0FD] text-[#424BE0] text-sm lg:text-base">
                      Back
                    </button>
                    <button onClick={next} className="flex-1 cursor-pointer py-2 rounded-lg bg-[#424BE0] text-white text-sm lg:text-base">
                      Next
                    </button>
                  </div>
                </section>
              )}

              {/* Step 4: Details 1 - Made responsive */}
              {currentStep === "details1" && (
                <section className="bg-white rounded-2xl shadow-sm p-4 lg:p-6">
                  <h2 className="text-xl lg:text-2xl font-semibold text-gray-800 mb-4 lg:mb-6 text-center">Provide More Details</h2>

                  {/* Task Description */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What do you want the runner to do at the location? *
                    </label>
                    <textarea
                      value={formData.taskDescription}
                      onChange={(e) => handleField("taskDescription", e.target.value)}
                      placeholder="Describe exactly what the runner should verify..."
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-lg text-sm resize-none ${
                        errors.taskDescription ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.taskDescription && (
                      <p className="text-red-500 text-sm mt-1">{errors.taskDescription}</p>
                    )}
                  </div>

                  {/* After Completion - Made responsive */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      What should runner do after completion? *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { key: "provide photo", label: "Provide Photo" },
                        { key: "provide video", label: "Provide Video" },
                        { key: "scan document", label: "Scan Document" },
                        { key: "others", label: "Others" },
                      ].map((opt) => (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => toggleAfterCompletion(opt.key)}
                          className={`px-2 cursor-pointer sm:px-4 py-2 rounded-lg border text-sm transition-colors ${
                            formData.afterCompletion.includes(opt.key)
                              ? "bg-[#424BE0] text-white"
                              : "bg-white text-[#424BE0] border-gray-300 hover:border-gray-400"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {errors.afterCompletion && (
                      <p className="text-red-500 text-sm mt-2">{errors.afterCompletion}</p>
                    )}
                  </div>

                  {/* Specify Others Input */}
                  {formData.afterCompletion.includes("others") && (
                    <div className="mb-6">
                      <input
                        type="text"
                        value={formData.afterCompletionOther}
                        onChange={(e) => handleField("afterCompletionOther", e.target.value)}
                        placeholder="Please specify other action"
                        className={`w-full px-3 py-2 border rounded-lg text-sm ${
                          errors.afterCompletionOther ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.afterCompletionOther && (
                        <p className="text-red-500 text-sm mt-1">{errors.afterCompletionOther}</p>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between mt-6 gap-4">
                    <button onClick={prev} className="flex-1 cursor-pointer py-2 rounded-lg bg-[#EFF0FD] text-[#424BE0] text-sm lg:text-base">
                      Back
                    </button>
                    <button onClick={next} className="flex-1 cursor-pointer py-2 rounded-lg bg-[#424BE0] text-white text-sm lg:text-base">
                      Continue
                    </button>
                  </div>
                </section>
              )}

              {/* Step 4: Details 2 - Made responsive */}
              {currentStep === "details2" && (
                <section className="bg-white rounded-2xl shadow-sm p-4 lg:p-6">
                  <h2 className="text-xl lg:text-2xl font-semibold text-gray-800 mb-4 lg:mb-6 text-center">Contact Information</h2>

                  {/* Should Speak to Anyone */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Should the runner speak to anyone on site? *
                    </label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleField("shouldSpeak", "yes")}
                        className={`flex-1 px-4 cursor-pointer sm:px-6 py-2 rounded-lg border text-sm ${
                          formData.shouldSpeak === "yes" 
                            ? "bg-[#424BE0] text-white border-[#424BE0]" 
                            : "bg-white text-[#424BE0] border-gray-300"
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => handleField("shouldSpeak", "no")}
                        className={`flex-1 px-4 cursor-pointer sm:px-6 py-2 rounded-lg border text-sm ${
                          formData.shouldSpeak === "no" 
                            ? "bg-[#424BE0] text-white border-[#424BE0]" 
                            : "bg-white text-[#424BE0] border-gray-300"
                        }`}
                      >
                        No
                      </button>
                    </div>
                    {errors.shouldSpeak && (
                      <p className="text-red-500 text-sm mt-2">{errors.shouldSpeak}</p>
                    )}
                  </div>

                  {/* Contact Name */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.contactName}
                      onChange={(e) => handleField("contactName", e.target.value)}
                      placeholder="Enter contact name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>

                  {/* Phone Input - Fixed */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number to Contact *
                    </label>
                    <PhoneInput
                      country={"ng"}
                      value={formData.contactPhone}
                      onChange={(phone) => handleField("contactPhone", phone)}
                      inputProps={{
                        required: true,
                        name: "phone",
                      }}
                      inputClass="!w-full !text-sm !rounded-lg !border-gray-300 !py-3 !px-12 !h-auto"
                      buttonClass="!border-gray-300 !rounded-l-lg"
                      containerClass="!w-full"
                      dropdownClass="!border-gray-300 !rounded-lg"
                    />
                    {errors.contactPhone && <p className="text-red-500 text-sm mt-1">{errors.contactPhone}</p>}
                  </div>

                  {/* Save Number Checkbox */}
                  <div className="flex items-center mb-6">
                    <input
                      type="checkbox"
                      id="saveNumber"
                      checked={formData.savePhone}
                      onChange={(e) => handleField("savePhone", e.target.checked)}
                      className="w-4 h-4 text-[#424BE0] bg-gray-100 border-gray-300 rounded focus:ring-[#424BE0] focus:ring-2"
                    />
                    <label htmlFor="saveNumber" className="ml-2 text-sm text-gray-700">
                      Save number for next time
                    </label>
                  </div>

                  <div className="flex justify-between mt-6 gap-4">
                    <button onClick={prev} className="flex-1 cursor-pointer py-2 rounded-lg bg-[#EFF0FD] text-[#424BE0] text-sm lg:text-base">
                      Back
                    </button>
                    <button onClick={next} className="flex-1 cursor-pointer py-2 rounded-lg bg-[#424BE0] text-white text-sm lg:text-base">
                      Continue
                    </button>
                  </div>
                </section>
              )}

              {/* Step 5: Price - Made responsive */}
              {currentStep === "price" && (
                <section className="bg-white rounded-2xl shadow-sm p-4 lg:p-6">
                  <h2 className="text-xl lg:text-2xl font-semibold text-gray-800 mb-4 text-center">Fix Price Range</h2>

                  <div className="text-center mb-4 lg:mb-6">
                    <h3 className="text-lg lg:text-xl font-bold text-[#424BE0]">₦{formData.price.toLocaleString()}</h3>
                  </div>

                  <input
                    type="range"
                    min={25000}
                    max={50000}
                    step={1000}
                    value={formData.price}
                    onChange={(e) => handleField("price", Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-2">
                    <span>₦25,000</span>
                    <span>₦50,000</span>
                  </div>
                  {errors.price && <p className="text-red-500 text-sm mt-2">{errors.price}</p>}

                  <div className="flex justify-between mt-6 gap-4">
                    <button onClick={prev} className="flex-1 cursor-pointer py-2 rounded-lg bg-[#EFF0FD] text-[#424BE0] text-sm lg:text-base">
                      Back
                    </button>
                    <button 
                      onClick={handleSubmit} 
                      disabled={isPosting}
                      className="flex-1 py-2 cursor-pointer rounded-lg bg-[#424BE0] text-white text-sm lg:text-base disabled:opacity-50"
                    >
                      {isPosting ? "Posting..." : getNextButtonText()}
                    </button>
                  </div>
                </section>
              )}

              {/* Posting loader - Made responsive */}
              {isPosting && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                  <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8 w-[90%] max-w-[320px] text-center">
                    <div className="mb-4 animate-spin inline-block w-10 h-10 lg:w-12 lg:h-12 border-4 border-[#424BE0] border-t-transparent rounded-full" />
                    <h3 className="text-base lg:text-lg font-semibold mb-1">Posting your task...</h3>
                    <p className="text-xs lg:text-sm text-gray-500">This might take a few moments.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <ToastContainer position="top-right" autoClose={2500} hideProgressBar={false} />
      </div>
    </div>
  );
}