'use client';
import React from 'react';
import { IoClose } from "react-icons/io5";
import { useRouter } from 'next/navigation';
import { FaRegCircleCheck } from 'react-icons/fa6';

type Props = {
  open: boolean;
  onClose: () => void;
  taskTitle?: string;
  clientName?: string;
  offerPrice?: number;
  deadline?: string;
};

export default function OfferSuccessModal({
  open,
  onClose,
  taskTitle,
  clientName,
  offerPrice,
  deadline
}: Props) {

  const router = useRouter();
  if (!open) return null;

  const formatDeadline = (deadlineString?: string) => {
    if (!deadlineString) return "N/A";
    
    try {
      const date = new Date(deadlineString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  return (
    <div className="fixed inset-0 z-10050 flex items-center justify-center px-4">
  <div
    onClick={onClose}
    className="fixed inset-0 bg-black/30"
  />

  <div className="relative z-10060 w-full max-w-sm rounded-2xl shadow-xl animate-fadeIn">
      
      {/* TOP SECTION — Blue background */}
      <div className="bg-[#424BE0] text-white rounded-t-2xl p-6 text-center">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-white/80 hover:text-white"
        >
          <IoClose size={22} />
        </button>

        {/* Success Icon */}
        <div className="bg-[#7CB634] flex items-center justify-center w-fit mx-auto rounded-full p-4">
          <FaRegCircleCheck size={38} className="text-white"/>
        </div>

        <h3 className="text-lg font-semibold mt-4">Offer Submitted Successfully</h3>

        <p className="text-sm mt-1">
          Your offer is now with <span className="font-medium">{clientName}</span>.
        </p>
      </div>

      {/* BOTTOM SECTION — White background */}
      <div className="bg-white p-6 rounded-b-2xl">

        {/* Summary */}
        <div className="w-full mt-2 text-left">

          <div className="flex justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Offer Price</p>
              <p className="text-base text-[#424BE0]">
                ₦{offerPrice?.toLocaleString()}
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-500">Deadline</p>
              <p className="text-base font-medium">
                {formatDeadline(deadline)}
              </p>
            </div>
          </div>

          <div className="border-b border-gray-300 py-3">
            <p className="text-sm text-gray-500">Task</p>
            <p className="font-medium text-md mt-1">{taskTitle}</p>
          </div>
        </div>

        {/* What next */}
        <p className="text-sm mt-6 text-center">
          What would you like to do next?
        </p>

        {/* Buttons */}
        <div className="w-full mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push('/tasker/offers')}
            className="w-full py-3 rounded-lg text-[#424BE0] bg-[#EFF0FD] text-sm"
          >
            View My Offers
          </button>

          <button
            onClick={() => router.push('/tasker/dashboard')}
            className="w-full py-3 rounded-lg border border-[#E1E1E1]/88 text-[#5F5F67] text-sm"
          >
            Browse More Tasks
          </button>
        </div>
      </div>
  </div>
</div>
  );
}
