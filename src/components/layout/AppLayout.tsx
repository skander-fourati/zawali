import React from "react";
import { Sidebar } from "@/components/navigation/Sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="min-h-screen">{children}</main>
    </div>
  );
}
