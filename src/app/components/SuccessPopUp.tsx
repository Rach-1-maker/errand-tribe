// components/SuccessPopup.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle } from "lucide-react";

interface SuccessPopupProps {
  show: boolean;
  message?: string;
}

export default function SuccessPopup({ show, message }: SuccessPopupProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-2xl p-12 flex flex-col items-center justify-center shadow-2xl w-[90%] max-w-md"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CheckCircle className="text-green-500 w-16 h-16 mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {message || "Signup Completed Successfully!"}
            </h2>
            <p className="text-gray-500 text-center text-sm">
              Redirecting to your dashboard...
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
