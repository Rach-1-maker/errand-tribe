"use client";

import VerifyEmailPage from "@/app/components/VerifyEmail";

import { useParams } from "next/navigation";

export default function EmailVerification() {
  const { role, userId } = useParams();


  return (
    <VerifyEmailPage
    role={role as "tasker" | "runner"}
    userId={userId as string}
    />
  );
}
