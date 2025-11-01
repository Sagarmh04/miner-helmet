"use client";

import { motion } from "framer-motion";
import { WifiOff, X } from "lucide-react";
import type { HelmetData } from "@/types";

interface OfflineAlertPanelProps {
  helmet: { id: string; data: HelmetData };
  onClose?: () => void;
}

export default function OfflineAlertPanel({ helmet, onClose }: OfflineAlertPanelProps) {
  return (
    <motion.div
      initial={{ y: "-100%", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: "-100%", opacity: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 25 }}
      className="fixed top-[4.5rem] left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-lg
                 rounded-xl border border-gray-600/70 bg-gradient-to-br from-gray-900/95 to-gray-800/90 
                 backdrop-blur-md p-5 text-white shadow-2xl shadow-black/30"
    >
      <div className="flex justify-between items-start">
        {/* Icon + Info */}
        <div className="flex items-center gap-4">
          <motion.div
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <WifiOff className="h-12 w-12 text-gray-300" />
          </motion.div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-gray-100 uppercase tracking-wide">
              Device Offline
            </h2>
            <p className="text-base font-semibold text-gray-300">
              Helmet ID: <span className="text-white">{helmet.id}</span>
            </p>
            <p className="text-sm text-gray-400">
              Last update:{" "}
              {helmet.data.timestamp
                ? new Date(helmet.data.timestamp).toLocaleTimeString()
                : "Unknown"}
            </p>
          </div>
        </div>

        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white transition-colors ml-3"
            aria-label="Close offline alert"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Footer Indicator */}
      <motion.div
        className="mt-4 flex justify-center"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <p className="text-sm text-gray-400 italic">
          Helmet connection lost. Awaiting next data update...
        </p>
      </motion.div>
    </motion.div>
  );
}
