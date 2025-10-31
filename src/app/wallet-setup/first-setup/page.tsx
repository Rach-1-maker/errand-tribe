"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../components/SideBar";
import { Button } from "@/components/ui/button";
import { HiArrowTrendingUp } from "react-icons/hi2";
import TopBar from "@/app/components/TopBar";
import { IoWalletOutline } from "react-icons/io5";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FiPlusCircle } from "react-icons/fi";
import { MdOutlineShield } from "react-icons/md";
import { LuBuilding2 } from "react-icons/lu";

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [selectedMethod, setSelectedMethod] = useState("");
  const [cardDetails, setCardDetails] = useState({ number: "", expiry: "", cvv: "", name: "" });
  const [bankDetails, setBankDetails] = useState({ bank: "", accountNumber: "", accountName: "" });
  const [ussdDetails, setUssdDetails] = useState({ bank: "", code: "" });

  const quickAmounts = [5000, 10000, 15000, 20000];

  // Mock fetching Flutterwave bank / USSD details
  useEffect(() => {
    if (selectedMethod === "bank") fetchBankDetails();
    if (selectedMethod === "ussd") fetchUssdDetails();
  }, [selectedMethod]);

  const fetchBankDetails = async () => {
    // Replace with your API call to Flutterwave
    setBankDetails({
      bank: "GTBank",
      accountNumber: "0123456789",
      accountName: "Errand Tribe User"
    });
  };

  const fetchUssdDetails = async () => {
    // Replace with your API call to Flutterwave
    setUssdDetails({
      bank: "Access Bank",
      code: "*901*12345#"
    });
  };

  const handleAddMoney = (amount?: number) => {
    if (amount) setSelectedAmount(amount);
    else setSelectedAmount(null);
    setShowPaymentModal(true);
  };

  // New function: handles the radio selection and opens respective modal
  const handlePaymentMethodChange = (method: string) => {
    setSelectedMethod(method);
    if (method === "card" || method === "bank" || method === "ussd") {
      setShowPaymentModal(true);
    }
  };

  const handleConfirmPayment = () => {
    // Integrate Flutterwave API call here based on selectedMethod
    if (selectedAmount) setBalance(balance + selectedAmount);

    setShowPaymentModal(false);
    setSelectedAmount(null);
    setSelectedMethod("");
    setCardDetails({ number: "", expiry: "", cvv: "", name: "" });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar />

        <main className="flex-1 px-8 py-6 overflow-y-auto w-[95%] mx-auto bg-white">
          <div className="grid grid-cols-3 gap-6 h-[97%]">
            {/* Left Section */}
            <section className="col-span-2 border border-[#E5E7EB] rounded-2xl p-6 flex flex-col justify-between h-[75%]">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">
                  Add funds to wallet
                </h2>
                <p className="text-sm text-[#6B7280] mb-6">
                  Top up your available balance to pay for tasks.
                </p>

                <div className="flex flex-row items-center justify-between">
                  <div className="bg-[#EFF0FD]/30 text-[#6B7280] border border-[#E5E7EB] p-6 rounded-2xl flex justify-between items-center mb-4 w-[60%] h-48">
                    <div>
                      <span className="flex flex-row gap-2 items-center">
                        <IoWalletOutline className="text-[#424BE0] text-lg" />
                        <p className="text-sm text-[#6B7280]">Your Escrow Balance</p>
                      </span>
                      <h3 className="text-2xl font-semibold mt-1">
                        ₦{balance.toLocaleString()}
                      </h3>
                      <p className="text-sm text-[#6B7280] mt-1">Available to spend</p>
                    </div>
                    <HiArrowTrendingUp className="w-10 h-10 p-1 text-2xl text-[#424BE0] bg-[#424BE0]/10 rounded-full" />
                  </div>

                  <Button
                    onClick={() => handleAddMoney()}
                    className="bg-[#424BE0] hover:bg-[#454ddd] text-white px-8 py-6 items-center gap-2">
                        <FiPlusCircle className="w-5 h-5"/>
                    Add Money
                  </Button>
                </div>
              </div>

              <p className="text-sm text-[#1A1A1A] mb-3">Add quick money</p>
              <div className="flex gap-3">
                {quickAmounts.map((amount) => (
                  <Button
                    key={amount}
                    onClick={() => handleAddMoney(amount)}
                    className="bg-[#FAFBFC] hover:bg-[#f2f4f7] border border-[#E5E7EB] text-[#1A1A1A] font-semibold w-32 h-12"
                  >
                    ₦{amount.toLocaleString()}
                  </Button>
                ))}
              </div>
            </section>

            {/* Right Section */}
            <section className="col-span-1 bg-white rounded-2xl p-4 shadow h-full">
              <h3 className="text-base font-semibold mb-2">Transaction History</h3>
              <p className="mb-4 text-sm text-[#6B7280]">Track all your wallet transactions</p>
              {balance > 0 ? (
                <ul className="space-y-3">
                  <li className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Wallet Funded</span>
                    <span className="text-sm text-green-600 font-medium">
                      ₦{balance.toLocaleString()}
                    </span>
                  </li>
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center mt-28 text-center">
                  <div className="flex items-center justify-center bg-[#EFF0FD] rounded-full w-14 h-14 mb-3">
                    <IoWalletOutline className="text-2xl text-[#424BE0]" />
                  </div>
                  <p className="text-black text-lg mb-2">No transactions yet.</p>
                  <p className="text-[#6D6D6D] text-sm leading-relaxed w-4/6">
                    Your transaction history will appear here once you start using your wallet
                  </p>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      {/* 💳 Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-center border-b pb-4">
              Choose Payment Method
            </DialogTitle>
          </DialogHeader>

          {selectedAmount && (
            <p className="text-sm text-center text-gray-600 mb-3">
              Select how you would like to pay for{" "}
              <span className="font-medium text-[#424BE0]">₦{selectedAmount.toLocaleString()}</span>
            </p>
          )}

          <RadioGroup
            value={selectedMethod}
            onValueChange={handlePaymentMethodChange}
            className="space-y-4 accent-[#424BE0]"
          >
            {/* Card Option */}
            <div className="flex items-center justify-between border-b border-[#E6E6E6] p-3 ">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center bg-[#EFF0FD] w-10 h-10 rounded-full">
                  <IoWalletOutline className="text-[#424BE0] text-xl" />
                </div>
                <div>
                  <p className="font-medium text-sm mb-1">Debit / Credit Card</p>
                  <p className="text-xs text-gray-500">Pay with your Visa, Mastercard or Verve</p>
                </div>
              </div>
              <RadioGroupItem 
                value="card"
                id="card"
                className="border-2 border-[#424BE0]
                  data-[state=checked]:bg-[#424BE0] 
                  data-[state=checked]:border-[#424BE0] 
                  data-[state=checked]:after:bg-white 
                  data-[state=checked]:after:w-1.5
                  data-[state=checked]:after:h-1.5 
                  focus-visible:ring-0 focus-visible:ring-offset-0"/>
            </div>

            {/* Bank Option */}
            <div className="flex items-center justify-between border-b border-[#E6E6E6] p-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center bg-[#EFF0FD] w-10 h-10 rounded-full">
                  <LuBuilding2 className="text-[#424BE0] text-xl" />
                </div>
                <div>
                  <p className="font-medium text-sm mb-1">Bank Transfer</p>
                  <p className="text-xs text-gray-500">Direct transfer from your bank account</p>
                </div>
              </div>
              <RadioGroupItem value="bank" id="bank" className="text-[#424BE0] border-2 border-[#424BE0] data-[state=checked]:bg-[#424BE0] data-[state=checked]:border-[#424BE0] data-[state=checked]:text-white focus-visible:ring-0 focus-visible:ring-offset-0"/>
            </div>

            {/* USSD Option */}
            <div className="flex items-center justify-between border-b border-[#E6E6E6] p-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center bg-[#EFF0FD] w-10 h-10 rounded-full">
                  <IoWalletOutline className="text-[#424BE0] text-xl" />
                </div>
                <div>
                  <p className="font-medium text-sm mb-1">USSD Code</p>
                  <p className="text-xs text-gray-500">Direct transfer from your bank account</p>
                </div>
              </div>
              <RadioGroupItem value="ussd" id="ussd" className="text-[#424BE0] border-2 border-[#424BE0] data-[state=checked]:bg-[#424BE0] data-[state=checked]:border-[#424BE0] data-[state=checked]:text-white focus-visible:ring-0 focus-visible:ring-offset-0"/>
            </div>
          </RadioGroup>

          {/* Dynamic Payment Forms */}
          <div className="mt-4">
            {selectedMethod === "card" && (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Card Number"
                  value={cardDetails.number}
                  onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                  className="p-2 border rounded"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={cardDetails.expiry}
                    onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                    className="p-2 border rounded flex-1"
                  />
                  <input
                    type="text"
                    placeholder="CVV"
                    value={cardDetails.cvv}
                    onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                    className="p-2 border rounded flex-1"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Cardholder Name"
                  value={cardDetails.name}
                  onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                  className="p-2 border rounded"
                />
              </div>
            )}

            {selectedMethod === "bank" && (
              <div className="flex flex-col gap-2 text-sm text-gray-700 p-2 border rounded">
                <p>Bank: {bankDetails.bank}</p>
                <p>Account Number: {bankDetails.accountNumber}</p>
                <p>Account Name: {bankDetails.accountName}</p>
                <p>Amount: ₦{selectedAmount?.toLocaleString()}</p>
              </div>
            )}

            {selectedMethod === "ussd" && (
              <div className="flex flex-col gap-2 text-sm text-gray-700 p-2 border rounded">
                <p>Bank: {ussdDetails.bank}</p>
                <p>USSD Code: {ussdDetails.code}</p>
                <p>Amount: ₦{selectedAmount?.toLocaleString()}</p>
              </div>
            )}
          </div>

          <div className="bg-[#D3FEB0]/10 p-4 rounded-lg mt-4 flex flex-col gap-2">
            <div className="flex flex-row items-start justify-start gap-2">
              <MdOutlineShield className="text-[#10B981]" />
              <p className="text-sm">Secure Payment</p>
            </div>
            <p className="text-[#6B7280] text-xs">
              Your payment information is encrypted and secure. Funds are held in escrow until task completion.
            </p>
          </div>

          <Button
            onClick={handleConfirmPayment}
            className="w-full mt-4 bg-[#424BE0] hover:bg-[#434be6] text-white"
            disabled={!selectedMethod}
          >
            Continue
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
