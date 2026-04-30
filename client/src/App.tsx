import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth";
import HospitalDashboardPage from "@/pages/donor-requests";
import MyRequestsPage from "@/pages/my-requests";
import PatientDashboardPage from "@/pages/find-match";
import StatsPage from "@/pages/stats";
import { useAuth } from "@/hooks/use-auth";

function RoleHome() {
  const { data: user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <AuthPage />;
  if (user.role === "hospital") return <HospitalDashboardPage />;
  return <PatientDashboardPage />;
}

function Router() {
  const { data: user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <AuthPage />;

  return (
    <Switch>
      <Route path="/" component={RoleHome} />
      <Route path="/patient">
        {user.role === "patient" ? <PatientDashboardPage /> : <RoleHome />}
      </Route>
      <Route path="/hospital">
        {user.role === "hospital" ? <HospitalDashboardPage /> : <RoleHome />}
      </Route>
      <Route path="/my-requests">
        {user.role === "patient" ? <MyRequestsPage /> : <RoleHome />}
      </Route>
      <Route path="/stats">
        <StatsPage />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
