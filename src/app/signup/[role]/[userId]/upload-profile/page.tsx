"use client";
import ProfileUploadPage from "@/app/components/ProfileUpload";

import { useParams } from "next/navigation";

export default function IdentityVerification() {
  const { role, userId } = useParams();


  return (
    <ProfileUploadPage
    role={role as "tasker" | "runner"}
    userId={userId as string}
    />
  );
}
