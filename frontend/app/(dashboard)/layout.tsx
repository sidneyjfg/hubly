import { AppHeader } from "@/components/app/app-header";
import { AppSidebar } from "@/components/app/app-sidebar";
import { AppVersion } from "@/components/app/app-version";
import { AuthGuard } from "@/components/app/auth-guard";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <div className="mx-auto flex min-h-screen max-w-[1800px]">
          <AppSidebar />
          <div className="flex min-h-screen flex-1 flex-col">
            <AppHeader />
            <main className="flex-1 px-4 py-6 md:px-6">{children}</main>
            <footer className="border-t border-white/10 px-4 py-4 md:px-6">
              <div className="flex justify-end">
                <AppVersion />
              </div>
            </footer>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
