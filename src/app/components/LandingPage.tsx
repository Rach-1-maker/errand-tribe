import React from 'react'
import NavBar from './NavBar'
import { FaArrowRightLong } from "react-icons/fa6";
import Image from 'next/image';
import HeroDecorator from './HeroDecorator';
import SecondDecorator from './SecondDecorator';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div id='#' className='bg-[#424BE0] text-white flex flex-col overflow-x-hidden'>
      <main className='flex-grow relative'>
        <NavBar />
        <section className='grid grid-cols-1 md:grid-cols-2 gap-8 items-center md:px-20 py-10 md:py-20 md:mx-10 relative'>
          {/* Hero-text + Buttons  section*/}
          <div className='text-center md:text-left'>
          <h1 className='text-3xl md:text-6xl font-bold leading-tight max-w-lg mx-auto md:mx-0 mb-2 md:mb-4'>Your community trusted solution for everyday errands</h1>
          <p className='text-lg text-[#D1D1D1] max-w-lg mx-auto md:mx-0 mb-2 md:mb-6'>No more hassle. Post an errand, match with a local helper, relax.</p>
          <div className='relative z-20 flex flex-col sm:flex-row gap-4 justify-center md:justify-start md:gap-8'>
            <Link href="/signup/tasker" className='inline-block text-center bg-white text-[#424BE0] px-6 py-3 rounded-2xl font-medium hover:border-2 hover:border-white hover:text-white hover:bg-transparent transition duration-500 cursor-pointer'>
            Post Errands
            </Link>
            <Link href="/signup/runner" className='inline-flex items-center justify-center gap-2 hover:border-2 hover:border-white hover:bg-transparent transition duration-500 hover:animate-pulse px-6 py-3 rounded-2xl cursor-pointer'>
            Join as Runner <span><FaArrowRightLong /></span>
            </Link>
          </div>
          </div>
          {/* Image section */}
          <div className='flex justify-center md:justify-end'>
          <Image src = "/herosection-image.png" alt='herosection image' width={400} height={400} className='object-contain w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg max-h-[80vh] px-8 md:px-8 py-8 md:py-10 bg-[#E5E6FB] rounded-tr-[100px] rounded-bl-[100px]' priority/>

          <div className='absolute bottom-0 right-[-4rem] md:right-[-8rem]'>
            <HeroDecorator className='w-56 h-56 md:w-68 md:h-68 text-[#D8DBEA] z-10'/>
          </div>
        </div>
        </section> 
          <div className='absolute bottom-0 left-0'>
            <SecondDecorator className='w-40 h-40 md:w-56 md:h-56 text-[#424BE0] z-10 '/>
          </div>
      </main>
    </div>
  )
}
