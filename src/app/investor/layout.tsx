"use client";

import { InvestorSidebar } from "@/components/investor/InvestorSidebar";
import { RoleGuard } from "@/components/RoleGuard";
import { DashboardShell } from "@/components/DashboardShell";

export default function InvestorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allow={["investor"]} redirectTo="/" loginRedirectTo="/login?redirect=/investor">
      <DashboardShell sidebar={<InvestorSidebar />}>{children}</DashboardShell>
    </RoleGuard>
  );
}
