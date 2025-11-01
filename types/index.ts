// This interface defines the data structure coming from /helmets/{id}/current
export interface HelmetData {
  latitude: number;
  longitude: number;
  temperature: number;
  emergency: boolean;
  active: boolean;
  timestamp: string; // ISO 8601 timestamp
}

// This represents the entire object at the /helmets root in RTDB
export interface HelmetMap {
  [helmetId: string]: {
    current: HelmetData;
    // We'll also account for commands, even if we don't read it here
    commands?: {
      reset?: boolean;
      emergency?: boolean;
    };
    // The history node is also present, but handled by a different page
    history?: any; 
  };
}


// Realtime Database structure
export type HelmetCurrent = {
  latitude: number;
  longitude: number;
  temperature: number;
  emergency: boolean;
  active: boolean;
  timestamp: string; // ISO string
};

export type HistoryEntry = {
  latitude: number;
  longitude: number;
  temperature: number;
  emergency: boolean;
  timestamp: string; // ISO string
};

// Firestore-compatible structure (used later)
export type HistoryPoint = {
  lat: number;
  lng: number;
  temp: number;
  ts: string;
  emergency: boolean;
};
export interface DayMetadata {
  avgTemp: number;
  emergencies: number;
  totalPoints: number;
  activeHours: number;
}
export interface SummaryData {
  lastActive: string;
  availableDays: string[];
  avgTemperature: number;
  emergencyCount: number;
  totalActiveHours?: number; // Optional
}
