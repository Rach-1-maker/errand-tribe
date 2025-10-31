// app/tasker/dashboard/supermarket-runs/page.tsx
"use client";

import React, { useState, ChangeEvent} from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import SideBar from "@/app/components/SideBar";
import TopBar from "@/app/components/TopBar";
import { FaLocationDot } from "react-icons/fa6";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { MdClear } from "react-icons/md";
import { PlusIcon } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiPlusCircle } from "react-icons/fi";
import "react-phone-input-2/lib/style.css";
import PhoneInput from "react-phone-input-2";
import { SupermarketTaskData } from "@/app/types/task";
import { useTaskStorage } from "@/app/hooks/useTaskStorage";
import { useUser } from "@/app/context/UserContext";
import { TokenManager } from "@/app/utils/tokenUtils";


type FormStep = "title" | "location" | "details" | "dropoff" | "price";

interface ShoppingItem {
  id: string;
  name: string;
  substitute?: string;
  perishable?: boolean;
}

interface SupermarketFormData {
  title: string;
  startDate: Date | null;
  deadline: Date | null;
  time: string;
  location: string;
  dropoffLocation: string;
  contactPhone: string;
  saveNumber: boolean;
  items: ShoppingItem[];
  price: number;
  imageFile?: File | null;
  imagePreview?: string | null;
}

export default function SupermarketRunsPage() {
  const router = useRouter();
  const {saveTaskToStorage} = useTaskStorage()
  const { userData } = useUser();
  const initialItems = [
    { id: crypto?.randomUUID?.() ?? `${Date.now()}-1`, name: "" },
    { id: crypto?.randomUUID?.() ?? `${Date.now()}-2`, name: "" },
    { id: crypto?.randomUUID?.() ?? `${Date.now()}-2`, name: "" },
    { id: crypto?.randomUUID?.() ?? `${Date.now()}-2`, name: "" },
  ];
  const [shoppingList, setShoppingList] = useState<number | null>(null);
  const [showMenuIndex, setShowMenuIndex] = useState<number | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<FormStep>("title");
  const [formData, setFormData] = useState<SupermarketFormData>({
    title: "",
    startDate: null,
    deadline: null,
    time: "",
    location: "",
    dropoffLocation: "",
    contactPhone: "",
    saveNumber: false,
    items: initialItems,
    price: 10000,
    imageFile: null,
    imagePreview: null,
  });

  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showDeadlineCalendar, setShowDeadlineCalendar] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingDropoffLocation, setLoadingDropoffLocation] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPosting, setIsPosting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Add mobile sidebar state

  // Shopping list helpers
  const updateItem = (id: string, patch: Partial<ShoppingItem>) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(it => (it.id === id ? { ...it, ...patch } : it))
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { id: crypto?.randomUUID?.() ?? `${Date.now()}`, name: "" }]
    }));
  };

  const removeItemByIndex = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
    setShowMenuIndex(null);
  };

  const removeItemById = (id: string) => {
    setFormData((prev) => ({ ...prev, items: prev.items.filter((i) => i.id !== id) }));
    setShowMenuIndex(null);
  };

  // Image handling
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setFormData(prev => ({
      ...prev,
      imageFile: file,
      imagePreview: file ? URL.createObjectURL(file) : null
    }));
  };

  // Form steps
  const formSteps = [
    { id: "title" as FormStep, label: "Title & Date" },
    { id: "location" as FormStep, label: "Location" },
    { id: "details" as FormStep, label: "Details" },
    { id: "dropoff" as FormStep, label: "Drop-off Location" },
    { id: "price" as FormStep, label: "Fix Price" },
  ];

  // Input change handler
  const handleInputChange = (field: keyof SupermarketFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: "" }));
  };


  // Quick date selection
  const handleQuickDateSelect = (days: number) => {
    const selectedDate = new Date();
    selectedDate.setDate(selectedDate.getDate() + days);
    handleInputChange("startDate", selectedDate);
  };

  // OpenCage geocoding function
  const getAddressFromCoordinates = async (latitude: number, longitude: number): Promise<string> => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_OPENCAGE_API_KEY;
      if (!apiKey) throw new Error("OpenCage API key not configured");

      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${apiKey}`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        return data.results[0].formatted;
      }
      throw new Error("No address found");
    } catch (error) {
      console.error("Geocoding error:", error);
      throw new Error("Failed to fetch address");
    }
  };

  // Current location handler
  const handleUseCurrentLocation = async (type: 'pickup' | 'dropoff') => {
    const setLoading = type === 'pickup' ? setLoadingLocation : setLoadingDropoffLocation;
    const field = type === 'pickup' ? 'location' : 'dropoffLocation';
    
    setLoading(true);
    
    if (!navigator.geolocation) {
      setErrors({ [field]: "Geolocation is not supported by your browser." });
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const address = await getAddressFromCoordinates(latitude, longitude);
          handleInputChange(field, address);
        } catch (error) {
          setErrors({ [field]: "Failed to fetch location. Please try again." });
        } finally {
          setLoading(false);
        }
      },
      () => {
        setErrors({ [field]: "Unable to retrieve your location." });
        setLoading(false);
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
      case "location":
        if (!formData.location) newErrors.location = "Pick-up location is required";
        break;
      case "details":
        if (!formData.items.some(it => it.name && it.name.trim().length > 0)) {
          newErrors.items = "Add at least one shopping item";
        }
        break;
      case "dropoff":
        if (!formData.dropoffLocation) newErrors.dropoffLocation = "Drop-off location is required";
        break;
      case "price":
        if (!formData.price || formData.price < 10000) newErrors.price = "Choose a valid price";
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigation
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
        setCurrentStep("dropoff");
        break;
      case "dropoff":
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
      case "dropoff":
        setCurrentStep("details");
        break;
      case "price":
        setCurrentStep("dropoff");
        break;
    }
  };

  // Form submission
  const handleSubmit = async () => {
    const requiredFields = {
      needed_by_date: formData.deadline,
      needed_by_time: formData.time,
      shopping_list: formData.items.some(item => item.name.trim() !== ""),
      drop_off_location: formData.dropoffLocation,
      phone_number: formData.contactPhone,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      toast.error(`Missing required fields: ${missingFields.join(', ')}`);
      return;
    }
    if (!validateStep()) return;
    setIsPosting(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      if (!API_URL) throw new Error("API URL not configured");

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

      const formatDateToAPI = (date: Date | null): string | null => {
        if (!date) return null;
        return format(date, 'yyyy-MM-dd');
      };

      const requestData = {
      title: formData.title,
      start_date: formatDateToAPI(formData.startDate),
      needed_by_date: formatDateToAPI(formData.deadline), 
      needed_by_time: formData.time, 
      location: formData.location,
      drop_off_location: formData.dropoffLocation, 
      shopping_list: formData.items
        .map(item => item.name)
        .filter(name => name.trim() !== ""), 
      price: formData.price,
      phone_number: formData.contactPhone, 
    };

    console.log("Sending data:", requestData);

    const response = await fetch(`${API_URL}/api/supermarket-run/`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json", 
      },
      body: JSON.stringify(requestData),
    })
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error("API Error:", data);
        if (response.status === 401) {
          throw new Error("Authentication failed.");
        }
        throw new Error(data.detail || data.message || "Failed to post task");
      }

      // ✅ Create the task data for storage
      const taskData: SupermarketTaskData = {
        id: data.id || `task-${Date.now()}`,
        type: "Supermarket Runs",
        title: formData.title,
        description: formData.title, // Using title as description for now
        shoppingList: formData.items.map(item => item.name).filter(name => name.trim() !== ""),
        location: formData.location,
        dropoff: formData.dropoffLocation,
        deadline: formData.deadline!,
        price: Number(formData.price),
        status: "posted",
        createdAt: new Date().toISOString(),
        startDate: formData.startDate || null,
        time: formData.time,
        imagePreview: formData.imagePreview || undefined
      };

      const saveSuccess = saveTaskToStorage(taskData)
      if (saveSuccess) {
        console.log("✅ Supermarket task successfully saved to user-specific storage");
      } else {
        console.warn("⚠️ Failed to save task to storage, using fallback");
        // Fallback to old method
        localStorage.setItem("lastPostedTask", JSON.stringify(taskData));
      }

      toast.success("Supermarket run posted successfully!");
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

  const getNextButtonText = () => (currentStep === "price" ? "Post Errand" : "Next");

  return (
    <div className="min-h-screen flex bg-[#F2F2FD] overflow-hidden">
      {/* Sidebar (desktop) */}
      <div className="hidden md:flex h-screen">
        <SideBar />
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
            <SideBar onClose={() => setIsSidebarOpen(false)} />
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
            <div className="flex items-center gap-3 mb-6 lg:mb-8">
              <Image src="/super-runs.svg" alt="Supermarket" width={32} height={32} className="lg:w-11 lg:h-11" />
              <h3 className="text-gray-800 text-base lg:text-lg">Supermarket Runs</h3>
            </div>

            <nav className="space-y-2 lg:space-y-3">
              {formSteps.map((step) => (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(step.id)}
                  className={`w-full cursor-pointer text-left p-2 lg:p-3 rounded-xl text-sm lg:text-base transition ${
                    currentStep === step.id 
                      ? "bg-[#EFF0FD] text-[#424BE0] font-medium" 
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {step.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Form Content - Made responsive */}
          <div className="flex-1 flex justify-center relative flex-col mb-32 overflow-y-auto">
            {/* Close Button */}
            <button 
              onClick={() => router.push("/tasker/dashboard/[id]")} 
              className="absolute cursor-pointer top-2 lg:top-4 right-2 lg:right-4 z-50 text-black transition hover:scale-105"
            >
              <MdClear className="w-6 h-6 lg:w-8 lg:h-8 bg-white rounded-full p-1" />
            </button>
            
            <div className="w-full max-w-lg mx-auto">
              {/* Step 1: Title & Date - Made responsive */}
              {currentStep === "title" && (
                <section className="bg-white rounded-2xl shadow-sm p-4 lg:p-6">
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
                      className={`w-full px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-[#424BE0] focus:outline-none ${
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
                          className="w-72 text-sm"
                        />
                      </div>
                    )}
                  </div>

                  {/* Deadline + Time - Made responsive */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative">
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
                            className="w-72 text-sm"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Time *</label>
                      <input
                        type="time"
                        value={formData.time}
                        onChange={(e) => handleInputChange("time", e.target.value)}
                        className={`w-full px-3 py-2 border text-xs rounded-lg focus:ring-2 focus:ring-[#424BE0] ${
                          errors.time ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.time && <p className="text-red-500 text-sm mt-1">{errors.time}</p>}
                    </div>
                  </div>

                  {/* Quick Select */}
                  <div className="mt-4 flex gap-x-8 justify-center flex-wrap">
                    {[
                      { label: "Today", days: 0 },
                      { label: "Tomorrow", days: 1 },
                      { label: "Next Week", days: 7 },
                    ].map((option) => (
                      <button
                        key={option.label}
                        onClick={() => handleQuickDateSelect(option.days)}
                        className="px-6 py-3 cursor-pointer border rounded-lg text-sm text-[#424BE0] hover:bg-[#EFF0FD] border-gray-300"
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
                </section>
              )}

              {/* Step 2: Location - Made responsive */}
              {currentStep === "location" && (
                <section className="bg-white rounded-2xl shadow-sm p-4 lg:p-6 w-full">
                  <h2 className="text-xl lg:text-2xl font-semibold text-gray-800 mb-4 lg:mb-6 text-center">Tell Us Where</h2>
                  
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Where do you need this done?*
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="📍 Enter address"
                    className={`w-full px-3 py-2 border text-xs rounded-lg focus:ring-2 focus:ring-[#424BE0] focus:outline-none ${
                      errors.location ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.location && (
                    <p className="text-red-500 text-sm mt-1">{errors.location}</p>
                  )}

                  <button
                    type="button"
                    onClick={() => handleUseCurrentLocation('pickup')}
                    className="flex items-center cursor-pointer gap-2 mt-3 text-green-500 text-sm hover:underline"
                  >
                    <FaLocationDot className="text-green-500 text-sm" />
                    {loadingLocation ? "Fetching current location..." : "Use your current location"}
                  </button>

                  <div className="flex justify-between mt-6 gap-4">
                    <button
                      onClick={handlePreviousStep}
                      className="flex-1 py-2 cursor-pointer rounded-lg border bg-[#EFF0FD] text-[#424BE0] text-sm lg:text-base"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleNextStep}
                      className="flex-1 py-2 cursor-pointer rounded-lg font-medium bg-[#424BE0] text-white text-sm lg:text-base"
                    >
                      {getNextButtonText()}
                    </button>
                  </div>
                </section>
              )}

              {/* Step 3: Details - Made responsive */}
              {currentStep === "details" && (
                <section className="bg-white rounded-2xl shadow-sm p-4 lg:p-6">
                  <h2 className="text-xl lg:text-2xl font-semibold text-gray-800 mb-2 text-center">Provide More Details</h2>
                  <p className="text-sm text-gray-600 mb-1">Drop shopping list*</p>

                  <div className="">
                    {formData.items.map((item, idx) => {
                      const showDots = idx === 0 || idx === 1
                      return (
                      <div key={item.id} className="p-3 rounded-lg flex gap-2 items-start">
                        <div className="flex-1">
                          <input
                            value={item.name}
                            onChange={(e) => updateItem(item.id, { name: e.target.value })}
                            placeholder={`${idx + 1}`}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                          />
                          {item.substitute && <p className="text-xs text-gray-500 mt-1">Substitute: {item.substitute}</p>}
                          {item.perishable && <p className="text-xs text-red-500 mt-1">Perishable</p>}
                        </div>

                        {/* three-dots action only for first and second */}
                          {showDots && (
                            <div className="relative">
                              <button
                                onClick={() => setShowMenuIndex(showMenuIndex === idx ? null : idx)}
                                className="p-1 cursor-pointer text-gray-600 hover:text-gray-900"
                                aria-label="More"
                              >
                                <HiOutlineDotsVertical size={20} />
                              </button>

                              {showMenuIndex === idx && (
                                <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-lg shadow-lg border border-gray-100 z-20 animate-fadeIn">
                                  {idx === 0 ? (
                                    <>
                                      <button
                                        onClick={() => {
                                          // set a default substitute (you can replace with UI to input substitute)
                                          updateItem(item.id, { substitute: item.substitute ? undefined : "User indicated substitute" });
                                          setShowMenuIndex(null);
                                        }}
                                        className="block cursor-pointer w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                      >
                                        {item.substitute ? "Remove substitute" : "Substitute item"}
                                      </button>
                                      <button
                                        onClick={() => {
                                          updateItem(item.id, { perishable: !item.perishable });
                                          setShowMenuIndex(null);
                                        }}
                                        className="block cursor-pointer w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                      >
                                        {item.perishable ? "Mark not perishable" : "Item is perishable"}
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        // delete second field
                                        removeItemByIndex(idx);
                                      }}
                                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                    >
                                      Delete
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <button onClick={addItem} className="flex items-center gap-1 mt-1 text-xs text-[#424BE0]">
                    Add more <FiPlusCircle /> 
                  </button>

                  <div className="mt-2">
                    <p className="mb-3 text-sm">Add list image (Optional)</p>
                    <div className="flex items-center gap-4">
                      <label className="relative flex items-center justify-center gap-2 px-6 py-4 lg:px-8 lg:py-6 rounded-sm cursor-pointer bg-[#EFF0FD]/50 w-full sm:w-auto">
                      {formData.imagePreview ? (
                          <img src={formData.imagePreview} alt="preview" className="w-8 h-8 lg:w-16 lg:h-16 object-cover rounded-lg" />
                        ) : (
                          <div className="bg-white cursor-pointer rounded-full p-1 shadow-sm">
                            <PlusIcon size={20} />
                          </div>
                        )}
                        <input type="file" accept="image/*" onChange={onFileChange} className="hidden" />
                      </label>

                    </div>
                  </div>
                  {errors.items && <p className="text-red-500 text-sm mt-2">{errors.items}</p>}

                  <div className="flex justify-between mt-6 gap-4">
                    <button onClick={handlePreviousStep} className="flex-1 cursor-pointer py-2 rounded-lg bg-[#EFF0FD] text-[#424BE0] text-sm lg:text-base">
                      Back
                    </button>
                    <button onClick={handleNextStep} className="flex-1 cursor-pointer py-2 rounded-lg bg-[#424BE0] text-white text-sm lg:text-base">
                      {getNextButtonText()}
                    </button>
                  </div>
                </section>
              )}

              {/* Step 4: Drop-off Location - Made responsive */}
              {currentStep === "dropoff" && (
              <section className="bg-white rounded-2xl w-full shadow-sm p-4 lg:p-6">
                  <h2 className="text-xl lg:text-2xl font-semibold text-gray-800 mb-4 lg:mb-6 text-center">
                  Drop-off Location
                  </h2>

                  {/* Location Input */}
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                  Where will this be delivered to?
                  </label>
                  <input
                  type="text"
                  value={formData.dropoffLocation}
                  onChange={(e) => handleInputChange("dropoffLocation", e.target.value)}
                  placeholder="📍 Enter location"
                  className={`w-full px-3 py-2 border text-sm rounded-lg focus:ring-2 focus:ring-[#424BE0] focus:outline-none ${
                      errors.dropoffLocation ? "border-red-500" : "border-gray-300"
                  }`}
                  />
                  {errors.dropoffLocation && (
                  <p className="text-red-500 text-sm mt-1">{errors.dropoffLocation}</p>
                  )}

                  {/* Use Current Location */}
                  <button
                  type="button"
                  onClick={() => handleUseCurrentLocation("dropoff")}
                  className="flex items-center cursor-pointer gap-2 mt-3 text-green-500 text-sm hover:underline"
                  >
                  <FaLocationDot className="text-green-500 text-sm" />
                  {loadingDropoffLocation
                      ? "Fetching current location..."
                      : "Use your current location"}
                  </button>

                  {/* Phone Number to Contact */}
                  <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone number to contact
                  </label>

                  <PhoneInput
                      country={"ng"}
                      value={formData.contactPhone}
                      onChange={(phone) => handleInputChange("contactPhone", phone)}
                      inputClass="!w-full !text-sm !rounded-lg !border-gray-300 !py-2 !px-12 focus:!ring-2 focus:!ring-[#424BE0]"
                      buttonClass="!border-gray-300 !rounded-l-lg"
                  />

                  {/* Save Number Checkbox */}
                  <div className="flex items-center mt-3">
                      <input
                      id="saveNumber"
                      type="checkbox"
                      checked={formData.saveNumber}
                      onChange={(e) => handleInputChange("saveNumber", e.target.checked)}
                      className="w-4 h-4 cursor-pointer text-[#424BE0] border-gray-300 rounded focus:ring-[#424BE0]"
                      />
                      <label htmlFor="saveNumber" className="ml-2 text-sm text-gray-700">
                      Save number for next time
                      </label>
                  </div>
                  </div>

                  {/* Navigation Buttons */}
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
              </section>
              )}

              {/* Step 5: Price - Made responsive */}
              {currentStep === "price" && (
                <section className="bg-white rounded-2xl w-full shadow-sm p-4 lg:p-6">
                  <h2 className="text-xl lg:text-2xl font-semibold text-gray-800 mb-4 text-center">Fix Price Range</h2>

                  <div className="text-center mb-4 lg:mb-6">
                    <h3 className="text-lg lg:text-xl font-bold text-[#424BE0]">₦{formData.price.toLocaleString()}</h3>
                  </div>

                  <input
                    type="range"
                    min={10000}
                    max={15000}
                    step={500}
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-2">
                    <span>₦10,000</span>
                    <span>₦15,000</span>
                  </div>

                  {errors.price && <p className="text-red-500 text-sm mt-2">{errors.price}</p>}

                  <div className="flex justify-between cursor-pointer mt-6 gap-4">
                    <button onClick={handlePreviousStep} className="flex-1 py-2 rounded-lg bg-[#EFF0FD] text-[#424BE0] text-sm lg:text-base">
                      Back
                    </button>
                    <button onClick={handleSubmit} className="flex-1 cursor-pointer py-2 rounded-lg bg-[#424BE0] text-white text-sm lg:text-base">
                      {getNextButtonText()}
                    </button>
                  </div>
                </section>
              )}

              {/* Loader Modal */}
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