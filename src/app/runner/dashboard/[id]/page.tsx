"use client";

import RunnerDashboardContent from "@/app/components/RunnerDashboardContent";
import RunnerWelcome from "@/app/components/RunnerWelcome";
import SideBar from "@/app/components/SideBar";
import TopBar from "@/app/components/TopBar";
import TermsModal from "@/app/components/Terms&Condition";
import { useUser } from "@/app/context/UserContext";
import React, { useState, useEffect } from "react";

export default function RunnerDashboardPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const { userData, isLoading } = useUser();
  const [shouldShowWelcome, setShouldShowWelcome] = useState(false);
  const TERMS_VERSION = 1.0

  useEffect(() => {
    if (!userData || userData.role !== "runner") return;

    const key = `seenRunnerWelcome_${userData.id}`;

    const hasSeen = localStorage.getItem(key);

    if (!hasSeen) {
      setShouldShowWelcome(true);
    }
  }, [userData]);

  // Close Welcome + Save token per user
  const closeWelcome = () => {
    if (!userData?.id) return;

    const key = `seenRunnerWelcome_${userData.id}`;
    localStorage.setItem(key, "true");
    setShouldShowWelcome(false);
  };

  useEffect(() => {
    const handleAuthRequired = () => {
      // Redirect to login page
      window.location.href = '/auth/login';
    };

    window.addEventListener('authRequired', handleAuthRequired);
    return () => window.removeEventListener('authRequired', handleAuthRequired);
  }, []);

  useEffect(() => {
    if (!userData?.id) return;

    const acceptedUsers = JSON.parse(localStorage.getItem("acceptedUsers") || "{}");
    if (!acceptedUsers[userData.id]) {
    acceptedUsers[userData.id] = { 
      accepted: true, 
      version: TERMS_VERSION, 
      acceptedAt: new Date().toISOString()
    };
    localStorage.setItem("acceptedUsers", JSON.stringify(acceptedUsers));
  }
    const userRecord = acceptedUsers[userData.id];
    const isNewUser = localStorage.getItem("isNewUser") === "true";

    if (!userRecord || isNewUser) {
      setShowTerms(true);
      localStorage.removeItem("isNewUser");
    } else {
      setShowTerms(false);
    }
  }, [userData]);
  const transformTaskData = (backendTask: any) => {
  return {
    id: backendTask.id, // This should be the backend UUID
    errand_id: backendTask.id, // Also include as errand_id for compatibility
    task_type: backendTask.category?.name || backendTask.task_type,
    title: backendTask.title,
    description: backendTask.description,
    location: backendTask.location,
    deadline: backendTask.deadline,
    price_min: backendTask.price_min,
    price_max: backendTask.price_max,
    status: backendTask.status,
    createdAt: backendTask.created_at,
    user: backendTask.user || {
      first_name: backendTask.user?.first_name || "Anonymous",
      last_name: backendTask.user?.last_name || "User",
      profile_photo: backendTask.user?.profile_photo || "/default-avatar.png"
    },
  };
};
  return (
    <div className="flex min-h-screen bg-[#F2F2FD] text-[#1E1E1E] flex-col md:flex-row">
      {/* Terms Modal */}
      {showTerms && userData?.id && (
        <TermsModal
          userId={userData.id}
          role="runner"
          onAgree={() => setShowTerms(false)}
        />
      )}

      {/* Sidebar */}
      <div className="hidden md:flex h-screen sticky top-0 z-40">
        <SideBar userType="runner" />
      </div>

      {/* Mobile Sidebar */}
      {isSidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-45 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          ></div>

          <div className="fixed top-0 left-0 w-64 h-full bg-white shadow-lg z-50 md:hidden overflow-y-auto">
            <SideBar userType="runner" onClose={() => setIsSidebarOpen(false)} />
          </div>
        </>
      )}

      <main className="flex-1 flex flex-col min-h-0">
        <div className="shrink-0 sticky top-0 z-50 shadow-sm">
          <TopBar onMenuClick={() => setIsSidebarOpen(true)} />
        </div>

        <div className="flex flex-col w-full h-full overflow-hidden min-h-0">

          {/* 🚀 WELCOME POPUP */}
          <div
            className={`
              transition-all duration-500 ease-in-out 
              relative z-20
              ${shouldShowWelcome ? "max-h-[500px] mb-4" : "max-h-0 mb-0 overflow-hidden"}
            `}
          >
            <RunnerWelcome show={shouldShowWelcome} onClose={closeWelcome} />
          </div>

          {/* DASHBOARD CONTENT */}
          <div className="flex-1 min-h-0 relative z-10">
            <RunnerDashboardContent />
          </div>
        </div>
      </main>
    </div>
  );
}
