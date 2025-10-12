"use client";

import { useState } from "react";
import { MdOutlineArrowBackIos } from "react-icons/md";
import { FaCcVisa, FaCcMastercard, FaPaypal, FaUniversity } from "react-icons/fa";
import { useRouter } from "next/navigation";

export default function PaymentMethodPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [saveCard, setSaveCard] = useState(false);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 px-6 py-12">
      <div className="w-full md:w-1/2 bg-white shadow-lg rounded-2xl p-8">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 mb-6 hover:text-gray-800"
        >
          <MdOutlineArrowBackIos className="mr-2" /> Back
        </button>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">Choose Payment Method</h1>
        <p className="text-gray-500 mb-6">Select a method to fund your wallet securely.</p>

        {/* Options */}
        <div className="space-y-3">
          <label className="flex items-center space-x-3 border p-3 rounded-lg cursor-pointer">
            <input
              type="radio"
              name="method"
              value="Mastercard"
              checked={selected === "Mastercard"}
              onChange={(e) => setSelected(e.target.value)}
            />
            <FaCcMastercard className="text-red-500 text-2xl" /> <span>Mastercard</span>
          </label>

          <label className="flex items-center space-x-3 border p-3 rounded-lg cursor-pointer">
            <input
              type="radio"
              name="method"
              value="Visa"
              checked={selected === "Visa"}
              onChange={(e) => setSelected(e.target.value)}
            />
            <FaCcVisa className="text-blue-600 text-2xl" /> <span>Visa</span>
          </label>

          <label className="flex items-center space-x-3 border p-3 rounded-lg cursor-pointer">
            <input
              type="radio"
              name="method"
              value="Bank"
              checked={selected === "Bank"}
              onChange={(e) => setSelected(e.target.value)}
            />
            <FaUniversity className="text-green-600 text-2xl" /> <span>USSD / Bank Transfer</span>
          </label>

          <label className="flex items-center space-x-3 border p-3 rounded-lg cursor-pointer">
            <input
              type="radio"
              name="method"
              value="PayPal"
              checked={selected === "PayPal"}
              onChange={(e) => setSelected(e.target.value)}
            />
            <FaPaypal className="text-indigo-600 text-2xl" /> <span>PayPal</span>
          </label>
        </div>

        {/* Card Fields if Card Selected */}
        {selected === "Mastercard" || selected === "Visa" ? (
          <div className="mt-6 space-y-3">
            <input
              type="text"
              placeholder="Card Number"
              className="w-full p-3 border rounded-lg"
            />
            <div className="flex space-x-2">
              <select className="p-3 border rounded-lg flex-1">
                <option>MM</option>
              </select>
              <select className="p-3 border rounded-lg flex-1">
                <option>YYYY</option>
              </select>
              <input
                type="text"
                placeholder="CVV"
                className="p-3 border rounded-lg flex-1"
              />
            </div>
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={saveCard}
                onChange={(e) => setSaveCard(e.target.checked)}
              />
              <span>Save this card for future transactions</span>
            </label>
          </div>
        ) : null}

        {/* Buttons */}
        <button
          disabled={!selected}
          onClick={() => router.push("/first-errand")}
          className={`w-full mt-6 py-3 rounded-lg font-medium ${
            selected
              ? "bg-[#424BE0] text-white hover:bg-indigo-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Continue
        </button>
        <button
          onClick={() => router.push("/dashboard")}
          className="w-full mt-3 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          Skip For Now
        </button>
      </div>

      {/* Illustration */}
      <div className="hidden md:flex flex-1 bg-[#424BE0] items-center justify-center">
        <img src="/payment.png" alt="Payment Method Illustration" className="w-80" />
      </div>
    </div>
  );
}
