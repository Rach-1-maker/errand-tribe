import React from 'react';
import Image from 'next/image';

interface OfferCardProps {
  offer: any;
  onViewTask: () => void;
}

export default function OfferCard({ offer, onViewTask }: OfferCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'accepted':
        return 'Accepted';
      case 'rejected':
        return 'Not Selected';
      case 'expired':
        return 'Expired';
      default:
        return status;
    }
  };

  const clientName = `${offer.task.user.first_name} ${offer.task.user.last_name}`;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{offer.task.title}</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(offer.status)}`}>
              {getStatusText(offer.status)}
            </span>
          </div>
          
          <div className="flex items-center gap-2 mb-3">
            <Image
              src={offer.task.user.profile_photo || '/default-avatar.png'}
              alt={clientName}
              width={24}
              height={24}
              className="rounded-full"
            />
            <span className="text-sm text-gray-600">{clientName}</span>
            <span className="text-sm text-gray-500">⭐ {offer.task.user.rating || '4.8'}</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Your Offer</p>
              <p className="font-semibold text-[#424BE0]">₦{offer.offer_amount?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-500">Location</p>
              <p className="font-semibold">{offer.task.location}</p>
            </div>
            <div>
              <p className="text-gray-500">Task Deadline</p>
              <p className="font-semibold">{new Date(offer.task.deadline).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-gray-500">Submitted</p>
              <p className="font-semibold">{new Date(offer.submitted_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onViewTask}
          className="px-6 py-2 border border-[#424BE0] text-[#424BE0] rounded-lg hover:bg-[#424BE0] hover:text-white transition-colors font-medium"
        >
          View Task
        </button>
      </div>
    </div>
  );
}