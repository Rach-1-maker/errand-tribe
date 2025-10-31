"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MdOutlineArrowBackIos } from "react-icons/md";
import { IoIosArrowDown } from "react-icons/io";
import { enableLocation } from "../services/locationService";

// --- Utility: Reverse Geocoding ---
const getAddressFromCoordinates = async (lat: number, lng: number) => {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    );
    return await res.json();
  } catch (err) {
    console.error("Geocoding error:", err);
    return null;
  }
};

// --- Utility: Check browser permission state ---
const checkLocationPermission = async () => {
  if (navigator.permissions) {
    const result = await navigator.permissions.query({ name: "geolocation" as PermissionName });
    return result.state; // 'granted', 'denied', or 'prompt'
  }
  return "unknown";
};

interface LocationAccessProps {
  role: "tasker" | "runner";
  userId: string;
}

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export default function LocationPermissionPage({ role, userId }: LocationAccessProps) {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [locationError, setLocationError] = useState("");
  const [userAddress, setUserAddress] = useState<string>("");
  const locationUpdateInterval = useRef<NodeJS.Timeout | null>(null);

  // --- Check browser support ---
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.");
    }
  }, []);

  // --- Get current location ---
  const getCurrentLocation = (): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error("Geolocation not supported"));
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp,
          }),
        (err) => {
          const message =
            err.code === err.PERMISSION_DENIED
              ? "Location permission denied. Please enable it in browser settings."
              : err.code === err.TIMEOUT
              ? "Location request timed out. Try again."
              : "Unable to get location.";
          reject(new Error(message));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  };

  // --- Handle dropdown selection ---
  const handleSelect = async (option: string) => {
    setSelectedOption(option);
    setShowDropdown(false);
    setError("");
    setLocationError("");

    const permissionState = await checkLocationPermission();
    if (permissionState === "denied") {
      setLocationError("Location access denied. Enable it in browser settings.");
      return;
    }

    try {
      setLoading(true);
      const location = await getCurrentLocation();
      setUserLocation(location);

      const addressData = await getAddressFromCoordinates(location.latitude, location.longitude);
      if (addressData) {
        const formattedAddress = `${addressData.city || "Unknown"}, ${addressData.countryName || "Unknown"}`;
        setUserAddress(formattedAddress);
      }
    } catch (err: any) {
      setLocationError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Continue Button ---
  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOption) return setError("Please select a location access option");
    if (!userLocation) return setError("Please allow location access to continue");

    setLoading(true);
    setError("");

    try {
      const response = await enableLocation(
        userId,
        selectedOption as "while_using_app" | "always",
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          accuracy: userLocation.accuracy,
          address: userAddress,
        }
      );

      if (response.success) {
        if (response.user) localStorage.setItem("user", JSON.stringify(response.user));
        router.push(`/signup/${role}/${userId}/welcome-intro/`);
      } else {
        throw new Error(response.message || "Unable to save location access");
      }
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err.message || "Unable to save location access. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- Continuous updates if 'Always' selected ---
  useEffect(() => {
    if (selectedOption !== "always") return;

    const interval = setInterval(async () => {
      try {
        const currentLocation = await getCurrentLocation();
        setUserLocation(currentLocation);

        const addressData = await getAddressFromCoordinates(currentLocation.latitude, currentLocation.longitude);
        const formattedAddress = addressData
          ? `${addressData.city || "Unknown"}, ${addressData.countryName || "Unknown"}`
          : userAddress;

        await enableLocation(userId, "always", {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          accuracy: currentLocation.accuracy,
          address: formattedAddress,
        });
      } catch (err) {
        console.error("Periodic location update error:", err);
      }
    }, 10 * 60 * 1000); // every 10 mins

    return () => clearInterval(interval);
  }, [selectedOption]);

  return (
    <div className="h-screen flex bg-[#424BE0]">
      {/* Left Section (Form) */}
      <div className="flex-1 flex flex-col bg-white shadow-lg rounded-tr-[60px] rounded-br-[60px] px-8 justify-center">
        {/* Back */}
        <button onClick={() => router.back()} className="flex items-center text-gray-600 mb-24 hover:text-gray-800 mt-4">
          <MdOutlineArrowBackIos className="mr-2 ml-16" /> Back
        </button>

        {/* Heading */}
        <h1 className="text-2xl md:text-3xl font-bold ml-16 text-gray-800 mb-4">
          Enable Location
        </h1>
        <p className="text-gray-500 mb-8 text-sm ml-16 max-w-md">
          {role === "tasker"
            ? "Help taskers find you and get accurate delivery estimates."
            : "Allow Errand Tribe to access your location for better matching and accurate delivery."}
        </p>

        {/* Location Info */}
        {userLocation && (
          <div className="ml-16 mb-4 p-3 w-[72%] bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            ✅ Location accessed: {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
            <br />
            Accuracy: ±{userLocation.accuracy.toFixed(0)}m
            {userAddress && (
              <>
                <br />📍 {userAddress}
              </>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleContinue} className="space-y-6">
          <div className="ml-16">
            <label className="block text-gray-700 font-medium mb-4">Location Access</label>

            {/* Dropdown */}
            <div
              onClick={() => setShowDropdown((p) => !p)}
              className="border border-gray-300 text-sm rounded-lg p-3 flex items-center justify-between cursor-pointer w-[80%] hover:border-[#424BE0] transition"
            >
              <span className={selectedOption ? "text-[#424BE0]" : "text-gray-400"}>
                {selectedOption === "while_using_app"
                  ? "While Using App"
                  : selectedOption === "always"
                  ? "Always"
                  : "Select an option"}
              </span>
              <IoIosArrowDown
                className={`text-2xl transition-transform text-[#93a1b1] ${showDropdown ? "rotate-180" : "rotate-0"}`}
              />
            </div>

            {/* Dropdown Options */}
            {showDropdown && (
              <div className="absolute left-16 ml-8 mt-1 w-[33%] bg-white border border-gray-200 rounded-lg shadow-sm z-10">
                <div
                  onClick={() => handleSelect("while_using_app")}
                  className="p-3 hover:bg-gray-100 cursor-pointer text-gray-700 border-b border-gray-100"
                >
                  While Using App
                  <p className="text-xs text-gray-500 mt-1">Access location only when using the app</p>
                </div>
                <div
                  onClick={() => handleSelect("always")}
                  className="p-3 hover:bg-gray-100 cursor-pointer text-gray-700"
                >
                  Always
                  <p className="text-xs text-gray-500 mt-1">Access location even when app is closed</p>
                </div>
              </div>
            )}

            {/* Errors */}
            {locationError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{locationError}</p>
              </div>
            )}
            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
          </div>

          {/* Continue Button */}
          <button
            type="submit"
            disabled={!selectedOption || !userLocation || loading}
            className={`py-3 rounded-lg font-semibold transition w-[75%] ml-16 mt-8 ${
              selectedOption && userLocation && !loading
                ? "bg-[#424BE0] text-white hover:bg-indigo-700"
                : "bg-[#E0E0E0] text-gray-400 cursor-not-allowed"
            }`}
          >
            {loading ? "Processing..." : "Continue"}
          </button>
        </form>
      </div>

      {/* Right Section */}
      <div className="hidden md:flex flex-1 bg-[#424BE0] items-center justify-center text-center px-8">
        <div>
          <h2 className="text-white text-2xl md:text-3xl font-semibold mb-6 max-w-lg leading-tight whitespace-pre-line">
            {role === "tasker"
              ? "Whatever your errand is,\nErrand Tribe's got you covered!"
              : "Earn with every errand!\nSafe, seamless, and rewarding."}
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
