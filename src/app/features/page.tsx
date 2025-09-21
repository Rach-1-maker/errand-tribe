import Image from 'next/image'
import React from 'react'
import { FiMessageCircle } from 'react-icons/fi'
import { IoIosCheckmarkCircle, IoIosCheckmarkCircleOutline } from 'react-icons/io'

export default function Features() {
  return (
      <section id='features' className='bg-white'>
    <div className='bg-[#F3FBF5] max-w-7xl mx-auto my-12 rounded-2xl px-6 md:px-20 py-16 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center shadow-sm'>
      <div className=' relative flex justify-center'>
        <Image src="/features.png" alt="features" width={400} height={400} className='w-full h-auto max-w-sm md:max-w-md'/>
        <div className='absolute top-[-42] right-[-32] px-4 py-3 bg-white rounded-xl shadow-2xl flex flex-row items-center space-x-3'>
        <div>
        <Image src="/headshot.jpg" alt="headshot" width={150} height={150} className='w-10 h-10 md:w-16 md:h-16 rounded-full object-cover'/>
        </div>
        <div className='flex flex-col'>
        <p className='font-medium text-lg text-[#000313] mb-2'>Amanda Young</p>
        <p className='font-medium text-xs text-[#A6A6A6]'>Wow, this saves me time!</p>
        </div>
        <div className='bg-[#424BE0] p-2 rounded-full flex items-end justify-center'>
        <FiMessageCircle className='text-white text-xl'/>
        </div>
        </div>
        <div className='absolute bottom-[-24] left-[-42] px-8 pr-20 py-4 bg-white rounded-lg shadow-2xl flex flex-row items-center space-x-3'>
            <IoIosCheckmarkCircleOutline className='text-[#424BE0] text-2xl'/>
            <p className='text-[#000313] text-lg'>Escrow Ensured</p>
        </div>
        </div>
        <div className='flex flex-col space-y-6 justify-center'>
            <h1 className='text-[#363636] text-5xl font-bold text-center md:text-left'>Why Choose Us?</h1>
            <div className='space-y-4 mt-4'>
             {[
              "Real-time updates",
              "Flexible task types",
              "Made for the African Community",
              "Funds released from escrow upon mutual satisfaction"
            ].map((item, index) => (
              <div key={index} className="flex items-start space-x-3">
                <IoIosCheckmarkCircle className="text-[#424BE0] text-3xl flex-shrink-0 mt-1" />
                <p className="text-[#363636] text-lg leading-relaxed">{item}</p>
              </div>
            ))}
            </div>
        </div>
    </div>
    </section>
  )
}
