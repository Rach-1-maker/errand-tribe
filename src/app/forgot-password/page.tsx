"use client"
import { use } from "react";
import PasswordReset from "./passwordReset";

interface PasswordProps {
  params: Promise<{
    userType: "tasker" | "runner";
    userId: string
  }>
}

export default function ForgotPasswordPage({ params }: PasswordProps) {
  const { userType, userId } = use(params);

  return <PasswordReset userType={userType} userId={userId} />;
}
