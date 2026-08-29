"use client";

import { usePageView } from "@/hooks/useAnalytics";

export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  usePageView();
  return <>{children}</>;
}
