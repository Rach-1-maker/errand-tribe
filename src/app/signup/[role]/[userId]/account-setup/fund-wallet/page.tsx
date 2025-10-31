"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { MdClear, MdOutlineArrowBackIos } from "react-icons/md";

export default function FundWalletPage() {
  const router = useRouter();
  const { userId } = useParams(); // dynamic route
  const [balance, setBalance] = useState<number>(0);
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const PUBLIC_KEY = process.env.NEXT_PUBLIC_FLW_PUBLIC_KEY;

  // Load current wallet balance
  useEffect(() => {
    async function fetchWallet() {
      if (!userId) return;
      try {
        const res = await fetch(`${API_URL}/users/${userId}/fund-wallet/`);
        if (!res.ok) return;
        const data = await res.json();
        setBalance(Number(data.new_balance ?? data.balance ?? 0));
      } catch (err) {
        console.error("fetch wallet:", err);
      }
    }
    fetchWallet();
  }, [userId, API_URL]);

  // load flutterwave script
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).FlutterwaveCheckout) return; // already loaded
    const s = document.createElement("script");
    s.src = "https://checkout.flutterwave.com/v3.js";
    s.async = true;
    document.body.appendChild(s);
    return () => {
      // keep script for reuse; don't remove
    };
  }, []);

  const startPayment = async () => {
    if (!amount || Number(amount) <= 0) return;
    if (!PUBLIC_KEY) {
      console.error("Missing public key");
      return;
    }

    setProcessing(true);
    try {
      // create tx_ref on backend
      const createRes = await fetch(`${API_URL}/api/flutterwave/create-payment/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount), user_id: userId }),
      });

      if (!createRes.ok) {
        const err = await createRes.text();
        throw new Error(`Create payment failed: ${err}`);
      }
      const createData = await createRes.json();
      const tx_ref = createData.tx_ref; // string provided by backend
      const currency = createData.currency || "NGN";

      // build flutterwave config
      const config = {
        public_key: PUBLIC_KEY,
        tx_ref,
        amount: Number(amount),
        currency,
        payment_options: "card,banktransfer,ussd",
        customer: {
          email: createData.email || "no-email@example.com",
          phonenumber: createData.phone || "",
          name: createData.name || "Errand Tribe User",
        },
        customizations: {
          title: "Errand Tribe — Fund Wallet",
          description: `Wallet funding: ${currency}${amount}`,
          logo: "/wallet.svg",
        },
        callback: async (response: any) => {
          // response has tx_ref and transaction_id (and status)
          // POST to backend verify endpoint to confirm and credit wallet
          try {
            setLoading(true);
            const verifyRes = await fetch(`${API_URL}/api/flutterwave/verify-payment/`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                transaction_id: response.transaction_id ?? response.id ?? null,
                tx_ref: response.tx_ref,
                user_id: userId,
                amount: Number(amount),
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              // update UI: show success banner and update balance
              setBalance((b) => b + Number(amount));
              setSuccessMsg("Wallet funded successfully.");
            } else {
              console.error("Verification failed", verifyData);
              setSuccessMsg("Payment processed but verification failed. Contact support.");
            }
          } catch (err) {
            console.error("verify error", err);
            setSuccessMsg("Payment processed but verification error occurred.");
          } finally {
            setLoading(false);
            setProcessing(false);
            setShowModal(false);
            // close the flutterwave modal if still open
            if ((window as any).closePaymentModal) {
              try { (window as any).closePaymentModal(); } catch {}
            }
          }
        },
        onclose: () => {
          setProcessing(false);
        },
      };

      // launch checkout (global function added by the script)
      // TypeScript: (window as any).FlutterwaveCheckout
      const FW = (window as any).FlutterwaveCheckout;
      if (typeof FW === "function") {
        FW(config);
      } else {
        console.error("FlutterwaveCheckout not available");
        setProcessing(false);
        setShowModal(false);
      }
    } catch (err) {
      console.error("startPayment error", err);
      setProcessing(false);
      setShowModal(false);
    } finally {
      // don't clear processing here — callback handles finishing
    }
  };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-[#424BE0] relative">
      <div className="flex-1 bg-white rounded-tr-[70px] rounded-br-[70px] px-8 md:px-12 py-8 flex flex-col">
        <button onClick={() => router.back()} className="flex items-center text-gray-600 mb-16 ml-12 hover:text-gray-800">
          <MdOutlineArrowBackIos className="mr-2" /> Back
        </button>

        <h1 className="text-2xl lg:text-4xl font-bold text-[#1A202C] mb-4 ml-12">Fund Wallet</h1>
        <p className="text-[#222124] mb-10 max-w-md ml-12">When you post an errand, funds are automatically held in escrow until completion.</p>

        <div className="py-4 px-2 w-[75%] rounded-xl ml-22 bg-[#FAFAFA] border border-[#E1E1E1] flex flex-col gap-6">
          <div className="bg-[#EEEEEE] py-2 ml-16 mr-16 px-1 rounded-lg text-center">
            <p className="text-[#252C2B] text-xs">Current Wallet Balance</p>
            <h2 className="text-2xl font-bold text-[#424BE0]">₦{balance.toFixed(2)}</h2>
          </div>

          <button onClick={() => { setShowModal(true); setSuccessMsg(null); }} className="w-[50%] py-3 bg-white border text-sm border-[#F1F1F1] text-black rounded-lg font-medium ml-36 transition">
            {"\u002B"} Add Money To Wallet
          </button>
          <p className="text-[#252C2B] text-xs text-center">Funds added via card, bank transfer or mobile money</p>
        </div>

        <button onClick={() => router.push("/dashboard")} className="w-[85%] py-3 mt-16 ml-14 bg-[#424BE0] text-white rounded-lg font-medium hover:bg-indigo-700 transition">
          Continue to dashboard
        </button>

        {successMsg && (
          <div className="mt-6 ml-12 w-[70%] p-3 bg-green-50 border border-green-200 text-green-800 rounded">
            {successMsg}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-lg bg-black/30 flex items-center justify-center z-50">
          <div className="relative bg-white rounded-2xl shadow-lg w-[90%] md:w-[450px] p-6">
            <h2 className="text-lg font-medium mb-3">Fund your wallet</h2>
            <label className="block text-sm text-gray-600 mb-1">Amount (NGN)</label>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full border rounded px-3 py-2 mb-4" type="number" min="50" />
            <div className="flex gap-3">
              <button disabled={processing} onClick={startPayment} className={`flex-1 py-2 rounded ${processing ? "bg-gray-300" : "bg-[#424BE0] text-white"}`}>
                {processing ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
                    Processing...
                  </div>
                ) : "Pay"}
              </button>
              <button onClick={() => setShowModal(false)} className="py-2 px-4 rounded border">Cancel</button>
            </div>

            {loading && <p className="text-sm mt-3 text-gray-600">Verifying transaction...</p>}

            <button className="absolute top-3 right-4" onClick={() => setShowModal(false)}><MdClear /></button>
          </div>
        </div>
      )}
    </div>
  );
}
