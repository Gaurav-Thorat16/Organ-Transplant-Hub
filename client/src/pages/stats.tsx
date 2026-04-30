import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Heart, Users, Clock, CheckCircle2, XCircle, TrendingUp, Droplets } from "lucide-react";
import type { Stats } from "@shared/schema";

function useStats() {
  return useQuery<Stats>({
    queryKey: ["stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats");
      if (!res.ok) throw new Error("Failed to load stats");
      return res.json();
    },
  });
}

const ORGAN_COLORS: Record<string, string> = {
  Kidney: "bg-teal-500",
  Liver: "bg-cyan-500",
  Heart: "bg-red-500",
  Lungs: "bg-blue-500",
  Pancreas: "bg-violet-500",
  Cornea: "bg-amber-500",
};

const BLOOD_COLORS: Record<string, string> = {
  "O+": "bg-red-500", "O-": "bg-red-700",
  "A+": "bg-blue-500", "A-": "bg-blue-700",
  "B+": "bg-green-500", "B-": "bg-green-700",
  "AB+": "bg-purple-500", "AB-": "bg-purple-700",
};

export default function StatsPage() {
  const { data: stats, isLoading } = useStats();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-24">
          <div className="text-slate-400 animate-pulse">Loading stats...</div>
        </div>
      </AppLayout>
    );
  }

  if (!stats) return null;

  const maxOrgan = Math.max(...Object.values(stats.organBreakdown), 1);
  const maxBlood = Math.max(...Object.values(stats.bloodGroupBreakdown), 1);

  const successRate = stats.totalRequests > 0
    ? Math.round((stats.acceptedRequests / stats.totalRequests) * 100)
    : 0;

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900">Network Overview</h1>
        <p className="text-slate-500">Live statistics across the entire organ transplant network.</p>
      </div>

      {/* Top stats */}
      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Available Organs", value: stats.totalAvailableOrgans, icon: Heart, color: "text-teal-600", bg: "from-teal-50 to-cyan-50", border: "border-teal-200" },
          { label: "Registered Hospitals", value: stats.totalHospitals, icon: Users, color: "text-blue-600", bg: "from-blue-50 to-indigo-50", border: "border-blue-200" },
          { label: "Total Requests", value: stats.totalRequests, icon: BarChart3, color: "text-violet-600", bg: "from-violet-50 to-purple-50", border: "border-violet-200" },
          { label: "Pending Requests", value: stats.pendingRequests, icon: Clock, color: "text-amber-600", bg: "from-amber-50 to-orange-50", border: "border-amber-200" },
          { label: "Accepted Requests", value: stats.acceptedRequests, icon: CheckCircle2, color: "text-green-600", bg: "from-green-50 to-emerald-50", border: "border-green-200" },
          { label: "Success Rate", value: `${successRate}%`, icon: TrendingUp, color: "text-teal-600", bg: "from-teal-50 to-cyan-50", border: "border-teal-200" },
        ].map((stat) => (
          <Card key={stat.label} className={`border ${stat.border} shadow-lg bg-gradient-to-br ${stat.bg}`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-500">{stat.label}</div>
                  <div className="mt-1 text-3xl font-black text-slate-900">{stat.value}</div>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color} opacity-80`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Organ Breakdown */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Heart className="h-5 w-5 text-red-500" /> Organs by Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(stats.organBreakdown).length === 0 ? (
              <p className="text-sm text-slate-500">No data available.</p>
            ) : (
              Object.entries(stats.organBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([organ, count]) => (
                  <div key={organ}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-semibold text-slate-700">{organ}</span>
                      <span className="text-slate-500 font-mono">{count} units</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${ORGAN_COLORS[organ] ?? "bg-slate-400"} transition-all`}
                        style={{ width: `${(count / maxOrgan) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
            )}
          </CardContent>
        </Card>

        {/* Blood Group Breakdown */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Droplets className="h-5 w-5 text-red-500" /> Organs by Blood Group</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(stats.bloodGroupBreakdown).length === 0 ? (
              <p className="text-sm text-slate-500">No data available.</p>
            ) : (
              Object.entries(stats.bloodGroupBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([group, count]) => (
                  <div key={group}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-semibold text-slate-700">{group}</span>
                      <span className="text-slate-500 font-mono">{count} units</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${BLOOD_COLORS[group] ?? "bg-slate-400"} transition-all`}
                        style={{ width: `${(count / maxBlood) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
