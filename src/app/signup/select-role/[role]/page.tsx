"use client";
import { useParams } from "next/navigation";
import SignupForm from "@/app/components/SignUpForm";

export default function SelectRolePage() {
  const { role } = useParams(); 

  return (
    <SignupForm role={role as "tasker" | "runner"} />
  );
}
