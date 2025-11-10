"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import SideBar from "@/app/components/SideBar";
import TopBar from "@/app/components/TopBar";
import { MdClear } from "react-icons/md";
import { PlusIcon } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CareTaskData } from "@/app/types/task";
import { useTaskStorage } from "@/app/hooks/useTaskStorage";
import { useUser } from "@/app/context/UserContext";
import { TokenManager } from "@/app/utils/tokenUtils";

type FormStep = "title" | "location" | "details1" | "details2" | "frequency" | "price";

interface CareItemData {
  id: string;
 
}

interface CareFormData {
  title: string;
  startDate: Date | null;
  deadline: Date | null;
  time: string;
  location: string;
  // details step
  careType: string;
  whoFor: "me" | "family" | "friend" | "others" | "";
  sensitivities: string;
  arrivalRequest: string;
  afterCompletion: string[]; // e.g., ["photo", "video", "text", "others"]
  afterCompletionOther: string;
  imageFile?: File | null;
  imagePreview?: string | null;
  // frequency step
  frequency: "one-time" | "daily" | "weekly" | "";
  weeklyDays: string[]; // ["mon","tue"...]
  preferredRunner: string;
  // price
  price: number;
}

export default function CareTaskPage() {
  const router = useRouter();
  const { saveTaskToStorage } = useTaskStorage();
  const { userData } = useUser();

  const [currentStep, setCurrentStep] = useState<FormStep>("title");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [formData, setFormData] = useState<CareFormData>({
    title: "",
    startDate: null,
    deadline: null,
    time: "",
    location: "",
    careType: "",
    whoFor: "",
    sensitivities: "",
    arrivalRequest: "",
    afterCompletion: [],
    afterCompletionOther: "",
    imageFile: null,
    imagePreview: null,
    frequency: "",
    weeklyDays: [],
    preferredRunner: "",
    price: 25000,
  });

  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showDeadlineCalendar, setShowDeadlineCalendar] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPosting, setIsPosting] = useState(false);

  // helpers
  const handleField = (field: keyof CareFormData, value: any) => {
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

  const toggleWeeklyDay = (day: string) => {
    setFormData((prev) => {
      const exists = prev.weeklyDays.includes(day);
      const next = exists ? prev.weeklyDays.filter((d) => d !== day) : [...prev.weeklyDays, day];
      return { ...prev, weeklyDays: next };
    });
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setFormData((prev) => ({
      ...prev,
      imageFile: file,
      imagePreview: file ? URL.createObjectURL(file) : null,
    }));
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
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
          );
          const data = await res.json();

          if (data?.display_name) {
            handleField("location", data.display_name);
          } else {
            handleField("location", `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
          }
        } catch (error) {
          console.error("Reverse geocoding failed:", error);
          handleField("location", `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
        } finally {
          setLoadingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setErrors((p) => ({ ...p, location: "Unable to retrieve your location." }));
        setLoadingLocation(false);
      }
    );
  };

  // validation per step
  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    switch (currentStep) {
      case "title":
        if (!formData.title) newErrors.title = "Title is required";
        if (!formData.startDate) newErrors.startDate = "Start date is required";
        if (!formData.deadline) newErrors.deadline = "Deadline is required";
        if (!formData.time) newErrors.time = "Time is required";
        break;
      case "location":
        if (!formData.location) newErrors.location = "Location is required";
        break;
      case "details1":
        if (!formData.careType) newErrors.careType = "Please specify a care type";
        if (!formData.whoFor) newErrors.whoFor = "Please select who this errand is for";
        break;
      case "frequency":
        if (!formData.frequency) newErrors.frequency = "Select frequency";
        if (formData.frequency === "weekly" && formData.weeklyDays.length === 0) newErrors.weeklyDays = "Select at least one weekday";
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
    const order: FormStep[] = ["title", "location", "details1", "details2", "frequency", "price"];
    const idx = order.indexOf(currentStep);
    if (idx < order.length - 1) setCurrentStep(order[idx + 1]);
    else handleSubmit();
  };

  const prev = () => {
    const order: FormStep[] = ["title", "location", "details1", "details2", "frequency", "price"];
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

      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("start_date", formData.startDate ? formData.startDate.toISOString().split("T")[0] : "");
      formDataToSend.append("end_date", formData.deadline ? formData.deadline.toISOString().split("T")[0] : "");
      formDataToSend.append("time", formData.time);
      formDataToSend.append("location", formData.location);
      formDataToSend.append("care_type", formData.careType);
      formDataToSend.append("who_for", formData.whoFor);
      formDataToSend.append("sensitivities", formData.sensitivities);
      formDataToSend.append("arrival_request", formData.arrivalRequest);
      formDataToSend.append("after_completion", JSON.stringify(formData.afterCompletion));
      if (formData.afterCompletionOther) formDataToSend.append("after_completion_other", formData.afterCompletionOther);
      if (formData.imageFile) formDataToSend.append("image", formData.imageFile);
      formDataToSend.append("frequency", formData.frequency);
      formDataToSend.append("weekly_days", JSON.stringify(formData.weeklyDays));
      formDataToSend.append("preferred_runner", formData.preferredRunner);
      formDataToSend.append("price", String(formData.price));

      const response = await fetch(`${API_URL}/api/care-tasks/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error("API Error:", data);
        if (response.status === 401) {
          throw new Error("Authentication failed.");
        }
        throw new Error(data.detail || data.message || "Failed to post task");
      }

      // ✅ Create the task data for storage
      const taskData: CareTaskData = {
        id: data.id || `task-${Date.now()}`,
        type: "Care Task",
        title: formData.title,
        details: formData.arrivalRequest,
        location: formData.location,
        description: formData.title,
        deadline: formData.deadline!,
        price: formData.price,
        status: "posted",
        createdAt: new Date().toISOString(),
        startDate: formData.startDate || null,
        time: formData.time,
        careType: formData.careType,
        whoFor: formData.whoFor,
        sensitivities: formData.sensitivities,
        arrivalRequest: formData.arrivalRequest,
        afterCompletion: formData.afterCompletion,
        imagePreview: formData.imagePreview || undefined,
        frequency: formData.frequency,
        weeklyDays: formData.weeklyDays,
        preferredRunner: formData.preferredRunner,
      };

      // ✅ Use the custom hook to save the task
      const saveSuccess = saveTaskToStorage(taskData);
      
      if (saveSuccess) {
        console.log("✅ Care task successfully saved to user-specific storage");
      } else {
        console.warn("⚠️ Failed to save task to storage, using fallback");
        // Fallback to old method
        localStorage.setItem("lastPostedTask", JSON.stringify(taskData));
      }

      toast.success("Care task posted successfully!");
      setTimeout(() => router.push("/tasker/dashboard/[id]"), 1500);

    } catch (error: any) {
      console.error("Submit error:", error);
      if (error instanceof Error) {
        toast.error(error.message || "Failed to post task");
        
        if (error.message.includes("authentication") || error.message.includes("session")) {
          setTimeout(() => router.push("/login"), 2000);
        }
      } else {
        toast.error("Failed to post task. Please try again.");
      }
    } finally {
      setIsPosting(false);
    }
  };

  const getNextButtonText = () => (currentStep === "price" ? "Post Task" : "Next");

  // mini sidebar steps
  const miniSteps = [
    { id: "title", label: "Title & Date" },
    { id: "location", label: "Location" },
    { id: "details1", label: "Details" },
    { id: "frequency", label: "Frequency" },
    { id: "price", label: "Fix Price" },
  ];

  return (
    <div className="min-h-screen flex bg-[#F2F2FD] overflow-hidden">
      {/* Sidebar (desktop) */}
      <div className="hidden md:flex h-screen">
        <SideBar userType="tasker" />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <>
          {/* Blur background overlay */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          ></div>

          {/* Sliding sidebar */}
          <div className="fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 md:hidden">
            <SideBar userType="tasker" onClose={() => setIsSidebarOpen(false)} />
          </div>
        </>
      )}

      <div className="flex-1 flex flex-col h-screen w-full">
        {/* TopBar with mobile menu toggle */}
        <div className="sticky top-0 z-10">
          <TopBar onMenuClick={() => setIsSidebarOpen(true)} />
        </div>

        <div className="flex flex-1 flex-col lg:flex-row p-4 lg:p-6 gap-4 lg:gap-6">
          {/* Mini Sidebar - Made responsive */}
          <aside className="w-full lg:w-72 bg-white rounded-3xl shadow-sm p-4 lg:p-6 h-fit">
            <div className="flex items-center gap-3 mb-6">
              <Image src="/care-task.svg" alt="Care task" width={32} height={32} className="lg:w-11 lg:h-11" />
              <h3 className="text-gray-800 text-base lg:text-lg">Care Task</h3>
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
          <div className="flex-1 flex justify-center relative flex-col mb-38">
            {/* Close Button - Made responsive */}
            <button
              onClick={() => router.push("/tasker/dashboard/[id]")}
              className="absolute cursor-pointer top-2 lg:top-4 right-2 lg:right-4 z-50 text-black hover:scale-105 transition"
              aria-label="Close"
            >
              <MdClear className="w-6 h-6 lg:w-9 lg:h-9 bg-white rounded-full p-1 shadow" />
            </button>
            
            <div className="w-full max-w-lg mx-auto ">
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
                      placeholder="e.g., Companion visit for mum"
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#424BE0] focus:outline-none ${
                        errors.title ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                  </div>

                  {/* When do you need this done (DayPicker) */}
                  <div className="relative mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">When do you need this done? *</label>
                    <button
                      onClick={() => setShowStartCalendar(!showStartCalendar)}
                      className={`w-full text-left px-3 cursor-pointer py-2 text-sm border rounded-lg bg-white ${
                        errors.startDate ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      {formData.startDate ? formData.startDate.toDateString() : "Select date"}
                    </button>
                    {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
                    {showStartCalendar && (
                      <div className="absolute text-sm z-30 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-2">
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
                        className={`w-full text-left cursor-pointer px-3 py-2 text-sm border rounded-lg bg-white ${
                          errors.deadline ? "border-red-500" : "border-gray-300"
                        }`}
                      >
                        {formData.deadline ? formData.deadline.toDateString() : "Select deadline"}
                      </button>
                      {errors.deadline && <p className="text-red-500 text-sm mt-1">{errors.deadline}</p>}
                      {showDeadlineCalendar && (
                        <div className="absolute text-sm z-30 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-2">
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
                    {[{ label: "Today", days: 0 }, { label: "Tomorrow", days: 1 }, { label: "Next Week", days: 7 }].map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => quickSelectStart(opt.days)}
                        className="px-3 py-2 border cursor-pointer rounded-lg text-sm text-[#424BE0] hover:bg-[#EFF0FD] border-gray-300"
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

              {/* Step 2: Location - Made responsive */}
              {currentStep === "location" && (
                <section className="bg-white rounded-2xl shadow-sm p-4 lg:p-6 w-full">
                  <h2 className="text-xl lg:text-2xl font-semibold text-gray-800 mb-4 lg:mb-6 text-center">Tell Us Where</h2>

                  <label className="block text-sm font-medium text-gray-700 mb-2">What's the exact location or institution for this task? </label>
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
                    <button onClick={prev} className="flex-1 cursor-pointer py-2 rounded-lg bg-[#EFF0FD] text-[#424BE0] text-sm lg:text-base">Back</button>
                    <button onClick={next} className="flex-1 cursor-pointer py-2 rounded-lg bg-[#424BE0] text-white text-sm lg:text-base">Next</button>
                  </div>
                </section>
              )}

              {/* Step 3: Provide More Details (care specific) - Made responsive */}
              {currentStep === "details1" && (
                <section className="bg-white rounded-2xl shadow-sm p-4 lg:p-6">
                  <h2 className="text-xl lg:text-2xl font-semibold text-gray-800 mb-4 text-center">Provide More Details</h2>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">What type of care errand do you need help with today?</label>
                    <input
                      type="text"
                      value={formData.careType}
                      onChange={(e) => handleField("careType", e.target.value)}
                      placeholder="e.g., Companion visit, medication reminder"
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#424BE0] focus:outline-none ${errors.careType ? "border-red-500" : "border-gray-300"}`}
                    />
                    {errors.careType && <p className="text-red-500 text-sm mt-1">{errors.careType}</p>}
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Who is this errand for?</label>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { key: "me", label: "Me" },
                        { key: "family", label: "Family" },
                        { key: "friend", label: "Friend" },
                        { key: "others", label: "Others" },
                      ].map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => handleField("whoFor", opt.key)}
                          className={`px-3 py-2 cursor-pointer rounded-lg text-sm text-[#424BE0] border ${formData.whoFor === opt.key ? "bg-[#424BE0] text-white" : "bg-gray-100"}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {errors.whoFor && <p className="text-red-500 text-sm mt-1">{errors.whoFor}</p>}
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Any sensitivities or instruction?</label>
                    <input
                      type="text"
                      value={formData.sensitivities}
                      onChange={(e) => handleField("sensitivities", e.target.value)}
                      placeholder="E.g., allergies, preferences"
                      className="w-full px-3 py-2 border rounded-lg text-xs border-gray-300 focus:ring-2 focus:ring-[#424BE0] focus:outline-none"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Any special request for what runner should do on arrival?</label>
                    <textarea
                      value={formData.arrivalRequest}
                      onChange={(e) => handleField("arrivalRequest", e.target.value)}
                      placeholder="E.g., ring doorbell, wait inside the living room"
                      className="w-full px-3 py-2 border rounded-lg text-sm border-gray-300 h-24 resize-none focus:ring-2 focus:ring-[#424BE0] focus:outline-none"
                    />
                  </div>
                  <div className="flex justify-between mt-6 gap-4">
                   <button onClick={prev} className="flex-1 cursor-pointer py-2 rounded-lg bg-[#EFF0FD] text-[#424BE0] text-sm lg:text-base">Back</button>
                   <button onClick={next} className="flex-1 cursor-pointer py-2 rounded-lg bg-[#424BE0] text-white text-sm lg:text-base">Continue</button>
                  </div>
               </section>
               )}

               {/* Step 3b: Details 2 - Made responsive */}
               {currentStep === "details2" && (
                  <section className="bg-white rounded-2xl shadow-sm p-4 lg:p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-4">What should runner do after completion?</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: "photo", label: "Provide Photo" },
                        { key: "video", label: "Provide Video" },
                        { key: "text", label: "Text" },
                        { key: "others", label: "Others" },
                      ].map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => toggleAfterCompletion(opt.key)}
                          className={`px-3 py-2 cursor-pointer rounded-lg mb-2 text-sm text-[#424BE0] border ${formData.afterCompletion.includes(opt.key) ? "bg-[#424BE0] text-white" : "bg-gray-100"}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {formData.afterCompletion.includes("others") && (
                      <input
                        type="text"
                        value={formData.afterCompletionOther}
                        onChange={(e) => handleField("afterCompletionOther", e.target.value)}
                        placeholder="Please specify other action"
                        className="w-full mt-3 px-3 py-2 border rounded-lg text-sm border-gray-300"
                      />
                    )}
                  
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Add image (optional)</p>

                    <label className="relative flex items-center justify-center w-40 h-32 bg-[#EFF0FD] rounded-lg cursor-pointer overflow-hidden group">
                      {/* ✅ Image Preview */}
                      {formData.imagePreview ? (
                        <>
                          <img
                            src={formData.imagePreview}
                            alt="Preview"
                            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-200 group-hover:opacity-70"
                          />
                          <div className="absolute inset-0 cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                            <PlusIcon size={24} className="text-white bg-black/40 rounded-full p-1" />
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col cursor-pointer items-center justify-center text-gray-500">
                          <PlusIcon size={24} className="bg-white rounded-full p-1 mb-2" />
                          <span className="text-xs">Click to add</span>
                        </div>
                      )}

                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          handleField("imageFile", file);
                          handleField("imagePreview", file ? URL.createObjectURL(file) : null);
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="flex justify-between mt-6 mb-4 gap-4">
                    <button onClick={prev} className="flex-1 cursor-pointer py-2 rounded-lg bg-[#EFF0FD] text-[#424BE0] text-sm lg:text-base">Back</button>
                    <button onClick={next} className="flex-1 cursor-pointer py-2 rounded-lg bg-[#424BE0] text-white text-sm lg:text-base">Continue</button>
                  </div>
                </section>
              )}

              {/* Step 4: Frequency - Made responsive */}
              {currentStep === "frequency" && (
                <section className="bg-white rounded-2xl shadow-sm p-4 lg:p-6">
                  <p className="text-xl lg:text-2xl font-semibold text-gray-800 mb-4 text-center">Continue: More Details</p>
                  <h2 className="text-xl lg:text-2xl font-semibold text-gray-800 mb-4 text-center">Frequency</h2>

                  <div className="mb-4">
                    <p className="text-sm text-gray-700 mb-2">How often should this care errand happen?</p>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleField("frequency", "one-time")}
                        className={`px-3 py-2 cursor-pointer rounded-lg text-sm border ${formData.frequency === "one-time" ? "bg-[#424BE0] text-white" : "bg-gray-100"}`}
                      >
                        One-time
                      </button>
                      <button
                        onClick={() => handleField("frequency", "daily")}
                        className={`px-3 py-2 cursor-pointer rounded-lg text-sm border ${formData.frequency === "daily" ? "bg-[#424BE0] text-white" : "bg-gray-100"}`}
                      >
                        Daily
                      </button>
                      <button
                        onClick={() => handleField("frequency", "weekly")}
                        className={`px-3 py-2 cursor-pointer rounded-lg text-sm border ${formData.frequency === "weekly" ? "bg-[#424BE0] text-white" : "bg-gray-100"}`}
                      >
                        Weekly
                      </button>
                    </div>
                    {errors.frequency && <p className="text-red-500 text-sm mt-1">{errors.frequency}</p>}
                  </div>

                  {formData.frequency === "weekly" && (
                    <>
                      <div className="mb-4">
                        <p className="text-sm text-gray-700 mb-2">Which day weekly?</p>
                        <div className="flex gap-2 flex-wrap cursor-pointer">
                          {[
                            { key: "mon", label: "Mon" },
                            { key: "tue", label: "Tue" },
                            { key: "wed", label: "Wed" },
                            { key: "thu", label: "Thu" },
                            { key: "fri", label: "Fri" },
                            { key: "sat", label: "Sat" },
                            { key: "sun", label: "Sun" },
                          ].map((d) => (
                            <button
                              key={d.key}
                              onClick={() => toggleWeeklyDay(d.key)}
                              className={`px-2 py-1 cursor-pointer text-sm rounded-lg border ${formData.weeklyDays.includes(d.key) ? "bg-[#424BE0] text-white" : "bg-gray-100"}`}
                            >
                              {d.label}
                            </button>
                          ))}
                        </div>
                        {errors.weeklyDays && <p className="text-red-500 text-sm mt-1">{errors.weeklyDays}</p>}
                      </div>

                      <div className="mb-4">
                        <input
                          type="text"
                          value={formData.preferredRunner}
                          onChange={(e) => handleField("preferredRunner", e.target.value)}
                          placeholder="Assign preferred returning runner (optional)"
                          className="w-full px-3 py-2 border rounded-lg text-sm border-gray-300"
                        />
                      </div>
                    </>
                  )}

                  <div className="flex justify-between mt-6 gap-4">
                    <button onClick={prev} className="flex-1 cursor-pointer py-2 rounded-lg bg-[#EFF0FD] text-[#424BE0] text-sm lg:text-base">Back</button>
                    <button onClick={next} className="flex-1 cursor-pointer py-2 rounded-lg bg-[#424BE0] text-white text-sm lg:text-base">Next</button>
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
                    <button onClick={prev} className="flex-1 cursor-pointer py-2 rounded-lg bg-[#EFF0FD] text-[#424BE0] text-sm lg:text-base">Back</button>
                    <button 
                      onClick={handleSubmit} 
                      disabled={isPosting}
                      className="flex-1 cursor-pointer py-2 rounded-lg bg-[#424BE0] text-white text-sm lg:text-base disabled:opacity-50"
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