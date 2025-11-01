"use client";

import { motion } from "framer-motion";
import { Thermometer, X } from "lucide-react";
import type { HelmetData } from "@/types";

interface TempAlertPanelProps {
  helmet: { id: string; data: HelmetData };
  onClose?: () => void;
}

export default function TempAlertPanel({ helmet, onClose }: TempAlertPanelProps) {
  const temp = helmet.data.temperature ?? 0;
  const isHot = temp > 50;
  const isCold = temp < 15;
  const bgColor = isHot
    ? "bg-orange-600 border-orange-700 shadow-orange-500/40"
    : "bg-blue-600 border-blue-700 shadow-blue-500/40";

  return (
    <motion.div
      initial={{ y: "-100%", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: "-100%", opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`fixed top-[4.5rem] left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-lg
                  rounded-lg border-4 ${bgColor} p-5 text-white shadow-2xl`}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <Thermometer className="h-12 w-12 text-yellow-300" />
          </motion.div>
          <div>
            <h2 className="text-2xl font-bold uppercase">
              {isHot ? "High Temperature!" : "Low Temperature!"}
            </h2>
            <p className="text-lg font-semibold text-yellow-200">
              Helmet ID: {helmet.id}
            </p>
            <p className="mt-1 text-sm">
              Current:{" "}
              <span className="font-semibold">{temp.toFixed(1)} °C</span>
            </p>
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
