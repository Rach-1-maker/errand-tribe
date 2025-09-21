"use client"
import React from 'react'
import AboutDecorator from './AboutDecorator'
import { FaArrowRightLong } from 'react-icons/fa6'
import { useRoleModal } from '../context/RoleModalContext';

export default function HowItWorks() {
  const { openModal} = useRoleModal();
  return (
    <section id='howItWorks' className='bg-[#FFFAF0] w-full py-16 px-6 md:px-20'>
      <div className='max-w-5xl mx-auto'>
      <h1 className='text-3xl md:text-4xl font-bold text-center text-[#363636]'>
        How This Works
      </h1>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-10 mt-10 mx-auto'>
        {/* Card 1 */}
        <div className='flex flex-col items-center text-center mt-3'>
          <AboutDecorator className="w-16 h-16 block" />
          <p className='text-[#252B42] text-lg font-semibold'>Post your errand</p>
          <p className='text-[#374754] max-w-xs mt-1'>
            Tell us what you need like shopping, delivery, verification, or care
          </p>
        </div>

        {/* Card 2 */}
        <div className='flex flex-col items-center text-center mt-3'>
          <AboutDecorator className="w-16 h-16 block" />
          <p className='text-[#252B42] text-lg font-semibold'>Get matched</p>
          <p className='text-[#374754] max-w-xs mt-1'>
            We'll connect you with a verified local Runner which is fast and secured
          </p>
        </div>
        {/* Card 3 */}
        <div className='flex flex-col items-center text-center mt-3'>
          <AboutDecorator className="w-16 h-16 block" />
          <p className='text-[#252B42] text-lg font-semibold'>Track and approve</p>
          <p className='text-[#374754] max-w-xs mt-1'>
            Stay updated in real-time. Approve when it's done and pay safely
          </p>
        </div>
      </div>
      <div className='flex justify-center mt-10'>
        <button onClick={openModal } className='flex items-center justify-center gap-2 bg-[#424BE0] text-white transition px-8 py-4 rounded-full'>Get Started <FaArrowRightLong /></button>
      </div>
      </div>
    </section>
  )
}
