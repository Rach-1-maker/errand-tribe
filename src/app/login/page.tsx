"use client";
import React from "react";
import LoginForm from "@/app/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#ECEDFC] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white shadow-md rounded-2xl p-8">
        <LoginForm />
      </div>
    </div>
  );
}
