import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMyRequests } from "@/hooks/use-requests";
import { AlertTriangle, Clock, CheckCircle2, XCircle, ClipboardList, FileText } from "lucide-react";

const URGENCY_CONFIG: Record<string, { color: string; label: string }> = {
  LOW: { color: "bg-slate-100 text-slate-700 border-slate-300", label: "Low Priority" },
  MEDIUM: { color: "bg-blue-100 text-blue-700 border-blue-300", label: "Medium Priority" },
  HIGH: { color: "bg-orange-100 text-orange-700 border-orange-300", label: "High Priority" },
  CRITICAL: { color: "bg-red-100 text-red-700 border-red-300", label: "Critical Priority" },
};

const STATUS_CONFIG = {
  PENDING: { color: "bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-100", icon: Clock, label: "Pending" },
  ACCEPTED: { color: "bg-green-100 text-green-700 border-green-300 hover:bg-green-100", icon: CheckCircle2, label: "Accepted" },
  REJECTED: { color: "bg-red-100 text-red-700 border-red-300 hover:bg-red-100", icon: XCircle, label: "Rejected" },
};

export default function MyRequestsPage() {
  const { data: requests = [] } = useMyRequests();

  const pending = requests.filter((r) => r.status === "PENDING").length;
  const accepted = requests.filter((r) => r.status === "ACCEPTED").length;
  const rejected = requests.filter((r) => r.status === "REJECTED").length;

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900">My Requests</h1>
        <p className="text-slate-500">Live status of all requests submitted to hospitals.</p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {[
          { label: "Pending", value: pending, icon: Clock, bg: "from-amber-50 to-orange-50", border: "border-amber-200", text: "text-amber-600", count: "text-amber-900" },
          { label: "Accepted", value: accepted, icon: CheckCircle2, bg: "from-green-50 to-emerald-50", border: "border-green-200", text: "text-green-600", count: "text-green-900" },
          { label: "Rejected", value: rejected, icon: XCircle, bg: "from-red-50 to-rose-50", border: "border-red-200", text: "text-red-500", count: "text-red-900" },
        ].map((stat) => (
          <Card key={stat.label} className={`border ${stat.border} shadow-lg bg-gradient-to-br ${stat.bg}`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-500">{stat.label}</div>
                  <div className={`mt-1 text-3xl font-black ${stat.count}`}>{stat.value}</div>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.text} opacity-80`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" /> Request History
          </CardTitle>
          <CardDescription>Every request and its latest decision by the hospital.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {requests.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
              <ClipboardList className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">No requests submitted yet.</p>
            </div>
          ) : (
            requests.map((request) => {
              const statusCfg = STATUS_CONFIG[request.status];
              const urgCfg = URGENCY_CONFIG[request.urgencyLevel] ?? URGENCY_CONFIG.MEDIUM;
              const StatusIcon = statusCfg.icon;

              return (
                <div
                  key={request.id}
                  className={`rounded-2xl border p-4 transition-all ${
                    request.status === "ACCEPTED" ? "border-green-200 bg-green-50/30" :
                    request.status === "REJECTED" ? "border-red-200 bg-red-50/20" :
                    "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">
                        {request.organType} ({request.bloodGroup}) → {request.hospitalName}
                      </div>
                      <div className="mt-0.5 text-sm text-slate-500">
                        City: {request.patientCity} · Submitted {new Date(request.createdAt).toLocaleString()}
                      </div>
                      {request.status !== "PENDING" && (
                        <div className="mt-0.5 text-xs text-slate-400">
                          Updated: {new Date(request.updatedAt).toLocaleString()}
                        </div>
                      )}
                      {request.notes && (
                        <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600">
                          <FileText className="h-3 w-3 mt-0.5 flex-shrink-0 text-slate-400" />
                          <span>{request.notes}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <Badge className={statusCfg.color}>
                        <StatusIcon className="mr-1 h-3 w-3" />{statusCfg.label}
                      </Badge>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${urgCfg.color}`}>
                        {request.urgencyLevel === "CRITICAL" && <AlertTriangle className="h-3 w-3" />}
                        {urgCfg.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
