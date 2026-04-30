import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { HeartPulse, BarChart3, Moon, Sun, LogOut, Building2, UserRound, ClipboardList, TrendingUp } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import { useHospitalAvailability } from "@/hooks/use-hospitals";
import { useAuth, useLogout } from "@/hooks/use-auth";
import { useIncomingRequests } from "@/hooks/use-requests";
import { useTheme } from "next-themes";
import { useQuery } from "@tanstack/react-query";
import type { Stats } from "@shared/schema";

function useStats() {
  return useQuery<Stats>({
    queryKey: ["stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats");
      if (!res.ok) throw new Error("Failed to load stats");
      return res.json();
    },
    refetchInterval: 30000,
  });
}

export function AppSidebar() {
  const [location] = useLocation();
  const { data: user } = useAuth();
  const { data: availability } = useHospitalAvailability(user?.role === "hospital");
  const { data: incoming = [] } = useIncomingRequests(user?.role === "hospital");
  const { data: stats } = useStats();
  const { mutate: logout, isPending: loggingOut } = useLogout();

  const pendingCount = incoming.filter((r) => r.status === "PENDING").length;

  const navItems = [
    {
      title: user?.role === "hospital" ? "Hospital Dashboard" : "Patient Dashboard",
      url: user?.role === "hospital" ? "/hospital" : "/patient",
      icon: user?.role === "hospital" ? Building2 : UserRound,
      description: user?.role === "hospital" ? "Manage stock and requests" : "Search organ availability",
      badge: user?.role === "hospital" && pendingCount > 0 ? pendingCount : null,
    },
    ...(user?.role === "patient"
      ? [{ title: "My Requests", url: "/my-requests", icon: ClipboardList, description: "Track submitted requests", badge: null }]
      : []),
    {
      title: "Stats Overview",
      url: "/stats",
      icon: TrendingUp,
      description: "Network-wide overview",
      badge: null,
    },
  ];

  const organCount = availability?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const activeTypes = availability?.filter((item) => item.status === "AVAILABLE").length ?? 0;

  return (
    <Sidebar variant="inset">
      <SidebarHeader className="border-b border-border/50 py-5 px-5">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-teal-500 to-cyan-500 p-2.5 rounded-xl shadow-lg shadow-teal-500/30">
            <HeartPulse className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-black text-gray-900 tracking-tight leading-none">TransplantOS</h2>
            <p className="text-xs text-gray-400 font-medium mt-0.5">Organ Matching Network</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-xs font-semibold text-green-700">Network Online</span>
        </div>
        {user ? (
          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs uppercase tracking-wider text-slate-400">Signed in as</div>
            <div className="mt-1 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">{user.name}</div>
                <div className="text-xs text-slate-500 capitalize">{user.role} · {user.city}</div>
                {user.phone && <div className="text-xs text-slate-400">{user.phone}</div>}
              </div>
              <button
                type="button"
                onClick={() => logout()}
                disabled={loggingOut}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-60"
              >
                <LogOut className="h-3.5 w-3.5" /> Exit
              </button>
            </div>
          </div>
        ) : null}
      </SidebarHeader>

      <SidebarContent className="pt-4 px-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 px-2">Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} className={`transition-all duration-200 py-3 px-3 rounded-xl ${isActive ? "bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-300 shadow-sm" : "hover:bg-gray-50 border border-transparent"}`}>
                      <Link href={item.url} className="flex items-center gap-3 w-full">
                        <div className={`p-1.5 rounded-lg ${isActive ? "bg-teal-600 shadow-md shadow-teal-500/30" : "bg-gray-100"}`}>
                          <item.icon className={`w-4 h-4 ${isActive ? "text-white" : "text-gray-500"}`} />
                        </div>
                        <div className="min-w-0 flex-1 leading-tight">
                          <div className={`truncate text-sm font-semibold ${isActive ? "text-teal-900" : "text-gray-800"}`}>{item.title}</div>
                          <div className={`truncate text-xs ${isActive ? "text-teal-700" : "text-gray-500"}`}>{item.description}</div>
                        </div>
                        {item.badge ? (
                          <span className="inline-flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold min-w-[18px] h-[18px] px-1">
                            {item.badge}
                          </span>
                        ) : null}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user?.role === "hospital" ? (
          <div className="mt-6 mx-1 p-4 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-2xl text-white shadow-lg shadow-teal-500/25">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-white/70" />
              <span className="text-xs font-bold uppercase tracking-wider text-white/70">My Inventory</span>
            </div>
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/80">Total Units</span>
                <span className="font-black text-lg">{organCount}</span>
              </div>
              <div className="h-px bg-white/10" />
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/80">Active Entries</span>
                <span className="font-black text-lg">{activeTypes}</span>
              </div>
              {pendingCount > 0 && (
                <>
                  <div className="h-px bg-white/10" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/80">Pending Requests</span>
                    <span className="font-black text-lg text-amber-300">{pendingCount}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : stats ? (
          <div className="mt-6 mx-1 p-4 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-2xl text-white shadow-lg shadow-teal-500/25">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-white/70" />
              <span className="text-xs font-bold uppercase tracking-wider text-white/70">Network Stats</span>
            </div>
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/80">Available Organs</span>
                <span className="font-black text-lg">{stats.totalAvailableOrgans}</span>
              </div>
              <div className="h-px bg-white/10" />
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/80">Hospitals</span>
                <span className="font-black text-lg">{stats.totalHospitals}</span>
              </div>
              <div className="h-px bg-white/10" />
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/80">Total Requests</span>
                <span className="font-black text-lg">{stats.totalRequests}</span>
              </div>
            </div>
          </div>
        ) : null}
      </SidebarContent>
    </Sidebar>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const isDark = mounted && theme === "dark";
  const style = { "--sidebar-width": "17rem", "--sidebar-width-icon": "4rem" };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex min-h-screen w-full bg-slate-50">
        <AppSidebar />
        <div className="flex flex-col flex-1 w-full overflow-hidden">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-gray-100 bg-white/90 px-6 backdrop-blur-md shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
            <SidebarTrigger className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors" />
            <div className="h-5 w-px bg-gray-200 dark:bg-slate-700" />
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              {isDark ? "Light" : "Dark"}
            </button>
            <div className="text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
              TransplantOS v2.1 · India Network
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10">
            <div className="max-w-7xl mx-auto w-full">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
