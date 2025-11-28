import React from 'react'
import Image from 'next/image'
import { CiCalendar, CiClock2 } from "react-icons/ci";
import { TiShoppingCart } from 'react-icons/ti';
import { LiaCoinsSolid } from 'react-icons/lia';
import { IoLocationOutline } from 'react-icons/io5';

interface Task {
  id: string;
  title: string;
  description?: string;
  location: string;
  price_min?: number;
  price_max?: number;
  deadline: string;
  task_type: string;
  user?: {
    first_name: string;
    last_name: string;
    profile_photo?: string;
  };
  client?: {
    first_name: string;
    last_name: string;
    profile_photo?: string;
  };
  created_at: string;
  category?: {
    name: string;
  };
  task_category?: string;
}

interface ErrandCardProps {
  task: Task;
}

export default function ErrandCard({ task }: ErrandCardProps) {
  console.log("ErrandCard received task:", task);

  const formatDeadline = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 0 && diffDays < 7) return `In ${diffDays} days`;
    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} days`;
    
    return deadlineDate.toLocaleDateString();
  };

  const getClientName = () => {
    if (task.client && (task.client.first_name || task.client.last_name)) {
      return `${task.client.first_name || ''} ${task.client.last_name || ''}`.trim();
    }
    if (task.user && (task.user.first_name || task.user.last_name)) {
      return `${task.user.first_name || ''} ${task.user.last_name || ''}`.trim();
    }
    return 'Anonymous User';
  };

  const getClientAvatar = () => {
    return task.client?.profile_photo || task.user?.profile_photo || '/default-avatar.png';
  }
  
  const formatPrice = () => {
    const min = task.price_min;
    const max = task.price_max;

    if (min !== undefined && max !== undefined) {
      return `₦${min.toLocaleString()} - ₦${max.toLocaleString()}`;
    }
    if (min !== undefined) return `₦${min.toLocaleString()}`;
    if (max !== undefined) return `₦${max.toLocaleString()}`;

    return 'Price not set';
  };
  
  const getCategoryName = () => {
    return task.category?.name || task.task_category || 'General';
  };

  const getTaskType = () => {
    return task.task_type || 'Errand';
  };

  return (
    <div className="bg-white w-full rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col h-full">
      {/* Top Section: Client Avatar and Task Type with justify-between */}
      <div className="flex justify-between items-start mb-4">
        {/* Client Avatar and Name */}
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full bg-[#F0F4FF] flex items-center justify-center shrink-0">
            <Image 
              src={getClientAvatar()} 
              alt={getClientName()} 
              width={44} 
              height={44} 
              className="rounded-full object-cover w-11 h-11"
            />
          </div>
        </div>
        {/* Task Type Badge */}
        <span className="text-xs px-2 py-1.5 rounded-full bg-[#EEF2FF] text-[#424BE0] font-medium shrink-0">
          {getTaskType()}
        </span>
      </div>

      {/* Task Title */}
      <h3 className="font-semibold text-gray-800 text-md mb-4 line-clamp-2 leading-tight">
        {task.title}
      </h3>
          <div className='flex gap-x-2 mb-2'>
            <p className="text-xs text-gray-500">Client:</p>
            <p className="text-xs font-semibold text-gray-700">{getClientName()}</p>
          </div>

      {/* Task Details */}
      <div className="space-y-3 mb-6 flex-1">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <IoLocationOutline className="w-4 h-4 shrink-0" />
          <span className="truncate">{task.location}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CiCalendar className="w-4 h-4 shrink-0" />
          <span>Deadline: {formatDeadline(task.deadline)}</span>
        </div>

        {task.category && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <TiShoppingCart className="w-4 h-4 shrink-0" />
            <span>Category: {getCategoryName()}</span>
          </div>
        )}

        {/* Price Section */}
        <div className="flex items-center gap-2 text-sm font-semibold text-[#424BE0]">
          <LiaCoinsSolid className="w-4 h-4 shrink-0" />
          <span>Price: {formatPrice()}</span>
        </div>
      </div>

      {/* Bottom Section: View More Button with proper alignment */}
      <div className="pt-4 border-t border-gray-100">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("openTaskDrawer", { detail: task }))}
          className="w-full py-3 text-sm rounded-lg font-medium text-[#424BE0] bg-[#EFF0FD] hover:bg-[#E0E1F5] transition-colors"
        >
          View More
        </button>
      </div>
    </div>
  );
}