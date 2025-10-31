"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import SideBar from "@/app/components/SideBar";
import TopBar from "@/app/components/TopBar";
import { FaLocationDot } from "react-icons/fa6";
import { MdClear } from "react-icons/md";
import { PlusIcon } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { LocalMicroTaskData } from "@/app/types/task";
import { useUser } from "@/app/context/UserContext";
import { TokenManager } from "@/app/utils/tokenUtils";
import { useTaskStorage } from "@/app/hooks/useTaskStorage";


type FormStep = "title" | "location" | "details" | "price";

interface ErrandFormData {
  title: string;
  startDate: Date | null;
  deadline: Date | null;
  time: string;
  location: string;
  description: string;
  price: string;
  imageFile?: File | null;
  imagePreview?: string | null;
}

export default function ErrandFormPage({userId}: {userId: string}) {
  const router = useRouter();
  const {userData} = useUser()
  const {saveTaskToStorage} = useTaskStorage()
  const [currentStep, setCurrentStep] = useState<FormStep>("title");
  const [formData, setFormData] = useState<ErrandFormData>({
    title: "",
    startDate: null,
    deadline: null,
    time: "",
    location: "",
    description: "",
    price: "",
  });

  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showDeadlineCalendar, setShowDeadlineCalendar] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
  document.body.style.overflow = isSidebarOpen ? "hidden" : "auto";
  }, [isSidebarOpen])

  const handleInputChange = (field: keyof ErrandFormData, value: string | Date | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" })); // clear error on change
  };

  const handleQuickDateSelect = (days: number) => {
    const selectedDate = new Date();
    selectedDate.setDate(selectedDate.getDate() + days);
    handleInputChange("startDate", selectedDate);
  };

  const formSteps = [
    { id: "title" as FormStep, label: "Title & Date" },
    { id: "location" as FormStep, label: "Location" },
    { id: "details" as FormStep, label: "Details" },
    { id: "price" as FormStep, label: "Fix Price" },
  ];

  const validateStep = () => {
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
      case "details":
        if (!formData.description) newErrors.details = "Description is required";
        break;
      case "price":
        if (!formData.price) newErrors.price = "Price is required";
        break;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (!validateStep()) return;

    switch (currentStep) {
      case "title":
        setCurrentStep("location");
        break;
      case "location":
        setCurrentStep("details");
        break;
      case "details":
        setCurrentStep("price");
        break;
      case "price":
        handleSubmit();
        break;
    }
  };

  const handlePreviousStep = () => {
    switch (currentStep) {
      case "location":
        setCurrentStep("title");
        break;
      case "details":
        setCurrentStep("location");
        break;
      case "price":
        setCurrentStep("details");
        break;
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setFormData(prev => ({
      ...prev,
      imageFile: file,
      imagePreview: file ? URL.createObjectURL(file) : null
    }));
  };

  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setIsPosting(true);

    try {
      let token = TokenManager.getAccessToken()

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

      console.log("🔐 Using token for API call:", token.substring(0, 20) + "...");

      const response = await fetch(`${API_URL}/api/tasks/create/local-micro`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({
          title: formData.title,
          start_date: formData.startDate?.toISOString(),
          deadline: formData.deadline?.toISOString(),
          time: formData.time,
          location: formData.location,
          description: formData.description,
          category: "local_micro",
          price: formData.price,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error("API Error:", data)
        if (response.status === 401) {
          throw new Error("Authentication failed.");
        }
        throw new Error(data.detail || data.message || "Request failed");
      }

     
      const taskData: LocalMicroTaskData = {
        id: data.id || `task-${Date.now()}`,
        type: "Local Errand",
        title: formData.title,
        location: formData.location,
        deadline: formData.deadline!,
        price: Number(formData.price),
        status: "posted",
        createdAt: new Date().toISOString(),
        time: formData.time,
        description: formData.description,
        imagePreview: formData.imagePreview || undefined
      }

      if (taskData.deadline && typeof taskData.deadline === 'string') {
        taskData.deadline = new Date(taskData.deadline);
      }
      const saveSuccess = saveTaskToStorage(taskData)
      if (saveSuccess) {
        console.log("Task successfully saved to user-specific storage")
      } else {
        console.warn("⚠️ Failed to save task to storage");
        // On success, redirect or show success message
        localStorage.setItem("lastPostedTask", JSON.stringify(taskData));
      }
      toast.success("Task posted successfully!");
      setTimeout(() => router.push("/tasker/dashboard/[id]"), 1500);

    } catch (error: unknown) {
    console.error("Submit error:", error);
    
    // ✅ Properly handle the unknown error type
    if (error instanceof Error) {
      toast.error(error.message || "Request failed. Please try again.");
      
      if (error.message.includes("authentication") || error.message.includes("session")) {
        setTimeout(() => router.push("/login"), 2000);
      }
    } else {
      toast.error("Request failed. Please try again.");
    }
  } finally {
    setIsPosting(false);
  }
};

  const isStepComplete = (step: FormStep): boolean => {
    switch (step) {
      case "title":
        return !!formData.title && !!formData.startDate;
      case "location":
        return !!formData.location;
      case "details":
        return !!formData.description;
      case "price":
        return !!formData.price;
      default:
        return false;
    }
  };

  const handleUseCurrentLocation = async () => {
    setLoadingLocation(true);
    if (!navigator.geolocation) {
      setErrors({ location: "Geolocation is not supported by your browser." });
      setLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const apiKey = process.env.NEXT_PUBLIC_OPENCAGE_API_KEY;
          const response = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${apiKey}`
          );
          const data = await response.json();
          const address = data?.results[0]?.formatted || "Unknown location";
          handleInputChange("location", address);
        } catch (error) {
          setErrors({ location: "Failed to fetch location. Please try again." });
        } finally {
          setLoadingLocation(false);
        }
      },
      () => {
        setErrors({ location: "Unable to retrieve your location." });
        setLoadingLocation(false);
      }
    );
  };

  const getNextButtonText = () => (currentStep === "price" ? "Post Errand" : "Next");

  return (
    <div className="min-h-screen flex bg-[#F2F2FD] overflow-hidden">
      {/* Sidebar (desktop) */}
      <div className="hidden md:flex h-screen">
        <SideBar />
      </div>

      {/* Sidebar Overlay (mobile) */}
      {isSidebarOpen && (
        <>
          {/* Blur background overlay */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          ></div>

          {/* Sliding sidebar */}
          <div
            className={`fixed top-0 left-0 h-full w-58 bg-white shadow-lg z-50 transform transition-transform duration-500 ${
              isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <SideBar onClose={() => setIsSidebarOpen(false)}/>
          </div>
        </>
      )}

      <div className="flex-1 flex flex-col w-full">
        {/* TopBar - Fixed the syntax error here */}
        <div className="sticky top-0 z-10">
          <TopBar onMenuClick={() => setIsSidebarOpen(true)} />
        </div>

        <div className="flex flex-col lg:flex-row px-4 md:ml-8 lg:px-0">
          {/* Mini Sidebar - Made responsive */}
          <div className="w-full lg:w-72 bg-white rounded-3xl shadow-sm p-4 lg:p-6 lg:ml-6 mt-4 h-fit mb-4 lg:mb-0">
            <div className="flex items-center gap-3 mb-6 lg:mb-8">
              <Image src="/local.svg" alt="Errand Icon" width={32} height={32} className="lg:w-11 lg:h-11" />
              <h3 className="text-gray-800 text-base lg:text-lg">Local Micro Task</h3>
            </div>

            <nav className="space-y-2 lg:space-y-3">
              {formSteps.map((step) => (
                <div key={step.id} className="relative">
                  {currentStep === step.id && (
                    <div className="absolute top-0 h-full w-1 bg-[#424BE0] rounded-l-full"></div>
                  )}
                  <button
                    onClick={() => setCurrentStep(step.id)}
                    className={`w-full cursor-pointer text-left p-2 lg:p-3 transition-all rounded-xl text-sm lg:text-base ${
                      currentStep === step.id
                        ? "bg-[#EFF0FD] text-[#424BE0] font-medium"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{step.label}</span>
                      {isStepComplete(step.id) && (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                    </div>
                  </button>
                </div>
              ))}
            </nav>
          </div>

          {/* Main Form - Made fully responsive */}
          <div className="flex-1 flex justify-center lg:mr-24 relative flex-col">
            <button 
              onClick={() => router.push("/tasker/dashboard/[id]")} 
              className="absolute cursor-pointer top-2 lg:top-6 right-2 lg:right-4 z-50 text-black transition"
            >
              <MdClear className="p-1 text-3xl lg:text-4xl bg-white rounded-full"/>
            </button>
            
            <div className="w-full max-w-lg mx-auto mb-0 md:mb-34">
              {/* Step 1: Title & Date - Made responsive */}
              {currentStep === "title" && (
                <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-6">
                  <h2 className="text-xl lg:text-2xl text-center font-semibold text-gray-800 mb-4 lg:mb-6">
                    Let's Start With The Basics
                  </h2>

                  {/* Title */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Errand Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      placeholder="e.g., Pick up groceries from Walmart"
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#424BE0] focus:outline-none ${
                        errors.title ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                  </div>

                  {/* Start Date */}
                  <div className="relative mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      When you need this done *
                    </label>
                    <button
                      onClick={() => setShowStartCalendar(!showStartCalendar)}
                      className={`w-full cursor-pointer text-left px-3 text-xs py-2 border rounded-lg bg-white ${
                        errors.startDate ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      {formData.startDate ? format(formData.startDate, "MM-dd-yyyy") : "Select date"}
                    </button>
                    {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
                    {showStartCalendar && (
                      <div className="absolute z-10 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-w-xs p-2">
                        <DayPicker
                          mode="single"
                          selected={formData.startDate ?? undefined}
                          onSelect={(date) => {
                            handleInputChange("startDate", date || null);
                            setShowStartCalendar(false);
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Deadline + Time - Made responsive */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="relative sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Deadline *
                      </label>
                      <button
                        onClick={() => setShowDeadlineCalendar(!showDeadlineCalendar)}
                        className={`w-full cursor-pointer text-xs text-left px-3 py-2 border rounded-lg bg-white ${
                          errors.deadline ? "border-red-500" : "border-gray-300"
                        }`}
                      >
                        {formData.deadline ? format(formData.deadline, "MM-dd-yyyy") : "Select deadline"}
                      </button>
                      {errors.deadline && (
                        <p className="text-red-500 text-sm mt-1">{errors.deadline}</p>
                      )}
                      {showDeadlineCalendar && (
                        <div className="absolute z-10 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-w-xs h-74 p-2">
                          <DayPicker
                            mode="single"
                            selected={formData.deadline ?? undefined}
                            onSelect={(date) => {
                              handleInputChange("deadline", date || null);
                              setShowDeadlineCalendar(false);
                            }}
                            className="w-72 cursor-pointer text-sm"
                          />
                        </div>
                      )}
                    </div>

                    <div className="grid">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Time *</label>
                      <input
                        type="time"
                        value={formData.time}
                        onChange={(e) => handleInputChange("time", e.target.value)}
                        className={`w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-[#424BE0] ${
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
                      { label: "Next Week", days: 7 },
                    ].map((option) => (
                      <button
                        key={option.label}
                        onClick={() => handleQuickDateSelect(option.days)}
                        className="px-3 cursor-pointer py-2 border rounded-lg text-xs text-[#424BE0] hover:bg-[#EFF0FD] border-gray-300"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  {/* Buttons */}
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={handleNextStep}
                      className="w-full cursor-pointer sm:w-auto px-8 sm:px-42 py-2 rounded-lg font-medium bg-[#424BE0] text-white"
                    >
                      {getNextButtonText()}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Location - Made responsive */}
              {currentStep === "location" && (
                <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-6">
                  <h2 className="text-xl lg:text-2xl font-semibold text-gray-800 mb-6 lg:mb-8 text-center">Tell Us Where</h2>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Where you need this done?
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="📍 Enter address"
                    className={`w-full px-3 py-2 border text-sm rounded-lg focus:ring-2 focus:ring-[#424BE0] focus:outline-none ${
                      errors.location ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.location && (
                    <p className="text-red-500 text-sm mt-1">{errors.location}</p>
                  )}

                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    className="flex cursor-pointer items-center gap-2 mt-3 text-green-500 text-sm hover:underline"
                  >
                    <FaLocationDot className="text-green-500 text-sm" />
                    {loadingLocation ? "Fetching current location..." : "Use your current location"}
                  </button>

                  <div className="flex justify-between mt-6 gap-4">
                    <button
                      onClick={handlePreviousStep}
                      className="flex-1 cursor-pointer py-2 rounded-lg bg-[#EFF0FD] text-[#424BE0] text-sm lg:text-base"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleNextStep}
                      className="flex-1 cursor-pointer py-2 rounded-lg font-medium bg-[#424BE0] text-white text-sm lg:text-base"
                    >
                      {getNextButtonText()}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Details - Made responsive */}
              {currentStep === "details" && (
                <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-6">
                  <h2 className="text-center text-xl lg:text-2xl font-semibold mb-6 lg:mb-8">Provide more Details</h2>
                  <p className="text-sm font-semibold text-gray-800 mb-2">
                    Description*
                  </p>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Provide a detailed description for runner"
                    rows={3}
                    className={`w-full px-3 py-2 text-sm border rounded-lg resize-none focus:ring-2 focus:ring-[#424BE0] mb-6 focus:outline-none ${
                      errors.details ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                  )}

                  <div className="mt-2">
                    <p className="mb-3 text-sm">Add list image (Optional)</p>
                    <div className="flex items-center gap-4">
                      <label className="relative flex items-center justify-center gap-2 px-6 py-4 lg:px-8 lg:py-6 rounded-sm cursor-pointer bg-[#EFF0FD]/50 w-full sm:w-auto">
                        {formData.imagePreview ? (
                          <img src={formData.imagePreview} alt="preview" className="w-8 h-8 lg:w-12 lg:h-12 object-cover rounded-lg" />
                        ) : (
                          <div className="bg-white cursor-pointer rounded-full p-1 shadow-xs">
                            <PlusIcon size={20} />
                          </div>
                        )}
                        <input type="file" accept="image/*" onChange={onFileChange} className="hidden" />
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-between mt-6 gap-4">
                    <button
                      onClick={handlePreviousStep}
                      className="flex-1 cursor-pointer py-2 rounded-lg bg-[#EFF0FD] text-[#424BE0] text-sm lg:text-base"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleNextStep}
                      className="flex-1 cursor-pointer py-2 rounded-lg font-medium bg-[#424BE0] text-white text-sm lg:text-base"
                    >
                      {getNextButtonText()}
                    </button>
                  </div>
                </div>
              )}
              
              {/* Step 4: Fix Price - Made responsive */}
              {currentStep === "price" && (
                <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-6">
                  <h2 className="text-xl lg:text-2xl font-semibold text-gray-800 mb-4 lg:mb-6 text-center">
                    Fix Price Range
                  </h2>

                  {/* Animated price display */}
                  <div className="text-center mb-6 lg:mb-8 transition-all duration-300 ease-in-out">
                    <h3
                      className="text-lg lg:text-xl font-bold text-[#424BE0] transition-transform duration-300 ease-in-out"
                      style={{
                        transform: `scale(${1 + (Number(formData.price || 15000) - 15000) / 60000})`,
                      }}
                    >
                      ₦{Number(formData.price || 15000).toLocaleString()}
                    </h3>
                  </div>

                  {/* Dynamic Gradient Slider */}
                  <div className="relative w-full">
                    <input
                      type="range"
                      min={15000}
                      max={30000}
                      step={1000}
                      value={formData.price || 15000}
                      onChange={(e) => handleInputChange("price", e.target.value)}
                      className="w-full h-2 rounded-lg cursor-pointer bg-gray-200 transition-all duration-300 focus:outline-none"
                      style={{
                        background: `linear-gradient(to right, #424BE0 ${(Number(formData.price || 15000) - 15000) / 150}%, #E5E7EB 0%)`,
                        boxShadow: "0 0 10px rgba(66, 75, 224, 0.3)",
                      }}
                    />

                    {/* Custom thumb style */}
                    <style jsx>{`
                      input[type="range"]::-webkit-slider-thumb {
                        -webkit-appearance: none;
                        height: 22px;
                        width: 22px;
                        border-radius: 50%;
                        background: #424be0;
                        box-shadow: 0 0 8px rgba(66, 75, 224, 0.5);
                        transition: transform 0.2s ease-in-out;
                      }
                      input[type="range"]::-webkit-slider-thumb:hover {
                        transform: scale(1.25);
                      }

                      input[type="range"]::-moz-range-thumb {
                        height: 22px;
                        width: 22px;
                        border-radius: 50%;
                        background: #424be0;
                        box-shadow: 0 0 8px rgba(66, 75, 224, 0.5);
                        transition: transform 0.2s ease-in-out;
                      }
                      input[type="range"]::-moz-range-thumb:hover {
                        transform: scale(1.25);
                      }
                    `}</style>
                  </div>

                  {/* Range labels */}
                  <div className="flex cursor-pointer justify-between text-sm text-gray-500 mt-2">
                    <span>₦15,000</span>
                    <span>₦30,000</span>
                  </div>

                  {errors.price && (
                    <p className="text-red-500 text-sm mt-2">{errors.price}</p>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between mt-6 lg:mt-8 gap-4">
                    <button
                      onClick={handlePreviousStep}
                      className="flex-1 cursor-pointer py-2 rounded-lg bg-[#EFF0FD] text-[#424BE0] transition text-sm lg:text-base"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSubmit}
                      className="flex-1 cursor-pointer py-2 rounded-lg font-medium bg-[#424BE0] text-white shadow-md hover:shadow-lg transition text-sm lg:text-base"
                    >
                      {getNextButtonText()}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Loader Modal */}
          {isPosting && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8 w-[90%] max-w-[300px] text-center animate-fadeIn">
                {/* Spinner */}
                <div className="flex justify-center mb-4">
                  <div className="w-10 h-10 border-4 border-[#424BE0] border-t-transparent rounded-full animate-spin"></div>
                </div>

                {/* Texts */}
                <h3 className="text-base lg:text-lg font-semibold text-gray-800 mb-2">
                  Posting your task...
                </h3>
                <p className="text-xs lg:text-sm text-gray-500">
                  This might take a few minutes.
                </p>
              </div>
            </div>
          )}
          <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
        </div>
      </div>
    </div>
  );
}