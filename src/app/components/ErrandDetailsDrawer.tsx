'use client';
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { IoClose } from "react-icons/io5";
import { CiCalendar, CiLocationOn } from "react-icons/ci";
import { LiaCoinsSolid } from "react-icons/lia";
import OfferSuccessModal from "./OfferSuccessModal"; 
import { toast } from "react-toastify";
import { authenticatedFetch } from "../utils/apiClient";

export default function ErrandDetailsDrawer({ task, onClose }: any) {
  const [animate, setAnimate] = useState(false);
  const [offerAmount, setOfferAmount] = useState<number | "">("");
  const [personalMessage, setPersonalMessage] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (task) {
      console.log("🎯 ErrandDrawer Task Analysis:", {
        taskId: task.id,
        taskErrandId: task.errand_id,
        isMock: task.isMock,
        status: task.status,
        hasValidId: task.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(task.id),
        source: task.createdAt ? 'local-storage' : 'backend-api',
        allTaskKeys: Object.keys(task)
      });
    }
  }, [task]);

  // disable background scrolling while drawer open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "auto";
    };
  }, []);

  // trigger slide animation
  useEffect(() => {
    const t = setTimeout(() => setAnimate(true), 20);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setAnimate(false);
    setTimeout(() => onClose?.(), 260);
  };

  if (!task) return null;

  const getErrandId = () => {
    return task.id || task.errand_id;
  };

  const taskRequirements = [
    "Take a photo of the receipt",
    "Call client before drop-off to confirm timing",
    "Ensure all items are checked against the list",
    "Keep all receipts safe and submit them upon completion"
  ];

  // ✅ FIXED: Complete handleSubmitOffer function
  const handleSubmitOffer = async (e?: React.FormEvent) => {
    e?.preventDefault();

    const errandId = task?.id || task?.errand_id;

    console.log("🚀 Starting offer submission process:", {
      errandId,
      isMock: task?.isMock,
      hasValidId: errandId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(errandId),
      offerAmount,
      hasMessage: !!personalMessage
    });

    // Validation checks
    if (task?.isMock) {
      toast.error("This is a demo task. Real tasks will be available soon.");
      return;
    }

    if (!offerAmount) {
      toast.error("Please enter an offer amount");
      return;
    }

    if (!errandId) {
      console.error("❌ No errand ID found in task:", task);
      toast.error("Task ID is missing. Cannot submit offer.");
      return;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(errandId)) {
      console.error("❌ Invalid errand ID format. Expected UUID, got:", errandId);
      toast.error("Invalid task format. Please try refreshing the page.");
      return;
    }

    setIsSubmitting(true);

    try {
      // ✅ SKIP VERIFICATION FOR ALL NON-MOCK TASKS
      console.log("🔄 Skipping verification, proceeding directly to apply endpoint");
      
      const requestBody = {
        offer_amount: offerAmount,
        message: personalMessage,
      };

      const applyUrl = `${API_URL}/errands/${errandId}/apply/`;
      console.log("📤 Applying directly to:", applyUrl);
      
      const response = await authenticatedFetch(applyUrl, {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      console.log("📨 Apply response:", {
        status: response.status,
        ok: response.ok,
        url: applyUrl
      });

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Server returned non-JSON response:', {
          status: response.status,
          statusText: response.statusText,
          contentType,
          responsePreview: text.substring(0, 500)
        });
        
        if (response.status === 500) {
          throw new Error('Server error. Please try again later.');
        } else if (response.status === 404) {
          throw new Error(`Task not found. The task may have been withdrawn.`);
        } else if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        } else {
          throw new Error(`Server error (${response.status}). Please try again.`);
        }
      }

      const result = await response.json();
      
      if (response.ok) {
        // ✅ SUCCESS
        setShowSuccess(true);
        toast.success("Offer submitted successfully!");

        setTimeout(() => {
          setOfferAmount("");
          setPersonalMessage("");
          handleClose();
          if (onClose) {
            onClose({ success: true, errandId });
          }
        }, 1500);

      } else {
        // ✅ HANDLE SPECIFIC ERROR CASES
        console.error('❌ API returned error:', result);
        
        if (response.status === 400) {
          throw new Error(result.detail || result.message || "Invalid offer data. Please check your input.");
        } else if (response.status === 404) {
          throw new Error("This task is no longer available or has been withdrawn.");
        } else if (response.status === 409) {
          throw new Error(result.detail || "You have already applied to this task.");
        } else if (response.status === 403) {
          throw new Error(result.detail || "You don't have permission to apply to this task.");
        } else {
          throw new Error(result.detail || result.message || "Failed to submit offer. Please try again.");
        }
      }

    } catch (error) {
      console.error('❌ Error submitting offer:', error);
      
      if (error instanceof Error) {
        // Don't show toast for "Task not found" as it's already handled above
        if (!error.message.includes("Task not found") && !error.message.includes("no longer available")) {
          toast.error(error.message);
        }
      } else {
        toast.error("Error submitting offer. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Drawer container */}
      <div className="fixed inset-0 z-9990 flex justify-end pointer-events-auto mt-[82px]">
        {/* Backdrop */}
        <div
          onClick={handleClose}
          className={`fixed inset-0 bg-black/25 transition-opacity duration-300 ${animate ? "opacity-100" : "opacity-0"}`}
        />

        {/* Drawer panel */}
        <aside
          aria-modal="true"
          role="dialog"
          className={`
            relative h-full w-full sm:w-[520px] max-w-full bg-white shadow-2xl transform transition-transform duration-300 ease-out
            ${animate ? "translate-x-0" : "translate-x-full"}
            flex flex-col
          `}
        >
          {/* Header */}
          <div className="shrink-0 bg-white px-6 pt-6 pb-4">
            <button
              onClick={handleClose}
              className="absolute right-8 top-6 text-gray-500 hover:text-black z-20"
              aria-label="Close drawer"
            >
              <IoClose size={20} />
            </button>

            {/* User row */}
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
              <Image
                src={task.user?.profile_photo || "/default-avatar.png"}
                alt="User"
                width={40}
                height={40}
                className="rounded-full object-cover bg-gray-100"
              />
              <div>
                <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                  {task.user?.first_name} {task.user?.last_name}
                </h3>
                <p className="text-xs text-gray-500">⭐ 4.8 rating</p>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-base font-semibold text-gray-900 mt-4 mb-4 leading-tight">
              {task.title}
            </h1>

            {/* Summary grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#F7F7FF] rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-2"><CiLocationOn className="w-3 h-3" /> Location</div>
                <div className="text-sm font-medium text-gray-900 truncate">{task.location || "N/A"}</div>
              </div>

              <div className="bg-[#F7F7FF] rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-2"><LiaCoinsSolid className="w-3 h-3" /> Price Range</div>
                <div className="text-sm font-medium text-gray-900">
                  ₦{task.price_min?.toLocaleString() ?? '—'} – ₦{task.price_max?.toLocaleString() ?? '—'}
                </div>
              </div>

              <div className="bg-[#F7F7FF] rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Duration</div>
                <div className="text-sm font-medium">~25 mins</div>
              </div>

              <div className="bg-[#F7F7FF] rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-2"><CiCalendar className="w-3 h-3" /> Deadline</div>
                <div className="text-sm font-medium text-gray-900">{task.deadline ? new Date(task.deadline).toLocaleDateString() : 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Debug Info */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
            <h4 className="font-semibold text-sm mb-2 text-blue-800">Task Info:</h4>
            <div className="text-xs space-y-1">
              <p><strong>Task ID:</strong> {getErrandId()}</p>
              <p><strong>Is Valid UUID:</strong> {/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(getErrandId()) ? 'Yes' : 'No'}</p>
              <p><strong>Task Status:</strong> {task?.status || 'active'}</p>
              <p><strong>Is Mock Task:</strong> {task?.isMock ? 'Yes' : 'No'}</p>
              <p><strong>Verification:</strong> Skipped for real tasks</p>
            </div>
          </div>

          {/* Scrollable content */}
          <div
            ref={contentRef}
            className="flex-1 overflow-y-auto px-6 py-6"
          >
            {/* Description */}
            <section className="space-y-3 mb-6">
              <h3 className="font-semibold text-[15px]">Description</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{task.description || "No description provided."}</p>
            </section>

            {/* Requirements */}
            <section className="mb-6">
              <h3 className="font-semibold text-[15px] mb-3">Task Requirements</h3>
              <div className="space-y-3 border border-[#E5E7EB] bg-[#F9FAFB] p-4 rounded-lg">
                {taskRequirements.map((r, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#424BE0] mt-2 shrink-0" />
                    <p className="text-sm text-gray-700">{r}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Photos */}
            {task.photos?.length > 0 && (
              <section className="mb-6">
                <h3 className="font-semibold text-[15px] mb-3">Attached Photos</h3>
                <div className="grid grid-cols-2 gap-3">
                  {task.photos.map((src: string, idx: number) => (
                    <div key={idx} className="rounded-lg overflow-hidden">
                      <Image
                        src={src || "/placeholder-image.png"}
                        alt={`task-photo-${idx}`}
                        width={200}
                        height={160}
                        className="w-full h-40 object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder-image.png";
                        }}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Offer form */}
            <form onSubmit={handleSubmitOffer} className="space-y-4 mb-6">
              <div>
                <h3 className="font-semibold text-[15px] mb-2">Tasker Offer</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Enter your price between <strong className="text-[#424BE0]">₦{task.price_min?.toLocaleString()}</strong> and <strong className="text-[#424BE0]">₦{task.price_max?.toLocaleString()}</strong>
                </p>

                <div className="border-2 border-[#7CB634]/30 bg-[#FBFFF7] rounded-lg p-3">
                  <label className="text-sm font-medium block mb-2">Offer Price (₦)</label>
                  <input
                    type="number"
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="Enter your offer amount..."
                    className="w-full rounded-lg p-2 bg-[#F3F3F5] border border-black/5 outline-none"
                    required
                    step="0.01"
                    min="0"
                  />
                  <p className="text-xs text-gray-600 mt-2">You will be charged 10% on the agreed amount.</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Personal Message (Optional)</label>
                <textarea
                  value={personalMessage}
                  onChange={(e) => setPersonalMessage(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg p-3 bg-[#F3F3F5] border border-[#E6E6E6] resize-none outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">A personalized message increases your chances of being selected.</p>
              </div>

              {/* Submit area */}
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 bg-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#424BE0] text-white font-semibold disabled:opacity-60"
                  disabled={!offerAmount || isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Offer"}
                </button>
              </div>
            </form>
          </div>
        </aside>
      </div>

      {/* Success modal */}
      <OfferSuccessModal
        open={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          handleClose();
        }}
        taskTitle={task.title}
        clientName={`${task.user?.first_name ?? ''} ${task.user?.last_name ?? ''}`.trim()}
        offerPrice={offerAmount as number}
        deadline={task.deadline}
      />
    </>
  );
}