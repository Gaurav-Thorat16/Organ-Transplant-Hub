import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, Search, Send, Building2, Zap, AlertTriangle, CheckCircle2, Droplets, Clock } from "lucide-react";
import { patientSearchSchema, type HospitalAvailabilityView, type PatientSearchInput } from "@shared/schema";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useSearchAvailability } from "@/hooks/use-hospitals";
import { useCreateRequest } from "@/hooks/use-requests";

const ORGAN_TYPES = ["Kidney", "Liver", "Heart", "Lungs", "Pancreas", "Cornea"] as const;
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
const URGENCY_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

const URGENCY_CONFIG = {
  LOW: { color: "bg-slate-100 text-slate-700 border-slate-300", label: "Low" },
  MEDIUM: { color: "bg-blue-100 text-blue-700 border-blue-300", label: "Medium" },
  HIGH: { color: "bg-orange-100 text-orange-700 border-orange-300", label: "High" },
  CRITICAL: { color: "bg-red-100 text-red-700 border-red-300", label: "Critical" },
};

export default function PatientDashboardPage() {
  const { data: user } = useAuth();
  const [results, setResults] = useState<HospitalAvailabilityView[]>([]);
  const [searched, setSearched] = useState(false);
  const [useCompatibility, setUseCompatibility] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const { mutate: search, isPending: searching } = useSearchAvailability();
  const { mutate: createRequest, isPending: sending } = useCreateRequest();

  const form = useForm<PatientSearchInput>({
    resolver: zodResolver(patientSearchSchema),
    defaultValues: {
      city: user?.city ?? "",
      organType: "Kidney",
      bloodGroup: "O+",
      useCompatibility: false,
      urgencyLevel: "MEDIUM",
    },
  });

  const onSubmit = (input: PatientSearchInput) => {
    search({ ...input, useCompatibility }, {
      onSuccess: (data) => { setResults(data); setSearched(true); },
    });
  };

  const handleSendRequest = (item: HospitalAvailabilityView) => {
    setSendingId(item.availabilityId);
    createRequest({
      hospitalId: item.hospitalId,
      organType: item.organType,
      bloodGroup: item.bloodGroup,
      urgencyLevel: form.getValues("urgencyLevel"),
      notes: "",
    }, {
      onSettled: () => setSendingId(null),
    });
  };

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900">Patient Dashboard</h1>
        <p className="text-slate-500">Search hospitals by city and request available organs.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Search Availability</CardTitle>
            <CardDescription>Find hospitals with active organ inventory near you.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input className="h-11 pl-10" placeholder="Pune" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="organType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organ Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11"><SelectValue placeholder="Select organ" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ORGAN_TYPES.map((organ) => <SelectItem key={organ} value={organ}>{organ}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="bloodGroup" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Blood Group</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11"><SelectValue placeholder="Select blood group" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BLOOD_GROUPS.map((group) => <SelectItem key={group} value={group}>{group}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="urgencyLevel" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Urgency Level</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11"><SelectValue placeholder="Select urgency" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {URGENCY_LEVELS.map((level) => (
                          <SelectItem key={level} value={level}>
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${URGENCY_CONFIG[level].color}`}>
                              {level === "CRITICAL" && <AlertTriangle className="h-3 w-3" />}
                              {URGENCY_CONFIG[level].label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Blood Compatibility Toggle */}
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-red-500" />
                    <div>
                      <Label htmlFor="compat-toggle" className="text-sm font-semibold text-slate-800">Blood Compatibility</Label>
                      <p className="text-xs text-slate-500">Include compatible donor types</p>
                    </div>
                  </div>
                  <Switch
                    id="compat-toggle"
                    checked={useCompatibility}
                    onCheckedChange={setUseCompatibility}
                  />
                </div>

                <Button type="submit" className="h-11 w-full bg-teal-600 hover:bg-teal-700" disabled={searching}>
                  <Search className="mr-2 h-4 w-4" />
                  {searching ? "Searching..." : "Search Hospitals"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Available Hospitals</CardTitle>
            <CardDescription>
              {results.length > 0
                ? `${results.length} result${results.length === 1 ? "" : "s"} found · sorted by priority score`
                : "Run a search to view matching hospitals"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {results.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
                <Search className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                <p className="text-sm text-slate-500">{searched ? "No matching hospitals found." : "No results yet. Run a search above."}</p>
              </div>
            ) : (
              results.map((item) => {
                const urgencyLevel = form.getValues("urgencyLevel") ?? "MEDIUM";
                const urgCfg = URGENCY_CONFIG[urgencyLevel];
                const isSendingThis = sendingId === item.availabilityId;

                return (
                  <div key={item.availabilityId} className={`rounded-2xl border p-4 transition-all ${item.isCompatible ? "border-teal-200 bg-teal-50/30" : "border-slate-200 bg-white"}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 font-semibold text-slate-900">
                          <Building2 className="h-4 w-4 text-slate-500" />
                          {item.hospitalName}
                          {item.isCompatible && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-700">
                              <CheckCircle2 className="h-3 w-3" /> Exact match
                            </span>
                          )}
                          {!item.isCompatible && useCompatibility && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                              <Droplets className="h-3 w-3" /> Compatible
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                          {item.city} · {item.organType} · Blood: <strong>{item.bloodGroup}</strong>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="font-mono">Qty: {item.quantity}</Badge>
                        <Badge className="bg-green-100 text-green-700 border-green-300 hover:bg-green-100">{item.status}</Badge>
                        {item.priorityScore !== undefined && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                            <Zap className="h-3 w-3 text-amber-500" /> Score: {item.priorityScore}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      <Button
                        className="h-10 bg-teal-600 hover:bg-teal-700"
                        disabled={sending || item.quantity < 1 || item.status !== "AVAILABLE"}
                        onClick={() => handleSendRequest(item)}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        {isSendingThis ? "Sending..." : "Send Request"}
                      </Button>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${urgCfg.color}`}>
                        {urgencyLevel === "CRITICAL" && <AlertTriangle className="h-3 w-3" />}
                        {urgencyLevel} priority
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
