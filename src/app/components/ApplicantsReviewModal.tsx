// components/ApplicantsReviewModal.tsx
'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose, IoCheckmarkCircle, IoStar, IoLocation, IoRibbon } from 'react-icons/io5';
import Image from 'next/image';

interface Applicant {
  id: string;
  runnerId: string;
  runnerName: string;
  runnerPhoto?: string;
  offerPrice: number;
  proposedDeadline: string;
  personalMessage?: string;
  status: 'pending' | 'accepted' | 'rejected';
  rating: number;
  completedTasks: number;
  completionRate: number;
  taskType: 'shopping' | 'local' | 'pickup' | 'care' | 'verify';
  location: string;
  distance: string;
  isVerified: boolean;
  isRecommended: boolean;
  estimatedCompletion: string;
  specialization?: string;
}

interface ApplicantsReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicants: Applicant[];
  taskTitle: string;
  taskType: string;
  onAcceptOffer: (applicantId: string) => void;
  onRejectOffer: (applicantId: string) => void;
  onViewProfile: (runnerId: string) => void;
}

type SortOption = 'least-price' | 'closest' | 'most-experience';

export default function ApplicantsReviewModal({
  isOpen,
  onClose,
  applicants,
  taskTitle,
  taskType,
  onAcceptOffer,
  onRejectOffer,
  onViewProfile
}: ApplicantsReviewModalProps) {
  const [sortBy, setSortBy] = useState<SortOption>('least-price');
  const [selectedApplicant, setSelectedApplicant] = useState<string | null>(null);

  // Sort applicants based on selected option
  const sortedApplicants = React.useMemo(() => {
    const applicantsCopy = [...applicants];
    
    switch (sortBy) {
      case 'least-price':
        return applicantsCopy.sort((a, b) => a.offerPrice - b.offerPrice);
      case 'closest':
        return applicantsCopy.sort((a, b) => {
          const aDistance = parseFloat(a.distance.replace('km', ''));
          const bDistance = parseFloat(b.distance.replace('km', ''));
          return aDistance - bDistance;
        });
      case 'most-experience':
        return applicantsCopy.sort((a, b) => b.completedTasks - a.completedTasks);
      default:
        return applicantsCopy;
    }
  }, [applicants, sortBy]);

  const getTaskTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'shopping': 'Shopping Tasks',
      'local': 'Local Tasks',
      'pickup': 'Pickup Tasks',
      'care': 'Care Tasks',
      'verify': 'Verify Tasks'
    };
    return typeMap[type] || `${type} Tasks`;
  };

  const formatCompletionTime = (timeString: string) => {
    return timeString.charAt(0).toUpperCase() + timeString.slice(1);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-6 sticky top-0 z-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Review Applications</h2>
                  <p className="text-gray-600 mt-1">
                    {applicants.length} applicant{applicants.length !== 1 ? 's' : ''} applied for: {taskTitle}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <IoClose size={28} />
                </button>
              </div>

              {/* Sort Options */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Sort by:</span>
                <div className="flex gap-2">
                  {[
                    { key: 'least-price', label: 'Least Price' },
                    { key: 'closest', label: 'Closest' },
                    { key: 'most-experience', label: 'Most Experience' }
                  ].map((option) => (
                    <button
                      key={option.key}
                      onClick={() => setSortBy(option.key as SortOption)}
                      className={`px-4 py-2 text-sm rounded-full border transition-all ${
                        sortBy === option.key
                          ? 'bg-[#424BE0] text-white border-[#424BE0]'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-[#424BE0] hover:text-[#424BE0]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-b border-gray-200" />

            {/* Applicants List */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {sortedApplicants.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">👥</div>
                  <p className="text-gray-500 text-lg">No applicants yet</p>
                  <p className="text-gray-400 mt-2">Applications will appear here as runners apply</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {sortedApplicants.map((applicant) => (
                    <div
                      key={applicant.id}
                      className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-200 bg-white"
                    >
                      {/* Runner Header Info */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4 flex-1">
                          {/* Avatar */}
                          <div className="relative">
                            <div className="w-16 h-16 bg-linear-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center border-2 border-white shadow-sm">
                              {applicant.runnerPhoto ? (
                                <Image
                                  src={applicant.runnerPhoto}
                                  alt={applicant.runnerName}
                                  width={64}
                                  height={64}
                                  className="rounded-2xl object-cover"
                                />
                              ) : (
                                <span className="text-2xl font-bold text-[#424BE0]">
                                  {applicant.runnerName.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            {applicant.isRecommended && (
                              <div className="absolute -top-1 -right-1">
                                <IoRibbon className="text-yellow-500 text-xl" />
                              </div>
                            )}
                          </div>

                          {/* Name and Details */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {applicant.runnerName}
                              </h3>
                              {applicant.isVerified && (
                                <IoCheckmarkCircle className="text-green-500 text-lg" />
                              )}
                              {applicant.isRecommended && (
                                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">
                                  Recommended
                                </span>
                              )}
                            </div>
                            
                            {/* Rating */}
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex items-center gap-1">
                                <IoStar className="text-yellow-400 text-sm" />
                                <span className="text-sm font-medium text-gray-700">
                                  {applicant.rating.toFixed(1)}
                                </span>
                              </div>
                              <span className="text-gray-400">•</span>
                              <span className="text-sm text-gray-600">
                                {applicant.completedTasks} tasks completed
                              </span>
                            </div>

                            {/* Location */}
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <IoLocation className="text-gray-400" />
                              <span>{applicant.location}</span>
                              <span className="text-gray-400">•</span>
                              <span className="font-medium text-[#424BE0]">{applicant.distance}</span>
                            </div>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <p className="text-2xl font-bold text-[#424BE0]">
                            ₦{applicant.offerPrice.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">Agreed Price</p>
                        </div>
                      </div>

                      {/* Stats Row */}
                      <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-xl">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-900">
                            {applicant.completionRate}%
                          </p>
                          <p className="text-sm text-gray-600 mt-1">Completion Rate</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-900">
                            {applicant.completedTasks}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {getTaskTypeLabel(applicant.taskType)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-[#424BE0]">
                            ₦{applicant.offerPrice.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">Agreed Price</p>
                        </div>
                      </div>

                      {/* Personal Message */}
                      {applicant.personalMessage && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 mb-2 font-medium">Personal Message:</p>
                          <p className="text-gray-700 bg-blue-50 rounded-lg p-3 text-sm leading-relaxed">
                            "{applicant.personalMessage}"
                          </p>
                        </div>
                      )}

                      {/* Estimated Completion */}
                      <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
                        <span className="font-medium">Estimated completion:</span>
                        <span className="text-gray-700 font-semibold">
                          {formatCompletionTime(applicant.estimatedCompletion)}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => onViewProfile(applicant.runnerId)}
                          className="flex-1 py-3 text-sm border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium text-gray-700"
                        >
                          View Profile
                        </button>
                        <button
                          onClick={() => onAcceptOffer(applicant.id)}
                          className="flex-1 py-3 text-sm bg-[#424BE0] text-white rounded-xl hover:bg-[#353CCB] transition-colors font-medium shadow-sm"
                        >
                          Select Runner
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}