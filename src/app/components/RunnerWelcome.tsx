"use client";

import { FiX } from "react-icons/fi";
import { useUser } from "../context/UserContext";
import { Sparkles } from "lucide-react";
import { IoIosInformationCircleOutline } from "react-icons/io";

export default function RunnerWelcome({
  onClose,
  show,
}: {
  onClose: () => void;
  show?: boolean;
}) {
  const { userData, isLoading } = useUser();

  if (isLoading) return null;

  if (!show || userData?.role !== "runner") return null;

  return (
    <div className="relative w-[95%] bg-linear-to-r from-[#5B63E8] via-[#424BE0] to-[#5B63E8] text-white rounded-2xl shadow-md p-6 md:p-10 my-2 mx-4 md:mx-8 mb-6 z-20">

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
      >
        <FiX size={22} />
      </button>

      {/* Header */}
      <div className="flex flex-col gap-2 pr-8">
        <div className="flex gap-2">
          <span className="p-2 rounded-full bg-white/20">
            <Sparkles />
          </span>
          <h2 className="text-xl md:text-2xl font-semibold">
            You're all set, {userData?.firstName || "Runner"}! 🎉
          </h2>
        </div>
        <p className="text-sm md:text-base ml-13 text-gray-100">
          You're now a <strong>Tier 1 Runner</strong> — here’s how to start earning:
        </p>
      </div>

      {/* Steps */}
      <div className="grid md:grid-cols-3 gap-4 mt-6 ml-10">
        <div className="bg-white/10 rounded-xl p-4">
          <p className="font-semibold mb-3">
            <span className="px-3 py-2 text-sm bg-white/20 rounded-full">1</span> Browse Tasks
          </p>
          <p className="text-xs text-gray-300">
            Explore beginner-friendly tasks tailored for new runners.
          </p>
        </div>

        <div className="bg-white/10 rounded-xl p-4">
          <p className="font-semibold mb-3">
            <span className="px-3 py-2 text-sm bg-white/20 rounded-full">2</span> Accept & Complete
          </p>
          <p className="text-xs text-gray-300">
            Open a task to see details, accept it, and complete it on time.
          </p>
        </div>

        <div className="bg-white/10 rounded-xl p-4">
          <p className="font-semibold mb-3">
            <span className="px-3 py-2 text-sm bg-white/20 rounded-full">3</span> Earn & Level Up
          </p>
          <p className="text-xs text-gray-300">
            Build your rating and unlock higher-paying tasks.
          </p>
        </div>
      </div>

      {/* Pro Tip */}
      <div className="bg-[#424BE0] rounded-xl p-4 mt-4 ml-10">
        <div className="flex gap-x-3">
          <span className="p-2 bg-white/20 rounded-full">
            <IoIosInformationCircleOutline className="text-lg" />
          </span>
          <div>
            <p className="font-semibold">Pro Tip</p>
            <p className="text-xs text-white/80">
              Look for tasks tagged <span className="text-white font-medium">"Great for Beginners"</span> — 
              they’re simple, nearby, and perfect for your first payout.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
