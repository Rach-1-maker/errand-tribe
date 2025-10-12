"use client";
import Link from "next/link";
import React from "react";
import { BsFillPinAngleFill } from "react-icons/bs";
import { FaArrowRight } from "react-icons/fa6";
import { IoCloseOutline } from "react-icons/io5";
import { PiBaseballHelmetFill } from "react-icons/pi";
import { useRoleModal } from "../context/RoleModalContext";



export default function RoleSelectionModal() {
  const {isOpen, closeModal} = useRoleModal()

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
      {/* Modal Container */}
      <div className="bg-gray-400 rounded-xl shadow-xl px-16 py-18 w-[90%] max-w-4xl relative">
        {/* Close Button */}
        <button
          onClick={closeModal}
          className="absolute top-8 right-8 text-gray-500 hover:text-gray-700">
            <IoCloseOutline className="text-3xl text-black " />
        </button>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center mb-6 text-[#252B42]">
          How do you want to join Errand Tribe?
        </h2>

        {/* Options */}
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:gap-6 ">
          {/* Tasker Option */}
          <div className="flex flex-row items-center px-12 py-10 bg-white/88 rounded-2xl shadow-sm  hover:shadow-md transition">
            <div>
            <BsFillPinAngleFill className="text-[#424BE0] bg-[#ECEDFC] text-5xl p-2 rounded-full mr-6"/>
            </div>
            <div className="flex flex-col items-center justify-center">
          <Link
          href="/signup/select-role/tasker"
          onClick={closeModal}
            className="text-[#252B42] text-center text-lg font-medium ">
                Sign up as a Tasker
            </Link>
                <p className="text-sm text-[#252B42] mt-2">
                  Find trusted runners
                </p>
              </div>
              <div>
              <FaArrowRight className="text-black text-xl  ml-6"/>
              </div>
            </div>
         

          {/* Runner Option */}
          <div className="flex flex-row items-center bg-white/88 rounded-2xl shadow-sm px-14 py-10 hover:shadow-md transition">
          <PiBaseballHelmetFill className="text-[#424BE0] bg-[#ECEDFC] text-5xl p-2 rounded-full mr-4"/>
            <div className="flex flex-col  items-center justify-center">
          <Link
          href="/signup/select-role/runner"
          onClick={closeModal}
            className="text-[#252B42] text-center text-lg font-medium">
                Sign up as a Runner
            </Link>
                <p className="text-xs text-[#252B42] mt-2">
                  Complete Taskers errands
                </p>
              </div>
              <span className="text-black text-xl ml-6"><FaArrowRight /></span>
            </div>
        </div>
      </div>
    </div>
  )
}
