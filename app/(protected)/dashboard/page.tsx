import DashboardClient from "@/components/dashboard-client";
import { Suspense } from "react";

export default function Dashboard() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardClient />
    </Suspense>
  );
}
