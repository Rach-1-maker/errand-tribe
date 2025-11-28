'use client';
import React, { useState, useEffect } from 'react';
import { FiSearch, FiChevronDown } from 'react-icons/fi';
import { IoTimeOutline, IoCheckmarkCircleOutline, IoCloseCircleOutline } from 'react-icons/io5';
import SideBar from '../components/SideBar';
import TopBar from '../components/TopBar';
import OfferCard from '../components/OfferCard';
import ErrandDetailsDrawer from '../components/ErrandDetailsDrawer';

// Types
interface Offer {
  id: string;
  task: {
    id: string;
    title: string;
    description: string;
    location: string;
    deadline: string;
    duration: string;
    price_min: number;
    price_max: number;
    requirements: string[];
    photos: string[];
    user: {
      first_name: string;
      last_name: string;
      profile_photo: string;
      rating: number;
    };
  };
  offer_amount: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  submitted_at: string;
  personal_message?: string;
}

export default function MyOffers() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch runner's offers
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setLoading(true);
        // Replace with your actual API endpoint
        const response = await fetch('/api/runner/offers', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setOffers(data.offers || []);
        } else {
          console.error('Failed to fetch offers');
          setOffers([]);
        }
      } catch (error) {
        console.error('Error fetching offers:', error);
        setOffers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, []);

  // Calculate stats
  const stats = {
    pending: offers.filter(offer => offer.status === 'pending').length,
    accepted: offers.filter(offer => offer.status === 'accepted').length,
    notSelected: offers.filter(offer => ['rejected', 'expired'].includes(offer.status)).length
  };

  // Filter offers based on search and status
  const filteredOffers = offers.filter(offer => {
    const matchesSearch = offer.task.title.toLowerCase().includes(searchTerm.toLowerCase()) || `${offer.task.user.first_name} ${offer.task.user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'pending' && offer.status === 'pending') ||
                         (statusFilter === 'accepted' && offer.status === 'accepted') ||
                         (statusFilter === 'not-selected' && ['rejected', 'expired'].includes(offer.status));
    return matchesSearch && matchesStatus;
  });

  const handleViewTask = (offer: Offer) => {
    setSelectedOffer(offer);
    setShowDrawer(true);
  };

  const handleCloseDrawer = () => {
    setShowDrawer(false);
    setSelectedOffer(null);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar (desktop) */}
      <div className="hidden md:flex h-screen sticky top-0">
        <SideBar userType="runner" />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
          <div className="fixed top-0 left-0 w-64 h-full bg-white shadow-lg z-50 md:hidden overflow-y-auto">
            <SideBar userType="runner" onClose={() => setIsSidebarOpen(false)} />
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Bar with mobile menu toggle */}
        <div className="shrink-0">
          <TopBar onMenuClick={() => setIsSidebarOpen(true)} />
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">My Offers</h1>
            <p className="text-gray-600">Track all your submitted offers and their status below.</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <StatCard
              icon={<IoTimeOutline className="w-6 h-6" />}
              title="Pending Offers"
              count={stats.pending}
              color="text-yellow-600"
              bgColor="bg-yellow-50"
            />
            <StatCard
              icon={<IoCheckmarkCircleOutline className="w-6 h-6" />}
              title="Accepted Offers"
              count={stats.accepted}
              color="text-green-600"
              bgColor="bg-green-50"
            />
            <StatCard
              icon={<IoCloseCircleOutline className="w-6 h-6" />}
              title="Not Selected"
              count={stats.notSelected}
              color="text-red-600"
              bgColor="bg-red-50"
            />
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search offers by task title or client name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Status Filter */}
              <div className="sm:w-48 relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                >
                  <option value="all">All Offers</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="not-selected">Not Selected</option>
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Offers List */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOffers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  onViewTask={() => handleViewTask(offer)}
                />
              ))}
            </div>
          )}

          {!loading && filteredOffers.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-500 text-lg mb-2">No offers found</p>
              <p className="text-gray-400">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </main>

      {/* Errand Details Drawer */}
      {showDrawer && selectedOffer && (
        <ErrandDetailsDrawer
          offer={selectedOffer}
          onClose={handleCloseDrawer}
        />
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ icon, title, count, color, bgColor }: any) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{count}</p>
        </div>
        <div className={`p-3 rounded-full ${bgColor} ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}