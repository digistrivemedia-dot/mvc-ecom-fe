"use client";

import { Sidebar } from "@/components/admin/Sidebar";
import { RoleGuard } from "@/components/RoleGuard";
import { DashboardShell } from "@/components/DashboardShell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allow={["admin", "superadmin"]} redirectTo="/" loginRedirectTo="/login?redirect=/admin">
      <DashboardShell sidebar={<Sidebar />}>{children}</DashboardShell>
    </RoleGuard>
  );
}
