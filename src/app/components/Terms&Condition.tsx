"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { TokenManager } from "../utils/tokenUtils";

interface TermsModalProps {
  userId: string;
  onAgree: () => void;
}

export default function TermsModal({ userId, onAgree }: TermsModalProps) {
  const [open, setOpen] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user already accepted terms (from localStorage)
    const hasAgreed = localStorage.getItem("termsAccepted");
    const isNewUser = localStorage.getItem("isNewUser")
    if (hasAgreed === "true" && isNewUser !== "true") {
      setOpen(false);
    } else {
      setOpen(true)
    }
  }, []);

  const API_URL = process.env.NEXT_PUBLIC_API_URL

  const handleAgree = async () => {
    try {
      const token = TokenManager.getAccessToken()

      if (!token) {
        console.error("No authentication token found")
        throw new Error("Authentication required")
      }

      const response = await fetch(`${API_URL}/users/${userId}/terms/`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          userId,
          terms_accepted: true,
          terms_version: "1.0",
          accepted_at: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to accept terms");
      }

      // Save locally to prevent popup next time
      localStorage.setItem("termsAccepted", "true");
      localStorage.removeItem("isNewUser"); // Clear the new user flag

      // Close modal & notify parent
      setOpen(false);
      onAgree();
    } catch (error) {
      console.error("Failed to log acceptance:", error);
    } finally {
      setLoading(false)
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/30">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/80 to-gray-100/70 dark:from-gray-900/80 dark:to-gray-800/80 shadow-2xl backdrop-blur-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-black text-center dark:text-gray-100">
              Terms & Conditions
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              You must read and agree to the terms and conditions in order to proceed.
            </p>
            <p className="text-xs text-gray-600 mt-1">Last updated: 12th October 2025</p>
          </DialogHeader>

          <ScrollArea className="h-[55vh] pr-4 mt-3 text-gray-800">
            <div className="space-y-5 text-sm leading-relaxed">

              {/* --- Terms & Conditions --- */}
              <h3 className="font-bold text-base">1. Terms & Conditions</h3>
              <p>
                By using Errand Tribe, you agree to:
              </p>
              <ul className="list-disc ml-5">
                <li>Our Terms & Conditions (rules governing platform use, payments, and responsibilities).</li>
                <li>Our Privacy Policy (how we handle your data).</li>
                <li>Our Service Agreement (clarifying the responsibilities between Clients and Runners).</li>
              </ul>

              <p className="font-bold mt-2">Eligibility</p>
              <ul className="list-disc ml-5">
                <li>You must be at least 18 years old.</li>
                <li>You must have the legal capacity to enter into a binding agreement.</li>
                <li>You must provide accurate and up-to-date registration information.</li>
              </ul>

              <p className="font-bold mt-2">User Roles</p>
              <ul className="list-disc ml-5">
                <li>Taskers: Individuals or organizations who post errands, tasks, or requests for completion.</li>
                <li>Runners: Individuals who accept and perform errands in exchange for payment.</li>
              </ul>

              <p className="font-bold mt-2">Posting and Accepting Tasks</p>
              <ul className="list-disc ml-5">
                <li>Taskers are responsible for providing clear descriptions, fair compensation, and accurate deadlines.</li>
                <li>Runners must carefully review and accept each task before starting.</li>
                <li>Once accepted, both parties enter a binding agreement to complete the task as described.</li>
              </ul>

              {/* --- Privacy Policy --- */}
              <h3 className="font-bold text-base mt-6">2. Privacy Policy</h3>
              <p>Last Updated: 5th October 2025</p>
              <p>
                Errand Tribe respects your privacy. This Privacy Policy explains how we
                collect, use, and protect your personal data when you use our website, mobile app, and services.
              </p>

              <p className="font-bold mt-2">Information We Collect</p>
              <ul className="list-disc ml-5">
                <li>Identity information: name, phone number, email, government-issued ID.</li>
                <li>Verification data: photos, video verification, or KYC documentation.</li>
                <li>Transaction data: tasks posted, payment history, wallet balance, and ratings.</li>
                <li>Device and usage data: IP address, app version, device type, and logs.</li>
                <li>Location data: real-time location (for runners) and task coordinates (for clients).</li>
              </ul>

              <p className="font-bold mt-2">How We Use Your Information</p>
              <ul className="list-disc ml-5">
                <li>Create and manage your account.</li>
                <li>Facilitate task posting, matching, and payments.</li>
                <li>Verify identities and prevent fraud.</li>
                <li>Improve service performance and personalization.</li>
                <li>Send important notifications (task updates, verification, payment alerts).</li>
              </ul>

              <p className="font-bold mt-2">Data Sharing</p>
              <p>
                We only share your data with trusted third parties such as:
                <ul className="list-disc ml-5">
                    <li><strong>Payment and Escrow partners</strong> (e.g Paystack, Flutterwave)</li>
                    <li><strong>PaymentIdentity verification partners</strong> (e.g YouVerify, Smile Identity)</li>
                    <li><strong>Law enforcement</strong>, when required by law</li>
                </ul>
                <p className="mt-2 mb-4">We do <strong>not sell</strong> your personal data</p>
                <p className="mb-2"><strong>Data Retention</strong></p>
                <p className="mb-4"> We retain your data as long as your account remains active or as required by law.  You can request deletion anytime by contacting ettribe.errand@gmail.com
                </p>
                <p><strong>Data Security</strong></p>
                <p className="mb-6">
                    We use encryption (SSL/TLS), tokenization, and secure APIs to protect your information. Sensitive data like IDs and bank details are stored securely using industry-standard encryption.
                </p>
                <p className="mb-2"><strong>Your Rights</strong></p>
                <p>Under NDPA and GDPR principles, you have rights to:</p>
                <ul className="list-disc ml-5">
                    <li>Access and correct your data</li>
                    <li>Request deletion or restriction of processing</li>
                    <li>Withdraw consent.</li>
                    <li>File a complaint with Nigeria's Data Protection Commission (NDPC).</li>
                </ul>
                <p className="mt-4 mb-2"><strong>Cookies & Tracking</strong></p>
                <p>We use cookies to enhance your experience, store preferences, and analyze platform performance.</p>
                <p>You may disable cookies in your browser settings, but some features may not function properly.</p>

                <p className="mt-4 mb-2"><strong>Updates</strong></p>
                <p>We may update this Privacy Policy periodically. We will notify you of significant changes via email or platform notifications.</p>
                <p><strong>Contact:</strong>ettribe.errand@gmail.com</p>
            </p>

              {/* --- Service Agreement --- */}
              <h3 className="font-bold text-base mt-6">3. Client ↔ Tasker Service Agreement</h3>
              <p>Last Updated: 5th October 2025</p>
              <p>
                This Agreement governs the relationship between Clients <strong>(Task Posters)</strong> and Taskers <strong>(Runners)</strong>
                who connect via the Errand Tribe platform.
              </p>
              <p>By accepting this Agreement, both parties agree to act in good faith and comply with the following conditions.</p>

              <p className="font-bold mt-2">Relationship</p>
              <ul className="list-disc ml-5">
                <li>Both parties act as independent contractors.</li>
                <li>Errand Tribe is not an employer, agent, or insurer of either party.</li>
                <li>The Client engages the Tasker voluntarily through the Platform.</li>
              </ul>

              <p className="font-bold mt-2">Payment & Escrow</p>
              <ul className="list-disc ml-5">
                <li>The Client pays into the <strong>escrow wallet</strong> before a Task begins.</li>
                <li>Runners perform the Task as described and get paid after Client confirmation.</li>
                <li>Upon completion, the Client confirms the Task, and payment is released automatically.</li>
                <li>If no response within 48 hours after completion from the tasker, funds may auto-release.</li>
              </ul>

              <p className="font-bold mt-2">Disputes</p>
              <p>If a dispute arises:</p>
              <ul className="list-disc ml-5">
                <li>Both parties must communicate first via in-app chat.</li>
                <li>If unresolved, Errand Tribe Support will review submitted proofs and decide accordingly.</li>
                <li>Decisions will be based on available evidence (photos, receipts, communication logs).</li>
                <li>Errand Tribe's resolution is <strong>binding</strong>, subject to further escalation under Nigerian law.</li>
              </ul>
              <p className="font-bold mt-2">Task Quality and Conduct</p>
              <ul className="list-disc ml-5">
                <li>Taskers must perform tasks safely, professionally, and in accordance with the description.</li>
                <li>Clients must provide accurate instructions and avoid unreasonable demands..</li>
                <li>Neither party may use abusive language or harass the other.</li>
              </ul>

              <p className="font-bold mt-2">Liability</p>
              <p>Errand Tribe:</p>
              <ul className="list-disc ml-5">
                <li>Is not responsible for personal injury, property loss, or negligence by any user.</li>
                <li>Provides insurance options or emergency protocols only where available (coming feature)</li>
                <li>Liability is limited to the transaction amount held in escrow.</li>
              </ul>
              <p className="font-bold mt-2">Cancellation</p>
              <ul className="list-disc ml-5">
                <li>Clients may cancel tasks <strong>before</strong> a Tasker accepts it (full refund).</li>
                <li>Once a Tasker accepts, cancellations may incur a partial fee.</li>
                <li>Cancellations during execution will be reviewed individually by Support.</li>
              </ul>
              
              <p className="font-bold mt-2">Confidentiality</p>
              <p>
                Both parties agree not to share or misuse any private information obtained during a task  (e.g., addresses, photos, or contact numbers).
              </p>
              <p className="font-bold mt-2">Ratings & Feedback</p>
              <p>
                Each party agrees to leave honest feedback after task completion.  Fraudulent reviews or rating manipulation are prohibited.
              </p>
              <p className="font-bold mt-2">Governing Law</p>
              <p>
                This Agreement is governed by the <strong>laws of the Federal Republic of Nigeria</strong>, with jurisdiction in <strong>Lagos State.</strong>
              </p>
              <p className="font-bold mt-2">Acknowledgment</p>
              <p>
                By clicking “I Agree”, you acknowledge that you have read, understood, and accepted these
                terms, our Privacy Policy, and the Service Agreement.
              </p>
            </div>
          </ScrollArea>

          <div className="flex items-center justify-between mt-5">
            <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="cursor-pointer accent-blue-600 w-5 h-5"
              />
              <span>I have read and agree to all Terms & Conditions.</span>
            </label>

            <Button
              onClick={handleAgree}
              disabled={!agreed || loading}
              className={`${
                agreed && !loading
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                  : "bg-gray-400 cursor-not-allowed"
              } transition-all`}
            >
              {loading ? "Processing..." : "I Agree"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
