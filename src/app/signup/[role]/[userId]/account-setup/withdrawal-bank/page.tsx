"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";

interface Bank {
  name: string;
  code: string;
}

export default function WithdrawalMethod() {
  const searchParams = useSearchParams();
  const preselectedBank = searchParams.get("bank") || "";
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBank, setSelectedBank] = useState(preselectedBank);
  const [selectedBankCode, setSelectedBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [country, setCountry] = useState("NG");

  // Fetch banks
  useEffect(() => {
    async function fetchBanks() {
      const res = await fetch(`/api/flutterwave/banks/${country}`);
      const data = await res.json();
      if (data.status === "success") setBanks(data.data);
    }
    fetchBanks();
  }, [country]);

  // Get bank code from selected name
  useEffect(() => {
    const found = banks.find((b) => b.name === selectedBank);
    setSelectedBankCode(found?.code || "");
  }, [selectedBank, banks]);

  // Verify account number (Nigeria only)
  useEffect(() => {
    if (country === "NG" && accountNumber.length === 10 && selectedBankCode) {
      setIsConfirming(true);
      setAccountName("");
      fetch("/api/flutterwave/verify-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_number: accountNumber,
          bank_code: selectedBankCode,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "success") {
            setAccountName(data.data.account_name);
          } else {
            setAccountName("Invalid account");
          }
          setIsConfirming(false);
        })
        .catch(() => {
          setAccountName("Verification failed");
          setIsConfirming(false);
        });
    }
  }, [accountNumber, selectedBankCode, country]);

  return (
    <div className="h-screen flex flex-col md:flex-row bg-[#424BE0] relative">
      <div className="flex-1 bg-white rounded-tr-[70px] rounded-br-[70px] px-10 md:px-14 py-10 flex flex-col">
        <button
          onClick={() => history.back()}
          className="text-gray-600 text-sm mb-10 hover:text-gray-800"
        >
          ← Back
        </button>

        <h1 className="text-2xl md:text-3xl font-bold text-[#1A202C] mb-2">
          Withdrawal Method
        </h1>
        <p className="text-[#4A4A4A] mb-10">Add payout details now or later.</p>

        {/* Country Selector */}
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="border border-[#E4E4E4] rounded-lg px-3 py-3 mb-4 text-sm"
        >
          <option value="NG">Nigeria</option>
          <option value="GH">Ghana</option>
          <option value="KE">Kenya</option>
          <option value="TG">Togo</option>
        </select>

        <div className="flex flex-col gap-6 w-[90%] md:w-[75%]">
          {/* Bank Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#333]">
              Change your bank
            </label>
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              className="border border-[#E4E4E4] rounded-lg px-3 py-3 outline-none text-sm text-gray-700"
            >
              <option value="">Select Bank</option>
              {banks.map((bank) => (
                <option key={bank.code} value={bank.name}>
                  {bank.name}
                </option>
              ))}
            </select>
          </div>

          {/* Account Number */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#333]">
              What's your account number?
            </label>
            <input
              type="text"
              maxLength={10}
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="border border-[#E4E4E4] rounded-lg px-3 py-3 outline-none text-sm text-gray-700"
              placeholder="Enter 10-digit account number"
            />
            {accountNumber.length > 0 && (
              <p
                className={`text-xs ${
                  isConfirming ? "text-gray-500" : "text-green-600"
                }`}
              >
                {isConfirming
                  ? "Confirming account..."
                  : accountName
                  ? `✅ ${accountName}`
                  : ""}
              </p>
            )}
          </div>

          {/* Account Name */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#333]">
              Account Name
            </label>
            <input
              type="text"
              value={accountName}
              readOnly
              className="border border-[#E4E4E4] rounded-lg px-3 py-3 bg-gray-100 text-sm text-gray-700"
              placeholder="Account name will appear here"
            />
          </div>

          <button
            disabled={!accountName}
            className={`w-full mt-4 py-3 rounded-lg font-medium transition ${
              accountName
                ? "bg-[#424BE0] text-white hover:bg-indigo-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Set
          </button>
        </div>
      </div>

      {/* Illustration */}
      <div className="hidden md:flex flex-1 items-center justify-center text-center px-8">
        <div>
          <h2 className="text-white text-2xl md:text-3xl font-semibold mb-6 max-w-lg leading-tight">
            Earn with every errand safe, seamless, and rewarding with Errand Tribe.
          </h2>
          <Image
            src="/withdrawal.png"
            alt="Withdrawal Illustration"
            width={400}
            height={400}
            className="mx-auto"
          />
        </div>
      </div>
    </div>
  );
}
