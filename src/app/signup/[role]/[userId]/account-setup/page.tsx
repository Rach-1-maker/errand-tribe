// "use client";

// import { useRouter, useSearchParams } from "next/navigation";
// import { useEffect } from "react";

// export default function AccountSetupPage() {
//   const searchParams = useSearchParams();
//   const role = searchParams.get("role") || "Tasker";
//   const router = useRouter();

//   useEffect(() => {
//     if (role === "Tasker") {
//       router.replace(`/signup/${role}/account-setup/fund-wallet/`);
//     } else {
//       router.replace("/account-setup/withdrawal?role=Runner");
//     }
//   }, [role, router]);

//   return null;
// }