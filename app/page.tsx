import LiveDashboard from "@/components/dashboard/LiveDashboard";
import HistoryDashboard from "@/components/history/HistoryDashboard";
import { Suspense } from "react";

export default function DashboardPage() {
  return (
    // We apply the theme and animated background classes from your globals.css
    <div className="theme-landing animated-landing-bg min-h-[calc(100vh-4rem)] w-full">
      <div className="container mx-auto max-w-screen-2xl p-4 md:p-8">
        <Suspense fallback={<DashboardLoadingSkeleton />}>
          <HistoryDashboard />
          <br />
          <LiveDashboard />
        </Suspense>
      </div>
    </div>
  );
}

// A simple skeleton loader to show while the dashboard component loads
function DashboardLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-64 animate-pulse rounded-lg surface-card p-5" />
      ))}
    </div>
  );
}