"use client";

import { useState, useEffect } from "react";
import { Map, Marker, Overlay, ZoomControl } from "pigeon-maps";
import { ref, onValue } from "firebase/database";
import { db, firestore } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { format } from "date-fns";
import { Thermometer, Clock } from "lucide-react";

interface HelmetCurrent {
  latitude: number;
  longitude: number;
  active: boolean;
  emergency: boolean;
  temperature?: number;
  timestamp: string;
}

interface HelmetData {
  id: string;
  current: HelmetCurrent;
}

interface HistoryPoint {
  lat: number;
  lng: number;
  temp?: number;
  emergency?: boolean;
  ts: string;
  date: string;
  hour: string;
  active?: boolean;
}

export default function MapView() {
  const [helmets, setHelmets] = useState<HelmetData[]>([]);
  const [mode, setMode] = useState<"live" | "history">("live");
  const [selectedHelmet, setSelectedHelmet] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [selectedHour, setSelectedHour] = useState<string>("");
  const [historyPoints, setHistoryPoints] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Fetch live helmets from RTDB ---
  useEffect(() => {
    const helmetsRef = ref(db, "helmets");
    const unsub = onValue(helmetsRef, (snapshot) => {
      const val = snapshot.val();
      if (!val) {
        setHelmets([]);
        setLoading(false);
        return;
      }
      const arr: HelmetData[] = Object.entries(val).map(
        ([key, data]: [string, any]) => ({
          id: key,
          current: data.current,
        })
      );
      setHelmets(arr);
      if (!selectedHelmet && arr.length > 0) setSelectedHelmet(arr[0].id);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // --- Fetch history from Firestore ---
  const fetchHistory = async (
    helmetId: string,
    date: string,
    hour?: string
  ) => {
    if (!helmetId || !date) return;
    setLoading(true);

    try {
      let qRef = query(
        collection(firestore, `helmets/${helmetId}/points`),
        where("date", "==", date),
        orderBy("ts", "asc")
      );

      if (hour) {
        qRef = query(
          collection(firestore, `helmets/${helmetId}/points`),
          where("date", "==", date),
          where("hour", "==", hour),
          orderBy("ts", "asc")
        );
      }

      const snap = await getDocs(qRef);
      const pts = snap.docs.map((d) => d.data() as HistoryPoint);
      setHistoryPoints(pts);
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mode === "history" && selectedHelmet) {
      fetchHistory(selectedHelmet, selectedDate, selectedHour || undefined);
    }
  }, [mode, selectedHelmet, selectedDate, selectedHour]);

  // --- Helper: compute status ---
  const computeStatus = (c: HelmetCurrent) => {
    if (!c?.timestamp) return { label: "Unknown", color: "gray" };
    const diffMs = Date.now() - new Date(c.timestamp).getTime();
    const diffMin = diffMs / 60000;
    if (c.emergency) return { label: "EMERGENCY", color: "red" };
    if (diffMin > 5) return { label: "Inactive", color: "gray" };
    return { label: "Active", color: "green" };
  };

  const center =
    helmets.length > 0
      ? [
          helmets[0].current.latitude || 15.4261,
          helmets[0].current.longitude || 75.6471,
        ]
      : [15.4261, 75.6471];

  // --- Hours list for selection ---
  const hours = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, "0")
  );

  return (
    <div className="relative w-full h-[calc(100vh-4rem)]">
      {/* --- Control Bar --- */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-background/80 backdrop-blur-lg px-4 py-2 rounded-lg shadow-lg flex flex-wrap items-center gap-3">
        <button
          className={`px-3 py-1 rounded-md font-semibold ${
            mode === "live"
              ? "bg-primary text-white"
              : "bg-muted text-foreground"
          }`}
          onClick={() => setMode("live")}
        >
          Live
        </button>

        <button
          className={`px-3 py-1 rounded-md font-semibold ${
            mode === "history"
              ? "bg-primary text-white"
              : "bg-muted text-foreground"
          }`}
          onClick={() => {
            setMode("history");
            setSelectedDate(format(new Date(), "yyyy-MM-dd"));
            setSelectedHour("");
          }}
        >
          History
        </button>

        {mode === "history" && (
          <>
            <select
              className="px-2 py-1 rounded-md border border-input bg-background text-sm"
              value={selectedHelmet}
              onChange={(e) => setSelectedHelmet(e.target.value)}
            >
              {helmets.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.id}
                </option>
              ))}
            </select>

            <input
              type="date"
              className="px-2 py-1 rounded-md border border-input bg-background text-sm"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />


          </>
        )}
      </div>

      {/* --- Map Area --- */}
      {loading ? (
        <div className="flex items-center justify-center w-full h-full">
          <p className="text-muted-foreground text-sm animate-pulse">
            Loading map data...
          </p>
        </div>
      ) : (
        <Map
          defaultCenter={center as [number, number]}
          defaultZoom={13}
          boxClassname="w-full h-full"
        >
          <ZoomControl />

          {/* --- Live Mode --- */}
          {mode === "live" &&
            helmets.map((helmet) => {
              const c = helmet.current;
              if (!c || !c.latitude || !c.longitude) return null;
              const { label, color } = computeStatus(c);
              const lastUpdate = new Date(c.timestamp).toLocaleTimeString();

              return (
                <Overlay key={helmet.id} anchor={[c.latitude, c.longitude]}>
                  <div
                    className={`rounded-full w-5 h-5 border-2 border-white shadow-lg cursor-pointer`}
                    style={{ backgroundColor: color }}
                    title={`${helmet.id}\n${label}\nLast updated ${lastUpdate}`}
                    onClick={() =>
                      window.open(
                        `https://www.google.com/maps?q=${c.latitude},${c.longitude}`,
                        "_blank"
                      )
                    }
                  />
                </Overlay>
              );
            })}

          {/* --- History Mode --- */}
          {mode === "history" &&
            historyPoints.map((p, i) => (
              <Overlay key={i} anchor={[p.lat, p.lng]}>
                <div
                  className={`rounded-full w-4 h-4 cursor-pointer border border-white shadow-md ${
                    p.emergency ? "bg-red-500" : "bg-blue-500"
                  }`}
                  title={`Time: ${new Date(p.ts).toLocaleTimeString()}\nTemp: ${
                    p.temp ?? "-"
                  }°C`}
                  onClick={() =>
                    window.open(
                      `https://www.google.com/maps?q=${p.lat},${p.lng}`,
                      "_blank"
                    )
                  }
                />
              </Overlay>
            ))}
        </Map>
      )}
    </div>
  );
}
