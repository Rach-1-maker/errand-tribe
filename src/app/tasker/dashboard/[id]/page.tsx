"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import { IoMdAnalytics } from "react-icons/io";
import { FcAlarmClock } from "react-icons/fc";
import { FaArrowTrendUp, FaUser, FaWallet } from "react-icons/fa6";
import { MdClear} from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import TermsModal from "@/app/components/Terms&Condition";
import SideBar from "@/app/components/SideBar";
import TopBar from "@/app/components/TopBar";
import { useParams, useRouter } from "next/navigation";
import { FlutterWaveButton, closePaymentModal } from 'flutterwave-react-v3';
import { useUser } from "@/app/context/UserContext";
import { toast } from "react-toastify";
import TaskSummaryCard from "@/app/components/TaskSummaryCard";
import { TokenManager } from "@/app/utils/tokenUtils";
import { useTaskStorage } from "@/app/hooks/useTaskStorage";
import ApplicantsReviewModal from "@/app/components/ApplicantsReviewModal";
import { syncTaskToRunners, updateTaskStatus } from "@/app/utils/taskSync";
import { useAuth } from "@/app/hooks/useAuth";
import { useSharedTaskStorage } from "@/app/hooks/useSharedTaskStorage";


export default function TaskerDashboard() {
  const { user, isLoading } = useAuth("/login", true);
  const {userData, isLoading: userLoading} = useUser()
  const {saveTaskToStorage, getLastTask, clearLastTask} = useTaskStorage()
  const params = useParams()
  const userId = userData?.id
  const [amount, setAmount] = useState<number | "">("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [walletBalance, setWalletBalance] = useState(0);
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [selectedErrand, setSelectedErrand] = useState<string | null>(null);
  const [lastTask, setLastTask] = useState<any | null>(null);
  const [applications, setApplications] = useState<any[]>([])
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [withdrawnTask, setWithdrawnTask] = useState<any | null>(null);
  const router = useRouter();
  

  const API_URL = process.env.NEXT_PUBLIC_API_URL

  
  useEffect(() => {
    const checkToken = () => {
      // Wait for UserContext to finish loading
      if (userLoading) {
        console.log("🔄 User context still loading, skipping token check");
        return;
      }

      const token = TokenManager.getAccessToken();
      console.log("🔐 Token check:", {
        userLoading,
        userData: !!userData,
        tokenAvailable: !!token,
        token: token ? `${token.substring(0, 10)}...` : 'None',
      });
      
      if (!token) {
        console.error("No authentication token found on dashboard");
        
        // If we have user data but no token, there's an inconsistency
        if (userData) {
          console.error("Inconsistent state: User data exists but no token found");
          // Consider redirecting to login or refreshing tokens
        }
      } else {
        console.log("✅ Token found and valid");
      }
    };

    checkToken();
  }, [userLoading, userData]);

    useEffect(() => {
      if (!lastTask?.id) {
        console.log('⏸️ No task ID available, skipping applications fetch');
        setApplications([]);
        return;
      }

      console.log('🔍 Fetching applications for task ID:', lastTask.id);
      fetchApplications(lastTask.id);

      // Set up interval to refresh applications every 30 seconds
      const interval = setInterval(() => {
        // Double-check we still have a valid task ID
        if (lastTask?.id) {
          console.log('🔄 Polling for applications...');
          fetchApplications(lastTask.id);

        } else {
          console.log('⏸️ No task ID, clearing interval');
          clearInterval(interval);
        }
      }, 30000);

      return () => {
        console.log('🧹 Cleaning up applications interval');
        clearInterval(interval);
      };
    }, [lastTask?.id, refreshTrigger]);

  const handleAcceptOffer = async (applicationId: string) => {
    try {
      const token = TokenManager.getAccessToken();
      const response = await fetch(`${API_URL}/applications/${applicationId}/status/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: "accepted"
        }),
      });

      if (response.ok) {
        toast.success('Offer accepted successfully!');
        setShowApplicantsModal(false);
        // Refresh applications list
        if (lastTask?.id) {
          fetchApplications(lastTask.id);
        }
      } else {
        const errorData = await response.json();
        toast.error('Failed to accept offer');
      }
    } catch (error) {
      console.error('Error accepting offer:', error);
      toast.error('Error accepting offer');
    }
  };

  const handleRejectOffer = async (applicationId: string) => {
    try {
      const token = TokenManager.getAccessToken();
      const response = await fetch(`${API_URL}/applications/${applicationId}/status/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: "rejected"
        }),
      });

      if (response.ok) {
        toast.success('Offer rejected');
        // Refresh applications list
        if (lastTask?.id) {
          fetchApplications(lastTask.id);
        }
      } else {
        const errorData = await response.json();
      toast.error(errorData.detail || 'Failed to reject offer');
    }
    } catch (error) {
      console.error('Error rejecting offer:', error);
      toast.error('Error rejecting offer');
    }
  };
  
  const transformApplicationData = (backendData: any[], task: any) => {

    if (!Array.isArray(backendData)) {
      console.warn('transformApplicationData: backendData is not an array:', backendData);
      return [];
    }
    return backendData.map((app) => {
      const mockRating = Math.random() * 1 + 4; // Random rating between 4.0 and 5.0
      const mockCompletedTasks = Math.floor(Math.random() * 50) + 1;
      const mockCompletionRate = Math.floor(Math.random() * 10) + 90; // 90-99%
      
      return {
        id: app.id,
        runnerId: app.runner,
        runnerName: app.runner_name,
        runnerPhoto: '/default-avatar.png',
        offerPrice: app.offer_amount,
        proposedDeadline: task?.deadline || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        personalMessage: app.message,
        status: app.status,
        rating: parseFloat(mockRating.toFixed(1)),
        completedTasks: mockCompletedTasks,
        completionRate: mockCompletionRate,
        taskType: task?.type || 'general',
        location: task?.location || 'Unknown',
        distance: `${(Math.random() * 5 + 1).toFixed(1)}km`, // Random distance 1.0-6.0km
        isVerified: Math.random() > 0.3, // 70% chance of being verified
        isRecommended: Math.random() > 0.7, // 30% chance of being recommended
        estimatedCompletion: 'within 2 hours',
        created_at: app.created_at
      };
    });
  };
      // Fetch applications for the last posted task
      const fetchApplications = async (errandId: string) => {
        if (!errandId || typeof errandId !== 'string') {
          console.error('❌ Invalid errandId:', errandId);
          setApplications([]);
          return;
        }

        try {
          const token = TokenManager.getAccessToken();
          if (!token) {
            console.error('No authentication token found');
            return;
          }

          console.log('🔍 Fetching applications from:', `${API_URL}/errands/${errandId}/applications/`);
          const response = await fetch(`${API_URL}/errands/${errandId}/applications/`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const applicationsData = await response.json();
            console.log('✅ Applications fetched:', {
              count: Array.isArray(applicationsData) ? applicationsData.length : 'unknown',
              data: applicationsData
            });
            const applicationsArray = Array.isArray(applicationsData) 
            ? applicationsData 
            : applicationsData?.results 
            || applicationsData?.applications 
            || applicationsData?.data 
            || [];

            console.log('🔄 Raw applications array:', applicationsArray);
            const transformedApplications = transformApplicationData(applicationsArray, lastTask);
            console.log('✅ Transformed applications:', transformedApplications);

            setApplications(transformedApplications);

            if (transformedApplications.length > 0 && applications.length === 0) {
              toast.info(`${transformedApplications.length} new application${transformedApplications.length > 1 ? 's' : ''} received!`);
            }
          } else if (response.status === 404) {
            console.log('No applications endpoint found for this errand.');
            setApplications([]);
          } else if (response.status === 401) {
            console.error('🔐 Unauthorized - token may be expired');
            // Handle token refresh or redirect to login
            setApplications([]);
          } else {
            console.error('Failed to fetch applications:', response.status);
            setApplications([]);
          }
        } catch (error) {
          console.error('Error fetching applications:', error);
          setApplications([]);
        }
      };

      const handleRefreshApplications = () => {
        if (lastTask?.id) {
          console.log('🔄 Manual refresh triggered');
          fetchApplications(lastTask.id);
          toast.info('Refreshing applications...');
        }
      };

      const handleViewProfile = (runnerId: string) => {
      // Navigate to runner's profile page or show profile modal
      router.push(`/runner/profile/${runnerId}`);
    };
    
    useEffect(() => {
      console.log("🔍 TaskerDashboard Debug:", {
        userData,
        userLoading,
        userIdFromUserContext: userData?.id,
        userIdFromParams: params?.id,
        userDataAvailable: !!userData,
        userRole: userData?.role
      });
      
      // Check if we should show terms modal
      if (userData?.id) {
        const acceptedUsers = JSON.parse(localStorage.getItem("acceptedUsers") || "{}");
        const userRecord = acceptedUsers[userData.id];
        const isNewUser = localStorage.getItem("isNewUser") === "true";
        
        console.log("📋 Terms Check:", {
          userId: userData.id,
          hasUserRecord: !!userRecord,
          userRecord,
          isNewUser,
          shouldShowTerms: !userRecord || isNewUser
        });
        
        if ((!userRecord || isNewUser) && userData.id) {
          setShowTerms(true);
          localStorage.removeItem("isNewUser");
        } else {
          console.log("✅ Terms already accepted or no user ID");
          setShowTerms(false);
        }
      }
    }, [userData, userLoading, params?.id]);
    
    const handleTermsAgree = () => {
      console.log("Terms agreed, closing modal");
      setShowTerms(false);
    }
    const handleWithdrawTask = () => {
      if (!lastTask) return;
      setShowWithdrawConfirm(true)
        // Temporarily store the withdrawn task in memory
        const withdrawnTask = lastTask;
        
        // Remove from localStorage and update runner dashboard
        const syncSuccess = updateTaskStatus(lastTask.id, 'withdrawn');

        clearLastTask();    // clear from localStorage
        setLastTask(null);  // update UI
        setShowWithdrawConfirm(false)


        toast.info("Your task has been withdrawn. Undo?", {
          autoClose: 5000, // auto close after 5 seconds
          closeOnClick: false,
          position: "top-right",
          draggable: false,
          hideProgressBar: false,
          pauseOnHover: true,
          onClick: () => handleUndoWithdraw(withdrawnTask),
        });
        if (!syncSuccess) {
          console.warn('⚠️ Task might still appear on runner dashboard');
        }
      };

    const handleUndoWithdraw = (withdrawnTask: any) => {
      const success = saveTaskToStorage(withdrawnTask);
      if (success) {
        setLastTask(withdrawnTask);
        toast.success("Your task has been restored!");
      } else {
        toast.error("Failed to restore task");
      }
    };



  useEffect(() => {
    // Wait for user context to load
    if (userLoading) return;

    const token = TokenManager.getAccessToken();
    console.log("Dashboard auth check:", {
      userLoading,
      userData: !!userData,
      token: token ? "Available" : "Missing"
    });
    
    if (!token) {
      console.error("No authentication token found on dashboard");
      if (userData) {
        console.error("Auth inconsistency: User data exists but token missing");
      }
    } else {
      console.log("✅ Dashboard authentication verified");
    }

    // Check if user is new (first time visiting dashboard after signup)
    const isNewUser = localStorage.getItem("isNewUser") === "true";
    const termsAccepted = localStorage.getItem("termsAccepted") === "true";
    
    if (!termsAccepted || isNewUser) {
      setShowTerms(true);
      localStorage.removeItem("isNewUser");
    }
  }, [userLoading, userData]); // Add dependencies

   
  useEffect(() => {
    if (!userData?.id) return;
    
    const loadedTask = getLastTask();
    console.log("Loaded task from storage:", loadedTask);
    
    if (loadedTask) {
      setLastTask(loadedTask);
     if (loadedTask.id) {
        fetchApplications(loadedTask.id);
      }
    } else {
      setLastTask(null);
    }
  }, [userData?.id, getLastTask]);

  useEffect(() => {
    if (lastTask) {
      console.log("🔍 Task ID Debug:", {
        taskId: lastTask.id,
        taskIdType: typeof lastTask.id,
        taskData: lastTask
      });
    }
  }, [lastTask]);

  const handleTaskCreation = async (taskData: any) => {
    try {
      const token = TokenManager.getAccessToken();
      console.log('📤 Creating task on backend...', {
        taskData,
        hasToken: !!token
      });
      const response = await fetch(`${API_URL}/posted-errands/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData)
      });
      
      if (response.ok) {
      const savedTask = await response.json();

      await new Promise(resolve => setTimeout(resolve, 500));
  
      // NOW sync with the backend UUID
      syncTaskToRunners(savedTask);
      console.log("✅ Task created with backend UUID:", {
        id: savedTask.id,
        idType: typeof savedTask.id,
        fullResponse: savedTask
      });
      
      const userFirstName = userData?.firstName || userData?.first_name || "Anonymous";
      const userLastName = userData?.lastName || userData?.last_name || "User";
      const userProfilePhoto = userData?.profilePhoto || userData?.profile_photo || "/default-avatar.png";

      const taskWithBackendId = {
        ...savedTask, // This contains the real UUID from backend
        id: savedTask.id, // Use the backend UUID
        createdAt: new Date().toISOString(),

        price_min: savedTask.price_min || savedTask.price,
        price_max: savedTask.price_max || savedTask.price,
        task_type: savedTask.task_type || savedTask.type || "General",
        user: savedTask.user || {
          first_name: userFirstName,
          last_name: userLastName,
          profile_photo: userProfilePhoto
        }
      };
      console.log('🔄 Attempting to sync task to runners:', taskWithBackendId);
      const syncSuccess = syncTaskToRunners(taskWithBackendId);
      console.log('🔄 Task sync result:', syncSuccess);

      // Save to storage with the REAL UUID
      const saveSuccess = saveTaskToStorage(taskWithBackendId);
      
      if (saveSuccess && syncSuccess) {
        return savedTask;
      } else {
        console.error("Failed to save task to storage");
        return null;
      }
    } else {
      console.error('❌ Task creation failed:', response.status);
      return null;
    }
  } catch (error) {
    console.error('Error creating task:', error);
    return null;
  }
}
  useEffect(() => {
    if (lastTask) {
      console.log('🔍 VERIFYING TASK SYNC - COMPREHENSIVE CHECK:');
      
      // Check all available tasks in localStorage
      const availableTasks = Object.keys(localStorage)
        .filter(k => k.startsWith('available_task_'))
        .map(k => ({ 
          key: k, 
          data: JSON.parse(localStorage.getItem(k) || '{}'),
          exists: !!localStorage.getItem(k)
        }));
      
      console.log('📋 All available tasks in localStorage:', availableTasks);
      
      // Check if current task exists in available tasks
      const currentTaskInAvailable = availableTasks.find(task => 
        task.data.id === lastTask.id
      );
      
      console.log('✅ Current task sync status:', {
        taskerTaskId: lastTask.id,
        foundInAvailableTasks: !!currentTaskInAvailable,
        availableTaskCount: availableTasks.length,
        currentTaskData: currentTaskInAvailable?.data
      });
    }
  }, [lastTask]);

  const errandOptions = [
    { name: "Local Micro Errand", icon: "/local.svg", label: "Quick task around your area" },
    { name: "Supermarket Runs", icon: "/super-runs.svg", label: "Grocery shoppings & Deliveries" },
    { name: "Pickup & Delivery", icon: "/pickup.svg", label: "Move Items from one place to another" },
    { name: "Care Tasks", icon: "/care-task.svg", label: "Personal care & assistance" },
    { name: "Verify It", icon: "/verify-task.svg", label: "Document verification tasks" },
  ];

  const errandRoutes: Record<string, string> = {
    "Local Micro Errand": "/tasker/dashboard/local-errand",
    "Supermarket Runs": "/tasker/dashboard/supermarket-runs",
    "Pickup & Delivery": "/tasker/dashboard/pickup-delivery",
    "Care Tasks": "/tasker/dashboard/care-tasks",
    "Verify It": "/tasker/dashboard/verify-it",
  }

  const [dashboardStats, setDashboardStats] = useState({
    timeSaved: 0,
    repeatedRunner: "-",
    totalSpent: 0,
    successRate: 0,
    commonErrand: "-",
    avgCostPerErrand: 0,
  });
  
  const config = {
    public_key: process.env.NEXT_PUBLIC_FLW_PUBLIC_KEY!,
    tx_ref: Date.now().toString(),
    amount: amount || 1000,
    currency: 'NGN',
    payment_options: 'card,mobilemoney,ussd',
    customer: {
      email: userData?.email || 'user@gmail.com',
      phone_number: userData?.phone || '070********',
      name: `${userData?.firstName || userData?.first_name || ""} ${userData?.lastName || userData?.last_name || ""}`.trim() || 'Anonymous User',
    },
    customizations: {
      title: 'Errand Tribe Wallet Funding',
      description: 'Fund your wallet to start running errands',
      logo: '/dashboardlogo.svg',
    },
  };

  const handlePaymentSuccess = (response: any) => {
    toast.success("Wallet funded successfully!")
    console.log("Payment successful:", response);
    closePaymentModal();
    setWalletBalance((prev) => prev + Number(amount));
    setIsFundModalOpen(false);
    setAmount("");
  }
  
  const fwConfig = {
    ...config,
    text: 'Pay Now',
    callback: handlePaymentSuccess,
    onClose: () => console.log("Payment closed"),
  };
  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#F2F2FD] items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#424BE0] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Add this to your TaskerDashboard component
const TaskCreationDebug = () => {
  const { getAllAvailableTasks } = useSharedTaskStorage();
  
  useEffect(() => {
    console.log("🔍 TASKER DEBUG - Current state:", {
      lastTask: lastTask,
      localStorageTasks: Object.keys(localStorage).filter(key => 
        key.startsWith('available_task_') || key.startsWith('lastPostedTask_')
      ),
      availableTasksCount: getAllAvailableTasks().length
    });
  }, [lastTask, getAllAvailableTasks]);

    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
        <h4 className="font-semibold text-sm mb-2 text-green-800">Task Creation Debug:</h4>
        <div className="text-xs space-y-1">
          <p><strong>Last Task:</strong> {lastTask ? lastTask.title : 'None'}</p>
          <p><strong>Last Task ID:</strong> {lastTask ? lastTask.id : 'None'}</p>
          <p><strong>Available Tasks in Storage:</strong> {getAllAvailableTasks().length}</p>
          <button 
            onClick={() => {
              console.log("🔍 Full task creation debug:", {
                lastTask,
                localStorage: Object.keys(localStorage)
                  .filter(k => k.startsWith('available_task_'))
                  .map(k => ({ key: k, data: JSON.parse(localStorage.getItem(k) || '{}') })),
                allStorage: Object.keys(localStorage)
              });
            }}
            className="bg-green-500 text-white px-2 py-1 rounded text-xs mt-1"
          >
            Inspect Task Creation
          </button>
        </div>
      </div>
    );
  };
  return (
    <div className="flex min-h-screen bg-[#F2F2FD] text-[#1E1E1E] flex-col md:flex-row overflow-hidden">
      {showTerms && userData?.id && (
        <TermsModal
          userId={userData?.id}
          role="tasker"
          onAgree={handleTermsAgree}
        />
      )}
      
      <ApplicantsReviewModal
        isOpen={showApplicantsModal}
        onClose={() => setShowApplicantsModal(false)}
        applicants={applications}
        taskTitle={lastTask?.title || 'Task'}
        taskType={lastTask?.type || 'general'} 
        onAcceptOffer={handleAcceptOffer}
        onRejectOffer={handleRejectOffer}
        onViewProfile={handleViewProfile}
        />
      {/* Sidebar (desktop) */}
      <div className="hidden md:flex h-screen sticky top-0">
        <SideBar userType="tasker" />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
          <div className="fixed top-0 left-0 w-64 h-full bg-white shadow-lg z-50 md:hidden overflow-y-auto">
            <SideBar userType="tasker" onClose={() => setIsSidebarOpen(false)} />
          </div>
        </>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Bar with mobile menu toggle */}
        <div className="shrink-0">
          <TopBar onMenuClick={() => setIsSidebarOpen(true)} />
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 mt-4 overflow-auto pb-6">
          {/* Wallet Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 px-4 gap-6 mx-auto w-[95%] mb-6">
            <div className="relative bg-linear-to-r from-[#424BE0] via-[#7277EB] to-[#AEB0F4] text-white rounded-3xl p-6 md:p-8 flex justify-between items-center shadow-lg">
              {/* Left Section */}
              <div className="flex flex-col justify-between">
                <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center mb-3">
                  <FaWallet className="text-xl text-white" />
                </div>
                <div>
                  <p className="text-white/90 text-sm font-medium mb-1">Wallet Overview</p>
                  <p className="text-white text-xl md:text-2xl font-bold">
                    In Escrow: ₦{walletBalance.toLocaleString()}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setIsFundModalOpen(true)}
                className="bg-white/30 cursor-pointer text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-white/40 transition"
              >
                Fund Wallet
              </button>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: "Time Saved", value: 0, icon: <FcAlarmClock className="text-2xl" /> },
                { title: "Repeated Runner", value: "-", img: '/medal.svg' },
                { title: "Total Spent", value: 0, img: '/coin.svg' },
                { title: "Success Rate", value: 0, icon: <IoMdAnalytics className="text-[#424BE0] text-3xl" /> },
                { title: "Common Errand", value: "-", img: '/bus.svg' },
                { title: "Avg cost per errand", value: 0, img: '/interest.svg' },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="bg-[#F9FAFB] rounded-2xl shadow-sm p-4 border-8 border-white hover:shadow-md transition flex justify-between items-center"
                >
                  <div>
                    <p className="text-xs text-gray-500">{stat.title}</p>
                    <p className="text-xl font-semibold mt-2">{stat.value}</p>
                    <span><FaArrowTrendUp className="text-[#CCCCCC]" /></span>
                  </div>
                  <div>
                    {stat.icon ? (
                      stat.icon
                    ) : (
                      <Image
                        src={stat.img}
                        alt={stat.title}
                        width={28}
                        height={28}
                        className="object-contain"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Funding Modal */}
          <AnimatePresence>
            {isFundModalOpen && (
              <motion.div
              key="fund-modal"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/10 backdrop-blur-sm flex justify-center items-center z-50"
              >
                <div className="bg-white rounded-3xl shadow-xl w-[90%] sm:w-[80%] md:max-w-md p-8 relative mx-4">
                  <button
                    onClick={() => setIsFundModalOpen(false)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
                  >
                    <MdClear className="text-xl" />
                  </button>

                  <h2 className="text-xl font-semibold text-center mb-1 text-[#1E1E1E]">
                    Fund Your Wallet
                  </h2>
                  <p className="text-sm text-center mb-6 text-gray-500">
                    Enter the amount you want to add
                  </p>

                  <input
                    type="number"
                    placeholder="Enter amount (₦)"
                    className="w-full border border-gray-300 rounded-lg p-3 mb-6 text-center text-lg"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                  />

                  <div className="flex justify-center">
                    <FlutterWaveButton
                      {...fwConfig}
                      disabled={!amount}
                      className={`${
                        amount
                          ? "bg-[#424BE0] hover:bg-[#353CCB]"
                          : "bg-gray-300 cursor-not-allowed"
                      } text-white px-6 py-3 rounded-full font-medium transition`}
                    />
                  </div>
                </div>
              </motion.div>
            )}
            <AnimatePresence>
              {showWithdrawConfirm && (
                <motion.div
                key="withdraw-confirm-modal"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50"
                >
                  <motion.div
                  key="withdraw-confirm-content"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="bg-white rounded-3xl shadow-xl w-[90%] sm:w-[80%] md:max-w-md p-8 relative"
                  >
                    <button
                      onClick={() => setShowWithdrawConfirm(false)}
                      className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
                    >
                      <MdClear className="text-xl" />
                    </button>

                    <h2 className="text-xl font-semibold text-center mb-2 text-[#1E1E1E]">
                      Withdraw Task?
                    </h2>
                    <p className="text-sm text-center text-gray-500 mb-6">
                      Are you sure you want to withdraw your last posted task? This action can be undone within a few seconds.
                    </p>

                    <div className="flex justify-center gap-4">
                      <button
                        onClick={() => setShowWithdrawConfirm(false)}
                        className="bg-gray-100 text-gray-700 px-5 py-2 rounded-4xl hover:bg-gray-200 transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          const taskToWithdraw = lastTask;
                          clearLastTask();
                          setLastTask(null);
                          setShowWithdrawConfirm(false);

                          // show undo toast
                          toast.info("Task withdrawn. Click to undo.", {
                            autoClose: 5000,
                            closeOnClick: true,
                            position: "top-right",
                            hideProgressBar: false,
                            onClick: () => handleUndoWithdraw(taskToWithdraw),
                          });
                        }}
                        className="bg-[#F54900] text-white px-5 py-2 rounded-4xl hover:bg-[#e44100] transition cursor-pointer"
                      >
                        Withdraw
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

          </AnimatePresence>

          {/* Task Section */}
          <div className="px-4">
            {lastTask && <TaskCreationDebug/> ? (
              <div className="w-full max-w-7xl mx-auto">
                {/* Green background container with 90% width */}
                <div className="w-[90%] mx-auto bg-[#D3FEB0]/30 rounded-2xl shadow-md p-6 lg:p-8 relative">
                  
                  {/* Left Side: Status Message */}
                  <div className="flex flex-col lg:flex-row gap-6 items-start">
                    {/* Status content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 ml-6 mt-8">
                        <div className="w-3 h-3 bg-[#F54900] rounded-full"></div>
                        <h3 className="text-md font-semibold text-black">Task Posted</h3>
                      </div>
                      <p className="text-black ml-6 mb-4 font-semibold text-xl lg:text-3xl max-w-xs">
                        Sit Tight and Let us Find Runners For You
                      </p>

                      {/* Applications Section */}
                      <div className="ml-6 mt-6 bg-white rounded-xl p-4 shadow-sm max-w-md">
                        {applications.length > 0 ? (
                          
                          <div className="flex flex-col gap-3">
                            {/* Applications count and review button */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FaUser className="text-[#424BE0] text-lg" />
                                <span className="text-sm font-medium text-gray-700">
                                  {applications.length} application{applications.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                              <button
                                onClick={() => setShowApplicantsModal(true)}
                                className="bg-[#424BE0] text-white text-sm px-4 py-2 rounded-full hover:bg-[#353CCB] transition cursor-pointer"
                              >
                                Review
                              </button>
                            </div>
                            
                            {/* Runners are interested message */}
                            <p className="text-xs text-gray-500">
                              Runners are interested!
                            </p>

                            {applications.length === 0 && (
                              <div className="flex flex-col gap-2">
                                <p className="text-sm text-gray-600">
                                  Waiting for runners to apply...
                                </p>
                                <button
                                  onClick={handleRefreshApplications}
                                  className="text-[#424BE0] text-xs hover:underline"
                                >
                                  Refresh
                                </button>
                              </div>
                            )}
                            {/* Withdraw button */}
                            <button
                              onClick={handleWithdrawTask}
                              className="text-white text-sm bg-[#F54900] px-4 py-2 rounded-xl hover:bg-[#e44100] transition cursor-pointer w-full mt-2"
                            >
                              Withdraw Task
                            </button>
                          </div>
                        ) : (
                          /* Only show withdraw button when no applications */
                          <button
                            onClick={handleWithdrawTask}
                            className="text-white text-sm bg-[#F54900] px-6 py-3 rounded-xl hover:bg-[#e44100] transition cursor-pointer w-full"
                          >
                            Withdraw Task
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 w-full">
                      <TaskSummaryCard task={lastTask} />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/60 mt-16 rounded-2xl shadow-md p-8 text-center w-full max-w-2xl mx-auto">
                <h3 className="text-xl font-semibold mb-2">Start your First Task</h3>
                <p className="text-gray-500 mb-6">
                  Take the burden off and find the help you need on Escrow
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-[#424BE0] text-white cursor-pointer px-5 py-3 rounded-full font-medium hover:bg-[#353CCB] transition flex items-center justify-center mx-auto gap-2"
                >
                  Post a task
                  <span className="text-xl font-semibold bg-[#EFF0FD] text-[#424BE0] shadow-2xl w-7 h-7 rounded-full">+</span>
                </button>
              </div>
            )}
          </div>

        {/* Errand Selection Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-md flex justify-center items-center z-50 p-4"
            >
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="w-full max-w-2xl"
              >
                <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
                  >
                    <MdClear className="text-xl" />
                  </button>

                  <h2 className="text-lg sm:text-2xl font-semibold text-center mb-1 text-[#1E1E1E]">
                    What type of task do you need
                  </h2>
                  <p className="text-xs md:text-sm text-center mb-8 text-gray-500">
                    Select a category to get started
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                    {errandOptions.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedErrand(item.name)}
                        className={`flex flex-col items-center cursor-pointer justify-center bg-[#F9FAFB] hover:bg-[#EFF0FD] rounded-2xl p-4 transition-all ${
                          selectedErrand === item.name 
                            ? 'border-2 border-[#424BE0]' 
                            : 'border-0'
                        }`}
                      >
                        <Image
                          src={item.icon}
                          alt={item.name}
                          width={40}
                          height={40}
                          className="mb-2"
                        />
                        <span className="text-sm font-medium text-[#3E3E44] text-center">{item.name}</span>
                        <span className="text-xs text-center mt-1 leading-tight text-black/50">{item.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-center">
                    <button
                      disabled={!selectedErrand}
                      onClick={() => {
                        const selectedErrandData = errandOptions.find(errand => errand.name === selectedErrand);
                        if (selectedErrandData) {
                          setIsModalOpen(false);
                          const route = errandRoutes[selectedErrandData.name];
                          if (route) {
                            router.push(`${route}?type=${encodeURIComponent(selectedErrandData.name)}&icon=${encodeURIComponent(selectedErrandData.icon)}`);
                          }
                        }
                      }}
                      className={`px-8 py-3 rounded-2xl font-medium transition w-full max-w-xs ${
                        selectedErrand
                          ? 'bg-[#424BE0] text-white hover:bg-[#353CCB]'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Continue
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </main>
    </div>
  );
}