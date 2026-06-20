import { AppHeader } from "@/components/app/app-header";
import { AppSidebar } from "@/components/app/app-sidebar";
import { AppVersion } from "@/components/app/app-version";
import { AuthGuard } from "@/components/app/auth-guard";
import { MobileNavigation } from "@/components/app/mobile-navigation";
import { PlanAccessProvider } from "@/components/billing/plan-access-provider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <PlanAccessProvider>
      <div className="min-h-screen bg-background">
        <div className="mx-auto flex min-h-screen max-w-[1800px]">
          <AppSidebar />
          <div className="flex min-h-screen flex-1 flex-col">
            <AppHeader />
            <main className="flex-1 px-4 py-4 pb-28 md:px-6 md:py-6 xl:pb-6">{children}</main>
            <footer className="hidden border-t border-white/10 px-4 py-4 md:px-6 xl:block">
              <div className="flex justify-end">
                <AppVersion />
              </div>
            </footer>
            <MobileNavigation />
          </div>
        </div>
      </div>
      </PlanAccessProvider>
    </AuthGuard>
  );
}
