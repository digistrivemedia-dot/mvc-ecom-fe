/**
 * Shared sidebar + content layout for the admin/vendor/investor dashboards.
 * Extracted from admin/layout.tsx so /vendor and /investor layouts don't
 * have to copy-paste the same flex/ml-64 shell.
 */
interface DashboardShellProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export function DashboardShell({ sidebar, children }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {sidebar}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
