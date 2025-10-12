"use client";

import { use } from "react";
import LoginForm from "@/app/components/LoginForm";

interface LoginPageProps {
  params: Promise<{ role: string }>;
}

export default function LoginPage({ params }: LoginPageProps) {
  const { role } = use(params);
  
  return <LoginForm role={role as "tasker" | "runner"} />;
}