import Image from 'next/image';
import React from 'react'
import { FiMenu, FiSearch } from 'react-icons/fi'
import { HiOutlineEnvelope } from 'react-icons/hi2'
import { IoMdNotificationsOutline } from 'react-icons/io'
import { useUser } from '../context/UserContext';

interface TopBarProps {
  onMenuClick?: () => void
}

export default function TopBar({onMenuClick}: TopBarProps) {
  const { userData, isLoading } = useUser();
  
  // Default avatars - use the same logic as in UserContext
  const getDefaultAvatar = (role: string) => {
    if (role === "tasker") return "/tasker-avatar.png";
    if (role === "runner") return "/runner-avatar.jpg";
    return "/user-icon.png";
  };

  // Determine the profile photo
  const getProfilePhoto = () => {
    if (isLoading) {
      return "/user-icon.png"; // Show generic default while loading
    }
    
    // If we have user data with a profile photo, use it
    if (userData?.profilePhoto) {
      return userData.profilePhoto;
    }
    
    // If no profile photo but we have user data, return role-specific default
    if (userData?.role) {
      return getDefaultAvatar(userData.role);
    }
    
    // Fallback
    return "/user-icon.png";
  };

  const profilePhoto = getProfilePhoto();
  console.log("👤 TopBar userData:", userData);


  return (
    <div className="flex justify-between bg-white px-4 py-5 items-center mb-8">
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button - Only show on mobile */}
        {onMenuClick && (
          <button 
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Open menu"
          >
            <FiMenu className="w-6 h-6 text-gray-700" />
          </button>
        )}
        <div>
          <h1 className="text-xs md:text-xl font-semibold flex">
            Welcome {userData?.firstName ? `, ${userData.firstName}` : ""} 
            <span className='hidden md:flex ml-1'>👋</span>
          </h1>
          <p className="hidden md:flex text-gray-500 text-sm">
            {userData?.firstName
              ? `${userData.firstName}, let's get your first errand done today`
              : "Let's get your first errand done today"}
          </p>
        </div>
      </div>
    
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 text-lg rounded-full bg-[#F9FAFB] border border-[#CCCCCC] flex items-center justify-center font-bold text-[#656565]">
          <FiSearch/>
        </div>
        <div className="w-8 h-8 text-lg rounded-full bg-[#F9FAFB] border border-[#CCCCCC] flex items-center justify-center font-bold text-[#656565]">
          <IoMdNotificationsOutline />
        </div>
        <div className="w-8 h-8 text-lg rounded-full bg-[#F9FAFB] border border-[#CCCCCC] flex items-center justify-center font-bold text-[#656565]">
          <HiOutlineEnvelope />
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            {isLoading ? (
              <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse hidden md:block"></div>
            ) : (
              <Image
                src={profilePhoto}
                alt="Profile"
                width={40}
                height={40}
                className="rounded-full hidden w-12 h-12 md:flex object-cover border border-[#CCCCCC]"
                onError={(e) => {
                  // If the uploaded image fails to load, fall back to default
                  const target = e.target as HTMLImageElement;
                  if (userData?.role) {
                    target.src = getDefaultAvatar(userData.role);
                  } else {
                    target.src = "/user-icon.png";
                  }
                }}
              />
            )}
          </div>
          <span className="font-medium text-gray-700 capitalize mr-4 ml-2">
            {userData?.lastName || ""}
          </span>
        </div>
      </div>
    </div>
  );
}