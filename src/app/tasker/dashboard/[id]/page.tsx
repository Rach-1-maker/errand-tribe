"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { IoMdAnalytics } from "react-icons/io";
import { FcAlarmClock } from "react-icons/fc";
import { FaArrowTrendUp, FaWallet } from "react-icons/fa6";
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


export default function TaskerDashboard() {
  const {userData, isLoading: userLoading} = useUser()
  const {getLastTask} = useTaskStorage()
  const params = useParams()
  const userId = params.id as string
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
  const [withdrawnTask, setWithdrawnTask] = useState<any | null>(null);
  const router = useRouter();


  const { clearLastTask } = useTaskStorage();

  const handleWithdrawTask = () => {
    if (!lastTask) return;
    setShowWithdrawConfirm(true)
      // Temporarily store the withdrawn task in memory
      const withdrawnTask = lastTask;

      clearLastTask();    // clear from localStorage
      setLastTask(null);  // update UI
      toast.info("Your task has been withdrawn. Undo?", {
        autoClose: 5000, // auto close after 5 seconds
        closeOnClick: false,
        position: "top-right",
        draggable: false,
        hideProgressBar: false,
        pauseOnHover: true,
        onClick: () => handleUndoWithdraw(withdrawnTask),
      });
    
  };

  const handleUndoWithdraw = (withdrawnTask: any) => {
  // Save task back to localStorage
  saveTaskToStorage(withdrawnTask);
  setLastTask(withdrawnTask);
  toast.success("Your task has been restored!");
};

  const saveTaskToStorage = (task: any) => {
    if (!userData?.id) {
      console.error("No user ID available to save task");
      return;
    }
    
    const userSpecificKey = `lastPostedTask_${userData.id}`;
    const taskWithUserId = {
      ...task,
      userId: userData.id, // Add user ID to the task
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem(userSpecificKey, JSON.stringify(taskWithUserId));
    setLastTask(taskWithUserId);
    console.log("Task saved for user:", userData.id);
  };

  useEffect(() => {
    console.log("🔍 User Context Debug:", {
      userData,
      userLoading,
      userIdFromParams: userId,
      userDataId: userData?.id
    });
  }, [userData, userLoading, userId]);

  useEffect(() => {
     // Debug: Check all storage locations
    console.log("🔐 Token Debug Info:", {
      localStorageToken: localStorage.getItem("access_token"),
      sessionStorageToken: sessionStorage.getItem("access_token"),
      localStorageRefresh: localStorage.getItem("refresh_token"),
      sessionStorageRefresh: sessionStorage.getItem("refresh_token"),
      fullURL: window.location.href,
      timestamp: new Date().toISOString()
    });

    const token = TokenManager.getAccessToken();
    console.log("Dashboard token:", token ? "Available" : "Missing");
    
    if (!token) {
      console.error("No authentication token found on dashboard");
      // You might want to redirect to login or handle this case
    }

    // Check if user is new (first time visiting dashboard after signup)
    const isNewUser = localStorage.getItem("isNewUser") === "true"
    const termsAccepted = localStorage.getItem("termsAccepted") === "true"
   
    
    if (!termsAccepted || isNewUser) {
      setShowTerms(true);
      localStorage.removeItem("isNewUser");
    }
  }, []);

  const handleTermsAgree = () => {
    console.log("Terms agreed, closing modal");
    setShowTerms(false);
  }
   
  useEffect(() => {
    if (!userData?.id) return;
    
    const loadedTask = getLastTask();
    console.log("📦 Loaded task from storage:", loadedTask);
    
    if (loadedTask) {
      setLastTask(loadedTask);
    } else {
      setLastTask(null);
    }
  }, [userData?.id, getLastTask]);

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
      name: `${userData?.firstName || ""} ${userData?.lastName || ""}`.trim() || 'Anonymous User',
    },
    customizations: {
      title: 'Errand Tribe Wallet Funding',
      description: 'Fund your wallet to start running errands',
      logo: '/logo.png',
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

  return (
    <div className="flex min-h-screen bg-[#F2F2FD] text-[#1E1E1E] flex-col md:flex-row overflow-hidden">
      {showTerms && (
        <TermsModal
          userId={userId}
          onAgree={handleTermsAgree}
        />
      )}
      
      {/* Sidebar (desktop) */}
      <div className="hidden md:flex h-screen sticky top-0">
        <SideBar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
          <div className="fixed top-0 left-0 w-64 h-full bg-white shadow-lg z-50 md:hidden overflow-y-auto">
            <SideBar onClose={() => setIsSidebarOpen(false)} />
          </div>
        </>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Bar with mobile menu toggle */}
        <div className="flex-shrink-0">
          <TopBar onMenuClick={() => setIsSidebarOpen(true)} />
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 mt-4 overflow-auto pb-6">
          {/* Wallet Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 px-4 gap-6 mx-auto w-[95%] mb-6">
            <div className="relative bg-gradient-to-r from-[#424BE0] via-[#7277EB] to-[#AEB0F4] text-white rounded-[24px] p-6 md:p-8 flex justify-between items-center shadow-lg">
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
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50"
                >
                  <motion.div
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
            {lastTask ? (
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
                      <button
                        onClick={handleWithdrawTask}
                        className="text-white ml-6 mt-6 text-sm bg-[#F54900] px-6 py-3 rounded-xl hover:bg-[#e44100] transition cursor-pointer">
                        Withdraw Task
                      </button>

                      {applications.length > 0 && (
                        <div className="flex items-center gap-3 mt-4">
                          <p className="text-sm text-gray-800 font-medium">
                            {applications.length} runner(s) applied
                          </p>
                          <button
                            onClick={() => setShowApplicantsModal(true)}
                            className="bg-[#424BE0] text-white text-sm px-4 py-2 rounded-full hover:bg-[#353CCB] transition"
                          >
                            Review
                          </button>
                        </div>
                      )}
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