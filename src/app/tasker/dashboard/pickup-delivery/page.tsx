// app/tasker/dashboard/pickup-delivery/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import SideBar from "@/app/components/SideBar";
import TopBar from "@/app/components/TopBar";
import { FiArrowLeft } from "react-icons/fi";
import { MdClear } from "react-icons/md";
import { IoAdd } from "react-icons/io5";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { PlusIcon } from "lucide-react";
import { PickupDeliveryTaskData } from "@/app/types/task";
import { useTaskStorage } from "@/app/hooks/useTaskStorage";
import { useUser } from "@/app/context/UserContext";
import { TokenManager } from "@/app/utils/tokenUtils";

type Step = 1 | 2 | 3 | 4;

export default function PickupAndDeliveryPage() {
  const router = useRouter();
  const { saveTaskToStorage } = useTaskStorage();
  const { userData } = useUser();

  // Step control
  const [step, setStep] = useState<Step>(1);

  // Step 1 (title & dates)
  const [errandTitle, setErrandTitle] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [time, setTime] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showDeadlineCalendar, setShowDeadlineCalendar] = useState(false);

  // Step 2 (locations & phones)
  const [pickup, setPickup] = useState("");
  const [pickupSuggestions, setPickupSuggestions] = useState<string[]>([]);
  const [senderPhone, setSenderPhone] = useState("");
  const [saveSender, setSaveSender] = useState(false);

  const [dropoff, setDropoff] = useState("");
  const [dropoffSuggestions, setDropoffSuggestions] = useState<string[]>([]);
  const [recipientPhone, setRecipientPhone] = useState("");
  const [saveRecipient, setSaveRecipient] = useState(false);

  // Step 3 (details)
  const [signatureRequired, setSignatureRequired] = useState<"Yes" | "No" | "">("");
  const [fragile, setFragile] = useState<"Yes" | "No" | "">("");
  const [note, setNote] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Step 4 (price)
  const [price, setPrice] = useState<number>(15000);

  // UI / misc
  const [loadingPickupGeo, setLoadingPickupGeo] = useState(false);
  const [loadingDropoffGeo, setLoadingDropoffGeo] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Add mobile sidebar state
  const [isPosting, setIsPosting] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_OPENCAGE_API_KEY;

  // fetch location suggestions (OpenCage)
  const fetchLocations = async (query: string, setter: (list: string[]) => void) => {
    if (!query || query.length < 3) return setter([]);
    if (!apiKey) return; // don't attempt without key
    try {
      const res = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${apiKey}&limit=5`
      );
      const data = await res.json();
      const suggestions = (data.results || []).map((r: any) => r.formatted).slice(0, 5);
      setter(suggestions);
    } catch (err) {
      console.error("OpenCage error", err);
      setter([]);
    }
  };

  // Quick date helpers
  const pickQuickDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setStartDate(d);
    setShowStartCalendar(false);
  };

  // image preview
  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  // Geolocation -> fetch address using OpenCage
  const geocode = async (lat: number, lng: number) => {
    if (!apiKey) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    try {
      const res = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${apiKey}&limit=1`
      );

      const json = await res.json();
      if (json?.results?.length) return json.results[0].formatted;
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  const useCurrentLocationFor = (target: "pickup" | "dropoff") => {
    const setLoading = target === "pickup" ? setLoadingPickupGeo : setLoadingDropoffGeo;
    setLoading(true);
    if (!navigator.geolocation) {
      setErrors((p) => ({ ...p, [target]: "Geolocation not supported" }));
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const address = await geocode(pos.coords.latitude, pos.coords.longitude);
        if (target === "pickup") setPickup(address);
        else setDropoff(address);
        setLoading(false);
      },
      (err) => {
        setErrors((p) => ({ ...p, [target]: "Unable to fetch location" }));
        setLoading(false);
      }
    );
  };

  // Validation per step
  const validateStep = (s: Step) => {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!errandTitle.trim()) e.title = "Title is required";
      if (!startDate) e.startDate = "Start date is required";
      if (!deadline) e.deadline = "Deadline is required";
      if (!time) e.time = "Time is required";
    } else if (s === 2) {
      if (!pickup.trim()) e.pickup = "Pickup is required";
      if (!senderPhone.trim()) e.senderPhone = "Sender phone required";
      if (!dropoff.trim()) e.dropoff = "Dropoff is required";
      if (!recipientPhone.trim()) e.recipientPhone = "Recipient phone required";
    } else if (s === 3) {
      // no strict requirements, optional
    } else if (s === 4) {
      if (!price || price < 15000) e.price = "Choose a valid price";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep((p) => (p < 4 ? ((p + 1) as Step) : p));
  };
  const goBack = () => setStep((p) => (p > 1 ? ((p - 1) as Step) : p));

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      setStep(4);
      return;
    }

    setIsPosting(true)

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

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      if (!API_URL) throw new Error("API URL not configured");

      // Prepare form data for image upload
      const formData = new FormData();
      formData.append("title", errandTitle);
      formData.append("urgent", urgent.toString());
      formData.append("start_date", startDate?.toISOString() || "");
      formData.append("deadline", deadline?.toISOString() || "");
      formData.append("time", time);
      formData.append("pickup_location", pickup);
      formData.append("sender_phone", senderPhone);
      formData.append("dropoff_location", dropoff);
      formData.append("recipient_phone", recipientPhone);
      formData.append("signature_required", signatureRequired);
      formData.append("fragile", fragile);
      formData.append("note", note);
      formData.append("price_min", price.toString());
      formData.append("price_max", price.toString());
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const response = await fetch(`${API_URL}/api/errands/pickup-delivery/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
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
      const taskData: PickupDeliveryTaskData = {
        id: data.id || `task-${Date.now()}`,
        type: "Pickup & Delivery",
        title: errandTitle,
        details: note,
        description: note,
        location: pickup,
        dropoff: dropoff,
        deadline: deadline!,
        price: price,
        status: "posted",
        createdAt: new Date().toISOString(),
        startDate: startDate || null,
        time: time,
        pickup,
        senderPhone,
        recipientPhone,
        signatureRequired,
        fragile,
        note,
        imagePreview: imagePreview || undefined,
        urgent
      };

      // ✅ Use the custom hook to save the task
      const saveSuccess = saveTaskToStorage(taskData);
      
      if (saveSuccess) {
        console.log("✅ Pickup & Delivery task successfully saved to user-specific storage");
      } else {
        console.warn("⚠️ Failed to save task to storage, using fallback");
        // Fallback to old method
        localStorage.setItem("lastPostedTask", JSON.stringify(taskData));
      }

      toast.success("Pickup & Delivery task posted successfully!");
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

  // Mini sidebar steps
  const miniSteps = [
    { id: "title", label: "Title & Date" },
    { id: "location", label: "Location" },
    { id: "details", label: "Details" },
    { id: "price", label: "Fix Price" },
  ];

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

      <div className="flex-1 flex flex-col min-h-screen w-full">
        {/* TopBar with mobile menu toggle */}
        <div className="sticky top-0 z-10">
          <TopBar onMenuClick={() => setIsSidebarOpen(true)} />
        </div>

        <div className="flex flex-1 flex-col lg:flex-row p-4 lg:p-6 gap-4 lg:gap-6">
          {/* Mini Sidebar - Made responsive */}
          <aside className="w-full lg:w-72 bg-white rounded-3xl shadow-sm p-4 lg:p-6 h-fit">
            <div className="flex items-center gap-3 mb-6 border-b pb-4 border-[#E1E1E1]/88">
              <div className="w-8 h-8 lg:w-11 lg:h-11 rounded-xl flex items-center justify-center">
                <Image src="/pickup.svg" alt="Pickup" width={32} height={32} className="lg:w-16 lg:h-16"/>
              </div>
              <div>
                <h3 className="text-black text-base lg:text-lg">Pickup & Delivery</h3>
              </div>
            </div>

            <nav className="space-y-2">
              {miniSteps.map((ms, i) => (
                <button
                  key={ms.id}
                  onClick={() => setStep((i + 1) as Step)}
                  className={`w-full text-left p-2 lg:p-3 rounded-xl text-sm lg:text-base transition ${
                    step === (i + 1)
                      ? "bg-[#EFF0FD] text-[#424BE0] font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {ms.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main form area - Made responsive */}
          <div className="flex-1 flex justify-center relative flex-col overflow-y-auto">
            {/* Close Button - Made responsive */}
            <button 
              onClick={() => router.push("/tasker/dashboard/[id]")} 
              className="absolute cursor-pointer top-2 lg:top-4 right-2 lg:right-4 z-50 text-black transition hover:scale-105"
            >
              <MdClear className="w-6 h-6 lg:w-8 lg:h-8 bg-white rounded-full p-1" />
            </button>
            
            <div className="w-full max-w-lg mx-auto">
              {/* Step 1: Title & Date - Made responsive */}
              {step === 1 && (
                <section className="bg-white rounded-2xl shadow-sm p-4 lg:p-6">
                  <h2 className="text-xl lg:text-2xl text-center font-semibold text-gray-800 mb-4 lg:mb-6">
                    Let's Start With The Basics
                  </h2>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Errand Title *</label>
                    <input
                      type="text"
                      value={errandTitle}
                      onChange={(e) => setErrandTitle(e.target.value)}
                      placeholder="e.g., Pick up documents from office"
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#424BE0] focus:outline-none ${
                        errors.title ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                  </div>

                  {/* Start date */}
                  <div className="relative mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">When do you need this done? *</label>
                    <button
                      onClick={() => setShowStartCalendar((s) => !s)}
                      className={`w-full cursor-pointer text-left px-3 py-2 border rounded-lg bg-white text-sm ${
                        errors.startDate ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      {startDate ? startDate.toDateString() : "Select date"}
                    </button>
                    {showStartCalendar && (
                      <div className="absolute z-30 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-2">
                        <DayPicker
                          mode="single"
                          selected={startDate ?? undefined}
                          onSelect={(d) => {
                            setStartDate(d || null);
                            setShowStartCalendar(false);
                          }}
                        />
                      </div>
                    )}
                    {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
                  </div>

                  {/* Urgent toggle */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Is this delivery urgent?</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setUrgent(true)}
                        className={`px-4 py-1 cursor-pointer rounded-xl border text-sm ${
                          urgent ? "bg-[#424BE0] text-white" : "bg-gray-100"
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setUrgent(false)}
                        className={`px-4 py-1 cursor-pointer rounded-xl border text-sm ${
                          !urgent ? "bg-[#424BE0] text-white" : "bg-gray-100"
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  {/* Deadline + time - Made responsive */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Deadline *</label>
                      <button
                        onClick={() => setShowDeadlineCalendar((s) => !s)}
                        className={`w-full cursor-pointer text-left px-3 py-2 border rounded-lg bg-white text-sm ${
                          errors.deadline ? "border-red-500" : "border-gray-300"
                        }`}
                      >
                        {deadline ? deadline.toDateString() : "Select deadline"}
                      </button>
                      {showDeadlineCalendar && (
                        <div className="absolute z-30 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-2">
                          <DayPicker
                            mode="single"
                            selected={deadline ?? undefined}
                            onSelect={(d) => {
                              setDeadline(d || null);
                              setShowDeadlineCalendar(false);
                            }}
                          />
                        </div>
                      )}
                      {errors.deadline && <p className="text-red-500 text-sm mt-1">{errors.deadline}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Time *</label>
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className={`w-full px-3 py-2 border text-sm rounded-lg focus:ring-2 focus:ring-[#424BE0] ${
                          errors.time ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.time && <p className="text-red-500 text-sm mt-1">{errors.time}</p>}
                    </div>
                  </div>

                  {/* Quick select */}
                  <div className="flex gap-2 mb-6 flex-wrap">
                    <button onClick={() => pickQuickDate(0)} className="px-3 py-2 cursor-pointer text-[#424BE0] border rounded-lg text-sm hover:bg-[#EFF0FD]">Today</button>
                    <button onClick={() => pickQuickDate(1)} className="px-3 py-2 cursor-pointer text-[#424BE0] border rounded-lg text-sm hover:bg-[#EFF0FD]">Tomorrow</button>
                    <button onClick={() => pickQuickDate(7)} className="px-3 py-2 cursor-pointer text-[#424BE0] border rounded-lg text-sm hover:bg-[#EFF0FD]">Next Week</button>
                  </div>

                  <div className="flex justify-center">
                    <button onClick={goNext} className="w-full cursor-pointer sm:w-auto px-8 sm:px-46 py-2 rounded-lg bg-[#424BE0] text-white text-sm">Next</button>
                  </div>
                </section>
              )}

              {/* Step 2: Location - Made responsive */}
              {step === 2 && (
                <section className="bg-white rounded-2xl shadow-sm p-4 lg:p-6 w-full">
                  <h2 className="text-xl lg:text-2xl font-semibold text-gray-800 mb-4 text-center">Tell Us Where</h2>

                  {/* Pickup */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Where should runner pick up from?</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={pickup}
                        onChange={(e) => {
                          setPickup(e.target.value);
                          fetchLocations(e.target.value, setPickupSuggestions);
                        }}
                        placeholder="Enter location"
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#424BE0] focus:outline-none ${
                          errors.pickup ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {pickupSuggestions.length > 0 && (
                        <ul className="absolute z-30 bg-white border rounded-lg mt-1 w-full max-h-40 overflow-y-auto">
                          {pickupSuggestions.map((s, i) => (
                            <li
                              key={i}
                              onClick={() => {
                                setPickup(s);
                                setPickupSuggestions([]);
                              }}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                            >
                              {s}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {errors.pickup && <p className="text-red-500 text-sm mt-1">{errors.pickup}</p>}
                  </div>

                  {/* Sender phone */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sender phone number</label>
                    <PhoneInput
                      country={"ng"}
                      value={senderPhone}
                      onChange={(val) => setSenderPhone(val)}
                      inputClass="!w-full !text-sm !rounded-lg !border-gray-300 !py-2 !px-12"
                      buttonClass="!border-gray-300"
                    />
                    <div className="flex items-center mt-2">
                      <input id="saveSender" type="checkbox" checked={saveSender} onChange={(e) => setSaveSender(e.target.checked)} className="h-4 w-4" />
                      <label htmlFor="saveSender" className="ml-2 text-xs text-gray-700">Save number for next time</label>
                    </div>
                    {errors.senderPhone && <p className="text-red-500 text-sm mt-1">{errors.senderPhone}</p>}
                  </div>

                  {/* Dropoff */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Where should it be delivered to?</label>
                    <input
                      type="text"
                      value={dropoff}
                      onChange={(e) => {
                        setDropoff(e.target.value);
                        fetchLocations(e.target.value, setDropoffSuggestions);
                      }}
                      placeholder="Enter address"
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#424BE0] focus:outline-none ${
                        errors.dropoff ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {dropoffSuggestions.length > 0 && (
                      <ul className="absolute z-30 bg-white border rounded-lg mt-1 w-full max-h-40 overflow-y-auto">
                        {dropoffSuggestions.map((s, i) => (
                          <li
                            key={i}
                            onClick={() => {
                              setDropoff(s);
                              setDropoffSuggestions([]);
                            }}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                          >
                            {s}
                          </li>
                        ))}
                      </ul>
                    )}
                    <button
                      type="button"
                      onClick={() => useCurrentLocationFor("dropoff")}
                      className="flex items-center cursor-pointer gap-2 mt-2 text-green-600 text-sm"
                    >
                      {loadingDropoffGeo ? "Fetching current location..." : "Use your current location"}
                    </button>
                    {errors.dropoff && <p className="text-red-500 text-sm mt-1">{errors.dropoff}</p>}
                  </div>

                  {/* Recipient phone */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Recipient phone number</label>
                    <PhoneInput
                      country={"ng"}
                      value={recipientPhone}
                      onChange={(val) => setRecipientPhone(val)}
                      inputClass="!w-full !text-sm !rounded-lg !border-gray-300 !py-2 !px-12"
                      buttonClass="!border-gray-300"
                    />
                    <div className="flex items-center mt-2">
                      <input id="saveRecipient" type="checkbox" checked={saveRecipient} onChange={(e) => setSaveRecipient(e.target.checked)} className="h-4 w-4" />
                      <label htmlFor="saveRecipient" className="ml-2 text-xs text-gray-700">Save number for next time</label>
                    </div>
                    {errors.recipientPhone && <p className="text-red-500 text-sm mt-1">{errors.recipientPhone}</p>}
                  </div>

                  <div className="flex justify-between gap-4">
                    <button onClick={goBack} className="flex-1 cursor-pointer py-2 bg-[#EFF0FD] text-[#424BE0] rounded-lg text-sm lg:text-base">
                      Back
                    </button>
                    <button onClick={goNext} className="flex-1 cursor-pointer py-2 bg-[#424BE0] text-white rounded-lg text-sm lg:text-base">Next</button>
                  </div>
                </section>
              )}

              {/* Step 3: Details - Made responsive */}
              {step === 3 && (
                <section className="bg-white rounded-2xl shadow-sm p-4 lg:p-6 ">
                  <h2 className="text-xl lg:text-2xl font-semibold text-gray-800 mb-4 text-center">Provide More Details</h2>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Does the runner have to sign for the package?</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setSignatureRequired("Yes")}
                        className={`px-4 py-1 cursor-pointer rounded-xl border text-sm ${signatureRequired === "Yes" ? "bg-[#424BE0] text-white" : "bg-gray-100"}`}
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setSignatureRequired("No")}
                        className={`px-4 py-1 cursor-pointer rounded-xl border text-sm ${signatureRequired === "No" ? "bg-[#424BE0] text-white" : "bg-gray-100"}`}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Is the item fragile or temperature-sensitive?</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setFragile("Yes")}
                        className={`px-4 py-1 cursor-pointer rounded-xl border text-sm ${fragile === "Yes" ? "bg-[#424BE0] text-white" : "bg-gray-100"}`}
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setFragile("No")}
                        className={`px-4 py-1 rounded-xl cursor-pointer border text-sm ${fragile === "No" ? "bg-[#424BE0] text-white" : "bg-gray-100"}`}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Add image (optional)</p>
                    <label className="relative flex items-center justify-center w-40 h-32 bg-[#EFF0FD] rounded-lg cursor-pointer overflow-hidden group">
                      {/* If image is selected, show preview */}
                      {imagePreview ? (
                        <>
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-200 group-hover:opacity-70"
                          />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                            <PlusIcon size={24} className="text-white cursor-pointer bg-black/40 rounded-full p-1" />
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <PlusIcon size={24} className="bg-white cursor-pointer rounded-full p-1 mb-2" />
                          <span className="text-xs">Click to add</span>
                        </div>
                      )}

                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div className="flex justify-between gap-4">
                    <button onClick={goBack} className="flex-1 cursor-pointer py-2 lg:py-3 rounded-lg bg-[#EFF0FD] text-[#424BE0] text-sm lg:text-base">
                      Back
                    </button>
                    <button onClick={goNext} className="flex-1 cursor-pointer py-2 lg:py-3 bg-[#424BE0] text-white rounded-lg text-sm lg:text-base">Continue</button>
                  </div>
                </section>
              )}

              {/* Step 4: Price - Made responsive */}
              {step === 4 && (
                <section className="bg-white mb-38 rounded-2xl shadow-sm p-4 lg:p-6 w-full">
                  <h2 className="text-xl lg:text-2xl font-semibold text-gray-800 mb-2 text-center">Fix Price Range</h2>

                  <div className="text-center mb-2 lg:mb-6">
                    <div className="text-xl lg:text-2xl font-bold text-[#424BE0] mb-1">₦{price.toLocaleString()}</div>
                  </div>

                  <input
                    type="range"
                    min={15000}
                    max={30000}
                    step={1000}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full"
                  />

                  <div className="flex justify-between text-sm text-gray-500 mt-2 mb-4 lg:mb-6">
                    <span>₦15,000</span>
                    <span>₦30,000</span>
                  </div>

                  {errors.price && <p className="text-red-500 text-sm mb-4">{errors.price}</p>}

                  <div className="flex justify-between gap-4">
                    <button onClick={goBack} className="flex-1 cursor-pointer py-2 lg:py-3 bg-[#EFF0FD] text-[#424BE0] text-sm lg:text-base">
                      Back
                    </button>
                    <button 
                      onClick={handleSubmit}
                      disabled={isPosting}
                      className="flex-1 cursor-pointer py-2 lg:py-3 bg-[#424BE0] text-white rounded-lg text-sm lg:text-base disabled:opacity-50"
                    >
                      {isPosting ? "Posting..." : "Post task"}
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