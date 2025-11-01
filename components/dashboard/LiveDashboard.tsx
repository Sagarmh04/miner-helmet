"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { ref, onValue, set, get } from "firebase/database";
import type { HelmetMap, HelmetData } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import HelmetCard from "./HelmetCard";
import AlertPanel from "./AlertPanel";
import TempAlertPanel from "./TempAlertPanel";
import OfflineAlertPanel from "./OfflineAlertPanel";

export default function LiveDashboard() {
  const [helmets, setHelmets] = useState<HelmetMap | null>(null);
  const [loading, setLoading] = useState(true);

  const [emergencyAlert, setEmergencyAlert] = useState<{ id: string; data: HelmetData } | null>(null);
  const [tempAlert, setTempAlert] = useState<{ id: string; data: HelmetData } | null>(null);
  const [offlineAlert, setOfflineAlert] = useState<{ id: string; data: HelmetData } | null>(null);

  const previousOnlineState = useRef<Record<string, boolean>>({});
  const hasLoadedOnce = useRef(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Preload alert sound
  useEffect(() => {
    const audio = new Audio("/sounds/emergency_alert.mp3");
    audio.loop = true;
    audio.preload = "auto";
    audioRef.current = audio;
  }, []);

  // --- Realtime Listener ---
  useEffect(() => {
    const helmetsRef = ref(db, "helmets");

    const unsubscribe = onValue(helmetsRef, async (snapshot) => {
      const rawData: HelmetMap | null = snapshot.val();
      if (!rawData) {
        setHelmets(null);
        setEmergencyAlert(null);
        setTempAlert(null);
        setOfflineAlert(null);
        setLoading(false);
        return;
      }

      // Merge `commands.emergency` into `current` for display consistency
      const mergedData: HelmetMap = {};
      for (const [id, helmet] of Object.entries(rawData)) {
        const current = helmet.current ?? {};
        const emergencyFlag = helmet.commands?.emergency ?? false;
        mergedData[id] = {
          ...helmet,
          current: { ...current, emergency: emergencyFlag },
        };
      }

      setHelmets(mergedData);
      setLoading(false);

      const entries = Object.entries(mergedData);
      const now = Date.now();

      // --- Emergency Alert ---
      const emergency = entries.find(([_, h]) => h.current?.emergency);
      if (emergency) {
        const [id, h] = emergency;
        setEmergencyAlert({ id, data: h.current });
        audioRef.current?.play().catch(() => {});
      } else {
        setEmergencyAlert(null);
        audioRef.current?.pause();
        if (audioRef.current) audioRef.current.currentTime = 0;
      }

      // --- Temperature Alerts ---
      const tempCritical = entries.find(([_, h]) => {
        const t = h.current?.temperature;
        return t && (t > 50 || t < 15);
      });
      setTempAlert(tempCritical ? { id: tempCritical[0], data: tempCritical[1].current } : null);

      // --- Initialize Online States ---
      if (!hasLoadedOnce.current) {
        for (const [id, helmet] of entries) {
          const ts = helmet.current?.timestamp;
          if (!ts) continue;
          const diff = (now - new Date(ts).getTime()) / 60000;
          previousOnlineState.current[id] = diff <= 2;
        }
        hasLoadedOnce.current = true;
      }
    });

    return () => {
      unsubscribe();
      audioRef.current?.pause();
    };
  }, []);

  // --- Continuous Offline Monitoring ---
  useEffect(() => {
    const interval = setInterval(() => {
      if (!helmets) return;
      const now = Date.now();

      for (const [id, helmet] of Object.entries(helmets)) {
        const ts = helmet.current?.timestamp;
        if (!ts) continue;
        const diff = (now - new Date(ts).getTime()) / 60000;
        const isOffline = diff > 2 && !helmet.current?.emergency;
        const wasOnline = previousOnlineState.current[id] ?? true;

        if (isOffline && wasOnline) {
          setOfflineAlert({ id, data: helmet.current });
        }

        previousOnlineState.current[id] = !isOffline;
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [helmets]);

  // --- Reset Handler ---
  const handleResetEmergency = async (helmetId: string, currentData: HelmetData) => {
    try {
      const basePath = `helmets/${helmetId}`;
      const commandsPath = `${basePath}/commands`;

      // Step 1: Overwrite current data (for instant UI toggle)
      const updatedCurrent = { ...currentData, emergency: false };
      await set(ref(db, `${basePath}/current`), updatedCurrent);

      // Step 2: Set commands/emergency=false
      await set(ref(db, `${commandsPath}/emergency`), false);

      // Step 3: Set commands/reset=true
      await set(ref(db, `${commandsPath}/reset`), true);

      console.log(`[RESET] Emergency reset for ${helmetId}`);
    } catch (error) {
      console.error("Reset failed:", error);
    }
  };

  if (loading) return <DashboardLoadingSkeleton />;

  if (!helmets || Object.keys(helmets).length === 0)
    return (
      <div className="flex h-64 items-center justify-center rounded-lg surface-card">
        <h2 className="text-xl text-muted-foreground">
          Waiting for helmet data...
        </h2>
      </div>
    );

  return (
    <div className="relative">
      <AnimatePresence>
        {emergencyAlert && (
          <AlertPanel
            helmet={emergencyAlert}
            onClose={() => setEmergencyAlert(null)}
          />
        )}
        {!emergencyAlert && tempAlert && (
          <TempAlertPanel
            helmet={tempAlert}
            onClose={() => setTempAlert(null)}
          />
        )}
        {!emergencyAlert && !tempAlert && offlineAlert && (
          <OfflineAlertPanel
            helmet={offlineAlert}
            onClose={() => setOfflineAlert(null)}
          />
        )}
      </AnimatePresence>

      <motion.div
        layout
        className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {Object.entries(helmets).map(([id, helmet]) => (
          <HelmetCard
            key={id}
            helmetId={id}
            data={helmet.current}
            onReset={handleResetEmergency}
          />
        ))}
      </motion.div>
    </div>
  );
}

function DashboardLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-64 animate-pulse rounded-lg surface-card p-5" />
      ))}
    </div>
  );
}
