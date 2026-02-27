import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Activity, Droplet, HeartPulse, ListPlus, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Transplant Matching", url: "/", icon: Activity },
  { title: "Blood Donation", url: "/", icon: Droplet },
  { title: "Donor Registry", url: "/donors", icon: ListPlus },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar variant="inset">
      <SidebarHeader className="border-b border-border/50 py-4 px-6 flex flex-row items-center gap-3">
        <div className="bg-primary/10 p-2 rounded-xl text-primary">
          <HeartPulse className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold leading-tight text-foreground" style={{ fontFamily: 'var(--font-display)' }}>TransplantOS</h2>
          <p className="text-xs text-muted-foreground font-medium">Matching System</p>
        </div>
      </SidebarHeader>
      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Operations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      className={`
                        transition-all duration-200 py-6 px-4 rounded-xl
                        ${isActive 
                          ? 'bg-primary/10 text-primary font-semibold shadow-sm' 
                          : 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'}
                      `}
                    >
                      <Link href={item.url} className="flex items-center gap-3 w-full">
                        <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                        <span className="text-[15px]">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const style = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex min-h-screen w-full bg-background/50">
        <AppSidebar />
        <div className="flex flex-col flex-1 w-full overflow-hidden">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border/40 bg-background/80 px-6 backdrop-blur-md">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground hover:bg-secondary/50 p-2 rounded-lg" />
            <div className="flex-1" />
            <div className="flex items-center gap-3 text-sm text-muted-foreground bg-white/50 px-3 py-1.5 rounded-full border border-border/50">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
              </span>
              System Online
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10">
            <div className="max-w-7xl mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
