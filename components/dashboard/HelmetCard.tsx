"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { HelmetData } from "@/types";
import {
  ShieldAlert,
  Thermometer,
  MapPin,
  Clock,
  Wifi,
  WifiOff,
  Loader2,
  Map,
  ExternalLink,
} from "lucide-react";

interface HelmetCardProps {
  helmetId: string;
  data: HelmetData | undefined;
  onReset: (id: string, currentData: HelmetData) => Promise<void>;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.9 },
};

export default function HelmetCard({ helmetId, data, onReset }: HelmetCardProps) {
  const [isResetting, setIsResetting] = useState(false);

  if (!data) {
    return (
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        layout
        className="h-64 rounded-lg surface-card p-5 flex flex-col justify-between hover-raise"
      >
        <h3 className="text-lg font-bold truncate">{helmetId}</h3>
        <div className="flex flex-col items-center justify-center h-full">
          <WifiOff className="h-10 w-10 text-muted-foreground" />
          <span className="mt-2 text-muted-foreground">No data</span>
        </div>
      </motion.div>
    );
  }

  const { temperature, latitude, longitude, timestamp, emergency } = data;

  const getStatus = () => {
    const now = Date.now();
    const lastUpdate = new Date(timestamp).getTime();
    const diffMinutes = (now - lastUpdate) / 60000;

    if (emergency)
      return {
        icon: <ShieldAlert className="h-5 w-5 text-red-500" />,
        text: "EMERGENCY",
        color: "text-red-500",
        pulse: "animate-pulse",
      };

    if (diffMinutes > 2)
      return {
        icon: <WifiOff className="h-5 w-5 text-gray-400" />,
        text: "Inactive",
        color: "text-gray-400",
        pulse: "",
      };

    return {
      icon: <Wifi className="h-5 w-5 text-green-500" />,
      text: "Active",
      color: "text-green-500",
      pulse: "",
    };
  };

  const status = getStatus();

  const formatTimestamp = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleTimeString();
    } catch {
      return "Invalid date";
    }
  };

  const handleResetClick = async () => {
    if (!data) return;
    setIsResetting(true);
    try {
      await onReset(helmetId, data);
    } catch (err) {
      console.error("Reset failed:", err);
    } finally {
      setIsResetting(false);
    }
  };

  const handleOpenInMaps = () => {
    if (!latitude || !longitude) return;
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
      className={cn(
        "rounded-lg surface-card p-5 flex flex-col justify-between hover-raise shadow-md transition-all",
        emergency && "ring-2 ring-red-500/80 shadow-red-500/20"
      )}
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold truncate text-foreground">
            {helmetId}
          </h3>
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
              status.color,
              status.pulse
            )}
          >
            {status.icon}
            <span>{status.text}</span>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-3">
          <InfoRow
            icon={<Thermometer className="h-4 w-4 text-brand-royal-blue" />}
            label="Temperature"
            value={`${temperature?.toFixed(1) ?? "N/A"} °C`}
          />
          <InfoRow
            icon={<MapPin className="h-4 w-4 text-brand-royal-violet" />}
            label="Location"
            value={`${latitude?.toFixed(4) ?? "N/A"}, ${
              longitude?.toFixed(4) ?? "N/A"
            }`}
          />
          <InfoRow
            icon={<Clock className="h-4 w-4 text-muted-foreground" />}
            label="Last Update"
            value={formatTimestamp(timestamp)}
          />
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="flex flex-col gap-2 mt-4">
        {/* View on Map */}
        <button
          onClick={handleOpenInMaps}
          disabled={!latitude || !longitude}
          className="w-full rounded-md bg-blue-600/90 hover:bg-blue-600 text-white text-sm font-semibold py-2 flex items-center justify-center gap-2 transition-colors focus-ring disabled:opacity-50"
        >
          <Map className="h-4 w-4" />
          <span>View on Map</span>
          <ExternalLink className="h-3 w-3 opacity-80" />
        </button>

        {/* Reset Emergency */}
        <AnimatePresence>
          {emergency && (
            <motion.button
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onClick={handleResetClick}
              disabled={isResetting}
              className={cn(
                "w-full rounded-md px-4 py-2 text-sm font-semibold text-white transition-colors focus-ring",
                isResetting
                  ? "bg-red-400 cursor-wait"
                  : "bg-red-600/90 hover:bg-red-600"
              )}
            >
              {isResetting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Resetting...
                </span>
              ) : (
                "Reset Emergency"
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
