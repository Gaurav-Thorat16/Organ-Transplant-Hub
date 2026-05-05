import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ClipboardList, CheckCircle2, XCircle, PlusCircle, Trash2, Minus, AlertTriangle, BarChart3, Users, Clock } from "lucide-react";
import { createOrganAvailabilitySchema, type CreateOrganAvailability } from "@shared/schema";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHospitalAvailability, useAddHospitalAvailability } from "@/hooks/use-hospitals";
import { useIncomingRequests, useUpdateRequestStatus } from "@/hooks/use-requests";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const ORGAN_TYPES = ["Kidney", "Liver", "Heart", "Lungs", "Pancreas", "Cornea"] as const;
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

const URGENCY_CONFIG: Record<string, { color: string; label: string }> = {
  LOW: { color: "bg-slate-100 text-slate-700 border-slate-300", label: "Low" },
  MEDIUM: { color: "bg-blue-100 text-blue-700 border-blue-300", label: "Medium" },
  HIGH: { color: "bg-orange-100 text-orange-700 border-orange-300", label: "High" },
  CRITICAL: { color: "bg-red-100 text-red-700 border-red-300", label: "Critical" },
};

function useDeleteAvailability() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (availabilityId: string) => {
      const res = await fetch(`/api/hospitals/availability/${availabilityId}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hospital-availability"] }); toast({ title: "Deleted", description: "Availability entry removed." }); },
    onError: (e: Error) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });
}

function useReduceAvailability() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ availabilityId, amount }: { availabilityId: string; amount: number }) => {
      const res = await fetch(`/api/hospitals/availability/${availabilityId}/reduce`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hospital-availability"] }); toast({ title: "Reduced", description: "Quantity updated." }); },
    onError: (e: Error) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });
}

export default function HospitalDashboardPage() {
  const { data: availability = [] } = useHospitalAvailability();
  const { mutate: addAvailability, isPending: adding } = useAddHospitalAvailability();
  const { data: incoming = [] } = useIncomingRequests();
  const { mutate: updateStatus, isPending: updating } = useUpdateRequestStatus();
  const { mutate: deleteEntry, isPending: deleting } = useDeleteAvailability();
  const { mutate: reduceEntry, isPending: reducing } = useReduceAvailability();
  const [reduceAmounts, setReduceAmounts] = useState<Record<string, number>>({});
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "ACCEPTED" | "REJECTED">("ALL");

  const form = useForm<CreateOrganAvailability>({
    resolver: zodResolver(createOrganAvailabilitySchema),
    defaultValues: { city: "", organType: "Kidney", bloodGroup: "O+", quantity: 1 },
  });

  const pending = incoming.filter((r) => r.status === "PENDING");
  const accepted = incoming.filter((r) => r.status === "ACCEPTED");
  const rejected = incoming.filter((r) => r.status === "REJECTED");
  const filtered = statusFilter === "ALL" ? incoming : incoming.filter((r) => r.status === statusFilter);

  const totalUnits = availability.reduce((s, e) => s + e.quantity, 0);

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900">Hospital Dashboard</h1>
        <p className="text-slate-500">Manage organ inventory and patient requests.</p>
      </div>

      {/* Stats Summary */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        {[
          { label: "Total Units", value: totalUnits, icon: BarChart3, color: "text-teal-600" },
          { label: "Pending Requests", value: pending.length, icon: Clock, color: "text-amber-600" },
          { label: "Accepted", value: accepted.length, icon: CheckCircle2, color: "text-green-600" },
          { label: "Rejected", value: rejected.length, icon: XCircle, color: "text-red-500" },
        ].map((stat) => (
          <Card key={stat.label} className="border-0 shadow-lg">
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Add Organ Availability</CardTitle>
            <CardDescription>Register available organs for your hospital.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((input) => {
                addAvailability(input, { onSuccess: () => form.reset({ city: "", organType: "Kidney", bloodGroup: "O+", quantity: 1 }) });
              })} className="space-y-4">
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem><FormLabel>City</FormLabel><FormControl><Input className="h-11" placeholder="Pune" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="organType" render={({ field }) => (
                  <FormItem><FormLabel>Organ Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger className="h-11"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{ORGAN_TYPES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="bloodGroup" render={({ field }) => (
                  <FormItem><FormLabel>Blood Group</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger className="h-11"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{BLOOD_GROUPS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="quantity" render={({ field }) => (
                  <FormItem><FormLabel>Quantity</FormLabel><FormControl><Input type="number" min={1} className="h-11" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" className="h-11 w-full bg-teal-600 hover:bg-teal-700" disabled={adding}>
                  <PlusCircle className="mr-2 h-4 w-4" />{adding ? "Saving..." : "Add Availability"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Current Inventory</CardTitle>
            <CardDescription>All organ entries registered by this hospital.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
            {availability.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">No availability records yet.</div>
            ) : (
              availability.map((entry) => (
                <div key={entry.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">{entry.organType}</div>
                      <div className="text-xs text-slate-500">{entry.city} · {entry.bloodGroup}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="outline">Qty: {entry.quantity}</Badge>
                      <Badge className={entry.status === "AVAILABLE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>{entry.status}</Badge>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={entry.quantity}
                      className="h-8 w-20 text-sm"
                      value={reduceAmounts[entry.id] ?? 1}
                      onChange={(e) => setReduceAmounts((prev) => ({ ...prev, [entry.id]: parseInt(e.target.value) || 1 }))}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      disabled={reducing || entry.quantity === 0}
                      onClick={() => reduceEntry({ availabilityId: entry.id, amount: reduceAmounts[entry.id] ?? 1 })}
                    >
                      <Minus className="mr-1 h-3 w-3" /> Reduce
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs text-red-600 hover:bg-red-50 border-red-200 ml-auto"
                      disabled={deleting}
                      onClick={() => deleteEntry(entry.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-0 shadow-xl">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" /> All Requests
                {pending.length > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold w-5 h-5">{pending.length}</span>
                )}
              </CardTitle>
              <CardDescription>Accept or reject incoming patient requests, sorted by urgency.</CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              {(["ALL", "PENDING", "ACCEPTED", "REJECTED"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold border transition-all ${statusFilter === f ? "bg-teal-600 text-white border-teal-600" : "bg-white text-slate-600 border-slate-200 hover:border-teal-300"}`}
                >
                  {f} {f === "ALL" ? `(${incoming.length})` : f === "PENDING" ? `(${pending.length})` : f === "ACCEPTED" ? `(${accepted.length})` : `(${rejected.length})`}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-sm text-slate-500 py-4 text-center">No {statusFilter !== "ALL" ? statusFilter.toLowerCase() : ""} requests.</div>
          ) : (
            filtered.map((request) => {
              const urgCfg = URGENCY_CONFIG[request.urgencyLevel] ?? URGENCY_CONFIG.MEDIUM;
              return (
                <div key={request.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 font-semibold text-slate-900">
                        <Users className="h-4 w-4 text-slate-400" />
                        {request.patientName} — {request.organType} ({request.bloodGroup})
                      </div>
                      <div className="text-sm text-slate-500 mt-0.5">
                        {request.patientCity} · {new Date(request.createdAt).toLocaleString()}
                      </div>
                      {request.notes && (
                        <div className="mt-1 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1.5 text-xs text-amber-800">
                          📝 {request.notes}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${urgCfg.color}`}>
                        {request.urgencyLevel === "CRITICAL" && <AlertTriangle className="h-3 w-3" />}
                        {urgCfg.label}
                      </span>
                      <Badge className={
                        request.status === "PENDING" ? "bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-100" :
                        request.status === "ACCEPTED" ? "bg-green-100 text-green-700 border-green-300 hover:bg-green-100" :
                        "bg-red-100 text-red-700 border-red-300 hover:bg-red-100"
                      }>{request.status}</Badge>
                    </div>
                  </div>
                  {request.status === "PENDING" && (
                    <div className="mt-3 flex gap-2">
                      <Button className="h-9 bg-teal-600 hover:bg-teal-700" disabled={updating} onClick={() => updateStatus({ requestId: request.id, status: "ACCEPTED" })}>
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Accept
                      </Button>
                      <Button variant="outline" className="h-9" disabled={updating} onClick={() => updateStatus({ requestId: request.id, status: "REJECTED" })}>
                        <XCircle className="mr-2 h-4 w-4" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
