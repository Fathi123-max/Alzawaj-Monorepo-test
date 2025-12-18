"use client";

import { ReactNode } from "react";
import { LandingNavigation } from "@/components/landing/navigation";
import { LandingFooter } from "@/components/landing/footer";
import { NotificationBanner } from "@/components/common/notification-banner";

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <NotificationBanner />
      <LandingNavigation />
      <main className="flex-1">{children}</main>
      <LandingFooter />
    </div>
  );
}
