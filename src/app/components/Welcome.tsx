"use client";

import React, { useEffect, useState } from "react";
import { useRouter} from "next/navigation";
import { MdOutlineArrowBackIos } from "react-icons/md";
import { FaLock, FaRegStar } from "react-icons/fa";
import { HiOutlineCurrencyDollar } from "react-icons/hi";
import { IoIosCheckmarkCircleOutline } from "react-icons/io";
import { LuShield } from "react-icons/lu";
import Image from "next/image";
import SuccessPopup from "./SuccessPopUp";

interface WelcomeAndSecurityCheckProps {
  role: "tasker" | "runner"
  userId: string

}

export default function WelcomePage({role, userId}: WelcomeAndSecurityCheckProps) {
  const router = useRouter();
  const isTasker = role === "tasker";
  const [showSuccess, setShowSuccess] = useState(false)


  // Features per role
  const taskerFeatures = [
    {
      icon: <FaLock className="text-[#424BE0] text-lg" />,
      title: "Escrow Protection",
      desc: "Money held safely until task completion.",
    },
    {
      icon: <FaRegStar className="text-[#424BE0] text-lg" />,
      title: "Rating System",
      desc: "Community-driven trust and accountability.",
    },
    {
      icon: <FaRegStar className="text-[#424BE0] text-lg" />,
      title: "Verified Runners",
      desc: "ID-checked and background verified users.",
    },
  ];

  const runnerFeatures = [
    {
      icon: <HiOutlineCurrencyDollar className="text-[#424BE0] text-lg" />,
      title: "Client Pays Upfront",
      desc: "Payment is secured in escrow before you start.",
    },
    {
      icon: <IoIosCheckmarkCircleOutline className="text-[#424BE0] text-lg" />,
      title: "You Complete Task",
      desc: "Follow the instructions and complete the errand safely.",
    },
    {
      icon: <LuShield className="text-[#424BE0] text-lg" />,
      title: "Funds Released",
      desc: "After client approval, earnings are released to your wallet.",
    },
  ]

  const features = isTasker ? taskerFeatures : runnerFeatures;

  const handleSubmit = async () => {
    try {
      const existingUserData = localStorage.getItem("user");
      if (existingUserData) {
        const userData = JSON.parse(existingUserData);
        const updatedUserData = {
          ...userData,
          onboarding_completed: true,
          welcome_shown: true
        };
        localStorage.setItem("user", JSON.stringify(updatedUserData));
      }

      console.log("Welcome completed for runner:", userId)
      localStorage.setItem("isNewUser", "true")
      
      if (isTasker) {
        router.push(`/signup/${role}/${userId}/errand-selection`)
      } else {
        setShowSuccess(true)
        setTimeout(() => {
          setShowSuccess(false)
          router.push(`/runner/dashboard/${userId}`)
        }, 3000)
      }
    } catch (error) {
      console.error("Failed to update signup step:", error)
    } 
  }

  return (
    <div className="h-screen flex flex-col md:flex-row bg-[#424BE0]">
      <SuccessPopup show={showSuccess} />
      <div className="w-full bg-white md:w-1/2 flex flex-col justify-center shadow-lg rounded-tr-[60px] rounded-br-[60px] px-6 sm:px-10 lg:px-16 sm:py-19">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-8 ml-16"
        >
          <MdOutlineArrowBackIos className="mr-2" /> Back
        </button>


        {/* Heading */}
        <h1 className="text-3xl font-semibold text-gray-900 mb-2 ml-16">
          {isTasker ? "How we keep you safe" : "Hurray! Tier 1 unlocked"}
        </h1>
        <p className="text-gray-500 mb-8 ml-16 max-w-sm">
          {isTasker
            ? "Errand Tribe uses multiple layers of protection for your errands."
            : "Here's how it works:"}
        </p>

        {/* Features */}
        <div className="space-y-6 px-4 py-2 ml-10">
          {features.map((item, index) => (
            <div
              key={index}
              className="flex items-start space-x-4 bg-[#F9FCFD] border border-gray-100 p-4 rounded-2xl"
            >
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#F0FFFE]">
                {item.icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Button */}
        <button
          onClick={handleSubmit}
          className="mt-10 w-[90%] py-3 bg-[#424BE0] text-white rounded-lg font-medium hover:bg-[#323ad8] transition ml-12">
          Got it
        </button>
      </div>
      <div className="hidden md:flex md:w-1/2 bg-[#424BE0] items-center justify-center p-10">
        <Image
          src={isTasker ? "/tasker-safety.png" : "/runner-welcome.png"}
          alt={isTasker ? "Tasker safety illustration" : "Runner welcome illustration"}
          width={400}
          height={400}
          className="object-contain" />
      </div>
    </div>
  );
}
