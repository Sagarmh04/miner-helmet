"use client";
import { useState } from "react";
import { db, firestore } from "@/lib/firebase";
import { ref, get, remove } from "firebase/database";
import { collection, addDoc } from "firebase/firestore";
import { format } from "date-fns";

interface HistoryPoint {
  lat: number;
  lng: number;
  temp: number;
  emergency: boolean;
  active?: boolean;
  ts: string;
  date: string;
  hour: string;
}

export function useDataBridge() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncCount, setSyncCount] = useState(0);

  const syncHistoryData = async (helmetId: string) => {
    if (!helmetId) return;
    setIsLoading(true);
    setError(null);
    setSyncCount(0);

    try {
      const historyRef = ref(db, `helmets/${helmetId}/history`);
      const snapshot = await get(historyRef);
      if (!snapshot.exists()) {
        setError("No history data in RTDB.");
        setIsLoading(false);
        return;
      }

      const history = snapshot.val();
      const entries = Object.entries(history) as [string, any][];
      let count = 0;

      for (const [, data] of entries) {
        if (!data?.timestamp) continue;
        const ts = new Date(data.timestamp);
        const dateStr = format(ts, "yyyy-MM-dd");
        const hourStr = format(ts, "HH");

        const docData: HistoryPoint = {
          ts: data.timestamp,
          date: dateStr,
          hour: hourStr,
          lat: data.latitude ?? 0,
          lng: data.longitude ?? 0,
          temp: data.temperature ?? 0,
          emergency: data.emergency ?? false,
          active: data.active ?? true,
        };

        await addDoc(collection(firestore, `helmets/${helmetId}/points`), docData);
        count++;
      }

      await remove(historyRef);
      setSyncCount(count);
    } catch (err: any) {
      console.error("Sync error:", err);
      setError(err.message || "Firestore write failed");
    } finally {
      setIsLoading(false);
    }
  };

  return { syncHistoryData, isLoading, error, syncCount };
}
