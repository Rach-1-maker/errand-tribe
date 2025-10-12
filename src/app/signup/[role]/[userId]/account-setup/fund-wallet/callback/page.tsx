// src/app/signup/[role]/[userId]/account-setup/fund-wallet/callback/page.tsx
"use client";

import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function FundWalletCallback() {
  const router = useRouter();
  const params = useParams();
  const search = useSearchParams();
  const { userId, role } = params as { userId: string; role: string };

  const tx_ref = search.get("tx_ref") ?? search.get("transaction_id") ?? "";
  const transaction_id = search.get("transaction_id") ?? "";
  const [status, setStatus] = useState<"idle"|"verifying"|"success"|"failed">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [newBalance, setNewBalance] = useState<number | null>(null);

  useEffect(() => {
    async function verify() {
      setStatus("verifying");
      setMessage(null);
      // expected_amount we stored in sessionStorage when we created the payment. Use that.
      const stored = sessionStorage.getItem(`flw_amount_${tx_ref}`);
      const expected_amount = stored ? Number(stored) : null;

      try {
        const res = await fetch(`/api/flutterwave/verify-payment/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transaction_id,
            tx_ref,
            user_id: userId,
            expected_amount
          })
        });
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setNewBalance(Number(data.new_balance));
          setMessage("Payment verified. Your wallet has been updated.");
          // optionally redirect to dashboard after a few secs
          setTimeout(() => router.push("/dashboard"), 2500);
        } else {
          setStatus("failed");
          setMessage(data.error || data.message || "Verification failed");
        }
      } catch (err) {
        setStatus("failed");
        setMessage("Unable to verify payment at this time.");
      }
    }

    // If query params are present we attempt verification
    if (tx_ref) verify();
  }, [tx_ref, transaction_id, router, userId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#ECEDFC] p-6">
      <div className="w-full max-w-md bg-white rounded-xl p-6 text-center shadow">
        {status === "verifying" && (
          <>
            <div className="mb-4">Verifying payment...</div>
            <svg className="animate-spin h-8 w-8 mx-auto text-indigo-600" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
              <path d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" fill="currentColor" className="opacity-75"/>
            </svg>
          </>
        )}

        {status === "success" && (
          <>
            <h2 className="text-xl font-semibold text-green-600 mb-2">Payment successful</h2>
            <p className="text-sm text-gray-700 mb-4">{message}</p>
            {newBalance !== null && <p className="font-medium">New balance: ₦{newBalance.toFixed(2)}</p>}
            <div className="mt-6">
              <button onClick={() => router.push("/dashboard")} className="px-4 py-2 rounded-md bg-indigo-600 text-white">Go to dashboard</button>
            </div>
          </>
        )}

        {status === "failed" && (
          <>
            <h2 className="text-xl font-semibold text-red-600 mb-2">Verification failed</h2>
            <p className="text-sm text-gray-700 mb-4">{message}</p>
            <div className="mt-6">
              <button onClick={() => router.push(`/signup/${role}/${userId}/account-setup/fund-wallet`)} className="px-4 py-2 rounded-md border">Back</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
