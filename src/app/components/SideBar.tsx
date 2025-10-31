import Image from 'next/image';
import React, { useState } from 'react'
import { BiHomeCircle } from 'react-icons/bi';
import { FiMenu, FiPower, FiSearch, FiX } from 'react-icons/fi';
import { IoWalletOutline } from 'react-icons/io5';
import { TbMessage2, TbUsers } from 'react-icons/tb';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { TokenManager } from '../utils/tokenUtils';

interface SideBarProps {
  onClose?: () => void;
}

export default function SideBar({ onClose }: SideBarProps) {
    const pathname = usePathname();
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false);

    const menu = [
        { name: "Home", href: "/dashboard/tasker", icon: BiHomeCircle },
        { name: "My task", icon: FiSearch },
        { name: "Messages", icon: TbMessage2 },
        { name: "Wallet", icon: IoWalletOutline },
        { name: "Profile & Settings", icon: TbUsers },
      ];

    const handleLogout = () => {
      TokenManager.clearTokens()
      localStorage.removeItem("userData")
      localStorage.removeItem("user")
      sessionStorage.clear()
      router.push("/login")
      
      if (onClose) {
        onClose()
      }
    }

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white shadow-sm border-b">
        <Image src="/dashboardlogo.svg" alt='Dashboard logo' width={30} height={30} />
        <button
          onClick={onClose}
          className="p-2 rounded-md hover:bg-gray-100"
        >
          <FiX size={22} />
        </button>
      </div>
      
      {/* Sidebar container */}
      <aside className="h-screen bg-white flex flex-col justify-between py-6 border-r border-[#EFEFEF] top-0 left-0">
        <div>
          {/* Logo */}
          <div className="hidden md:flex items-center justify-center mb-10 ml-2">
            <Image
              src="/dashboardlogo.svg"
              alt="Dashboard logo"
              width={40}
              height={40}
              className='mx-auto'
            />
          </div>
      
          {/* Menu */}
          <nav className="space-y-4 px-4 w-full">
            {menu.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href || "#"}
                  onClick={onClose}
                  className={`flex flex-col items-center w-full gap-2 py-2 rounded-xl transition-colors ${
                    isActive
                      ? "bg-[#EFF0FD] text-[#424BE0] font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {/* Hide icon on mobile */}
                  <div className="flex justify-center w-full">
                    <Icon
                      className={`p-3 rounded-xl transition-all ${
                        isActive ? "text-[#424BE0] bg-[#ECEDFC] shadow-sm" : "text-gray-500 hover:bg-[#F6F7FF]"
                      }`}
                      size={24}
                    />
                  </div>
                  {/* Label */}
                  <span
                    className={`text-xs  ${
                      isActive ? "text-[#424BE0] font-semibold" : "text-gray-600"
                    } text-sm md:text-base`}
                  >
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      
        {/* Logout */}
        <button onClick={handleLogout} className="flex flex-col mr-16 items-center text-red-500 hover:text-red-600 transition mb-4">
          <div className=" p-3 md:ml-16 rounded-xl hover:bg-red-50 mt-8 md:mt-22">
            <FiPower className="text-2xl" />
          </div>
          <span className="text-sm ml-2 mb-22 md:mt-0 md:ml-16">Log out</span>
        </button>
      </aside>
      
      {/* Overlay for mobile when sidebar is open */}
      {isOpen && (
        <div
          className={`fixed inset-0 z-40 md:hidden transition-opacity duration-500 ease-in-out 
            ${isOpen ? "backdrop-blur-sm bg-black/30 opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={onClose}
        ></div>
      )}
    </>
  );
}