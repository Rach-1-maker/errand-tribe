"use client";
import VerifyIdentityPage from "@/app/components/VerifyIdentity";

import { useParams } from "next/navigation";

export default function IdentityVerification() {
  const { role, userId } = useParams();


  return (
    <VerifyIdentityPage
    role={role as "tasker" | "runner"}
    userId={userId as string}
    />
  );
}
