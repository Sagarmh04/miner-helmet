"use client";

import { motion } from "framer-motion";
import { AlertTriangle, MapPin, Thermometer, X } from "lucide-react";
import type { HelmetData } from "@/types";

interface AlertPanelProps {
  helmet: { id: string; data: HelmetData };
  onClose?: () => void;
}

export default function AlertPanel({ helmet, onClose }: AlertPanelProps) {
  return (
    <motion.div
      initial={{ y: "-100%", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: "-100%", opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed top-[4.5rem] left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-lg
                 rounded-lg border-4 border-red-700 bg-red-600 p-5
                 text-white shadow-2xl shadow-red-500/30"
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
          >
            <AlertTriangle className="h-12 w-12 text-yellow-300" />
          </motion.div>
          <div>
            <h2 className="text-2xl font-bold uppercase">Emergency Alert!</h2>
            <p className="text-lg font-semibold text-yellow-200">
              Helmet ID: {helmet.id}
            </p>
            <div className="mt-2 flex gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Thermometer className="h-4 w-4" />
                <span>{helmet.data.temperature?.toFixed(1) ?? "N/A"} °C</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>
                  {helmet.data.latitude?.toFixed(4)},{" "}
                  {helmet.data.longitude?.toFixed(4)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors ml-4"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
