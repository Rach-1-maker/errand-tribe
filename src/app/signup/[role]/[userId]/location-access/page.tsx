"use client";
import LocationPermissionPage from "@/app/components/LocationAccess";

import { useParams } from "next/navigation";

export default function IdentityVerification() {
  const { role, userId } = useParams();


  return (
    <LocationPermissionPage
    role={role as "tasker" | "runner"}
    userId={userId as string}
    />
  );
}
