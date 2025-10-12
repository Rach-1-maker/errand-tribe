"use client";
import WelcomePage from "@/app/components/Welcome";

import { useParams } from "next/navigation";

export default function WelcomeAndSecurityCheck() {
  const { role, userId } = useParams();


  return (
    <WelcomePage
    role={role as "tasker" | "runner"}
    userId={userId as string}
    />
  );
}
