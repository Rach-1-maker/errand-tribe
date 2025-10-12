"use client";
import CreatePassword from "@/app/components/CreatePassword";
import { useParams } from "next/navigation";

export default function CreatePasswordPage() {
  const { role, userId } = useParams();


  return (
    <CreatePassword 
    role={role as "tasker" | "runner"}
    userId={userId as string}
    />
  );
}
