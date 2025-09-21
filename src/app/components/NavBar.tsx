'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useState } from 'react'
import RoleSelectionModal from '../../app/signup/roleSelectionModal'

export default function NavBar() {
  const pathname = usePathname()
  const [showRoleModal, setShowRoleModal] = useState(false)

  const isActive = (path: string) => pathname === path


  return (
    <>
    <nav className='bg-[#424BE0] text-white mt-6'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16 '>
          {/* Brand Logo */}
          <div className='text-white font-bold text-xl'>
            <Link href={'/'}>ETribe</Link>
          </div>

          {/* Navigation Links */}
          <ul className='hidden md:flex space-x-8'>
            <li>
              <Link href={"#"} className={`${isActive("/") ? "text-[#FDFDFD]" : "text-[#D1D1D1]"} hover:text-white transition-colors`}>Home</Link>
            </li>
            <li>
              <Link href={"#howItWorks"} className={`${isActive("/HowItWorks") ? "text-[#FDFDFD]" : "text-[#D1D1D1]"} hover:text-white transition-colors`}>How it works</Link>
            </li>
            <li>
              <Link href={"#features"} className={`${isActive("/features") ? "text-[#FDFDFD]" : "text-[#D1D1D1]"} hover:text-white transition-colors`}>Features</Link>
            </li>
            <li>
              <Link href={"#category"} className={`${isActive("/category") ? "text-[#FDFDFD]" : "text-[#D1D1D1]"} hover:text-white transition-colors`}>Category</Link>
            </li>
            <li>
              <Link href={"#testimonies"} className={`${isActive("/testimonies") ? "text-[#FDFDFD]" : "text-[#D1D1D1]"} hover:text-white transition-colors`}>Testimonies</Link>
            </li>
          </ul>
            <div className='flex items-center space-x-8'>
             <Link href="/login" className={`${isActive("/login") ? "text-[#FDFDFD]" : "text-[#D1D1D1]"} hover:text-white transition-colors`}>Login</Link>

             <button onClick={() => setShowRoleModal(true)} className='bg-[#F8F8FA] text-[#424BE0] px-4 py-2 rounded-2xl hover:border-2 hover:border-[#F8F8FA] hover:bg-transparent hover:text-white'>Sign Up</button>
            </div>
        </div>
      </nav>
      <RoleSelectionModal isOpen={showRoleModal} onClose={() => setShowRoleModal(false)} />
    </>
  )
}
