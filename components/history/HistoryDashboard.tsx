"use client";

import { useState, useEffect } from "react";
import { db, firestore } from "@/lib/firebase";
import { ref, get } from "firebase/database";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { format as formatDate } from "date-fns";
import { useDataBridge } from "@/hooks/useDataBridge";
import type { HistoryPoint } from "@/types";
import { AnimatePresence, motion } from "framer-motion";


// Shadcn UI components
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, CheckCircle } from "lucide-react";
import { DatePicker } from "../ui/DatePicker";

export default function HistoryDashboard() {
  const [helmetsList, setHelmetsList] = useState<string[]>([]);
  const [selectedHelmet, setSelectedHelmet] = useState<string>("");
const [selectedDate, setSelectedDate] = useState<Date>(new Date());  
  const [historyData, setHistoryData] = useState<HistoryPoint[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Our custom hook for syncing data
  const { syncHistoryData, isLoading: isSyncing, error: syncError, syncCount } = useDataBridge();

  // 1. Fetch the list of all available helmets on mount
  useEffect(() => {
    const helmetsRef = ref(db, "helmets");
    get(helmetsRef).then((snapshot) => {
      if (snapshot.exists()) {
        const ids = Object.keys(snapshot.val());
        setHelmetsList(ids);
        if (ids.length > 0) {
          setSelectedHelmet(ids[0]);
        }
      }
    });
  }, []);

  // 2. Fetch data from FIRESTORE for display
  const fetchDisplayData = async () => {
    if (!selectedHelmet || !selectedDate) return;

    setIsLoadingData(true);
    setHistoryData([]);
    
    const dateStr = formatDate(selectedDate, "yyyy-MM-dd");
    let points: HistoryPoint[] = [];

    try {
      for (let hour = 0; hour < 24; hour++) {
        const hourStr = hour.toString().padStart(2, "0");
        const pointsPath = `helmets/${selectedHelmet}/days/${dateStr}/hours/${hourStr}/points`;
        const q = query(collection(firestore, pointsPath), orderBy("ts", "asc"));
        
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          points.push(doc.data() as HistoryPoint);
        });
      }
      setHistoryData(points);
    } catch (e) {
      console.error("Error fetching display data:", e);
    } finally {
      setIsLoadingData(false);
    }
  };

  // 3. Re-fetch data when selectors change
  useEffect(() => {
    fetchDisplayData();
  }, [selectedHelmet, selectedDate]);

  // 4. Handle the manual sync button click
  const handleSync = async () => {
    await syncHistoryData(selectedHelmet);
  };

  return (
    <div className="space-y-6">
      {/* --- Control Bar --- */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center gap-4 rounded-lg surface-card p-4 shadow"
      >
        <h2 className="text-xl font-semibold text-foreground">History & Logs</h2>
        <div className="flex-grow" />
        
        {/* Helmet Selector */}
        <Select value={selectedHelmet} onValueChange={setSelectedHelmet}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Helmet" />
          </SelectTrigger>
          <SelectContent>
            {helmetsList.map(id => (
              <SelectItem key={id} value={id}>{id}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date Picker */}
        <DatePicker date={selectedDate} setDate={setSelectedDate} />

        {/* Sync Button */}
        <Button onClick={handleSync} disabled={isSyncing || !selectedHelmet}>
          {isSyncing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          {isSyncing ? "Syncing..." : "Sync RTDB"}
        </Button>
      </motion.div>
      
      {/* --- Sync Status --- */}
      <AnimatePresence>
        {syncCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 rounded-md bg-green-500/10 p-3 text-sm text-green-400"
          >
            <CheckCircle className="h-4 w-4" />
            Successfully synced {syncCount} data points from Realtime Database.
          </motion.div>
        )}
        {syncError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-md bg-red-500/10 p-3 text-sm text-red-400"
          >
            <strong>Sync Failed:</strong> {syncError}
          </motion.div>
        )}
      </AnimatePresence>


    </div>
  );
}