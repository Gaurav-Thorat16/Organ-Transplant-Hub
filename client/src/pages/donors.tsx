import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Building2, Activity, Droplet, Clock, MapPin, Plus, ListFilter, Calendar } from "lucide-react";

import { donorSchema, type Donor } from "@shared/schema";
import { useDonors, useCreateDonor } from "@/hooks/use-donors";
import { AppLayout } from "@/components/layout";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const ORGAN_TYPES = ["Heart", "Liver", "Kidney", "Lungs", "Pancreas", "Corneas"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function Donors() {
  const { data: donors, isLoading } = useDonors();
  const { mutate: createDonor, isPending } = useCreateDonor();

  const form = useForm<Omit<Donor, "id">>({
    resolver: zodResolver(donorSchema.omit({ id: true })),
    defaultValues: {
      hospitalName: "",
      organType: "",
      bloodGroup: "",
      viabilityTime: 24,
      latitude: 40.7128,
      longitude: -74.0060,
    },
  });

  function onSubmit(data: Omit<Donor, "id">) {
    createDonor(data, {
      onSuccess: () => {
        form.reset({
          ...data,
          hospitalName: "", // Clear specific fields, keep location for ease
          organType: "",
          bloodGroup: "",
        });
      }
    });
  }

  return (
    <AppLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Donor Registry</h1>
          <p className="text-muted-foreground text-lg">Manage available organs and hospital submissions.</p>
        </div>
        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-4 py-1.5 text-sm">
          <Activity className="w-4 h-4 mr-2" />
          {donors?.length || 0} Active Donors
        </Badge>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Registration Form */}
        <Card className="xl:col-span-1 glass-panel border-0 shadow-lg shadow-black/5 h-fit">
          <CardHeader className="bg-muted/30 border-b border-border/50 pb-5">
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="w-5 h-5 text-accent" />
              Register New Donor
            </CardTitle>
            <CardDescription>Enter procurement details into the secure network.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="hospitalName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> Origin Hospital
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Memorial General..." className="h-11 bg-background/50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="organType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                          <Activity className="w-3 h-3" /> Organ
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 bg-background/50">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ORGAN_TYPES.map((org) => (
                              <SelectItem key={org} value={org}>{org}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bloodGroup"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                          <Droplet className="w-3 h-3" /> Blood Grp
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 bg-background/50">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {BLOOD_GROUPS.map((bg) => (
                              <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="viabilityTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Viability (Hours)
                      </FormLabel>
                      <FormControl>
                        <Input type="number" min="1" className="h-11 bg-background/50 font-mono" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> Lat
                        </FormLabel>
                        <FormControl>
                          <Input type="number" step="any" className="h-11 bg-background/50 font-mono text-sm" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="longitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Lng</FormLabel>
                        <FormControl>
                          <Input type="number" step="any" className="h-11 bg-background/50 font-mono text-sm" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 mt-4" 
                  disabled={isPending}
                >
                  {isPending ? "Registering..." : "Add to Registry"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Database List */}
        <Card className="xl:col-span-2 glass-panel border-0 shadow-sm overflow-hidden">
          <CardHeader className="bg-white/50 border-b border-border/50 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <ListFilter className="w-5 h-5 text-muted-foreground" />
                Active Database
              </CardTitle>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Hospital</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Organ</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Blood Group</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Viability</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="h-4 bg-muted animate-pulse rounded w-32"></div></TableCell>
                      <TableCell><div className="h-6 bg-muted animate-pulse rounded-full w-20"></div></TableCell>
                      <TableCell><div className="h-6 bg-muted animate-pulse rounded-full w-12"></div></TableCell>
                      <TableCell><div className="h-4 bg-muted animate-pulse rounded w-16"></div></TableCell>
                      <TableCell><div className="h-4 bg-muted animate-pulse rounded w-24"></div></TableCell>
                    </TableRow>
                  ))
                ) : !donors || donors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <Activity className="w-10 h-10 mb-3 opacity-20" />
                        <p>No active donors in the registry.</p>
                        <p className="text-sm">Use the form to register new procurements.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  donors.map((donor) => (
                    <TableRow key={donor.id} className="hover:bg-primary/5 transition-colors">
                      <TableCell className="font-medium">
                        {donor.hospitalName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-background shadow-sm text-foreground font-medium">
                          {donor.organType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-accent/10 text-accent hover:bg-accent/20 font-bold border-0">
                          {donor.bloodGroup}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                          <Clock className={`w-3.5 h-3.5 ${donor.viabilityTime < 12 ? 'text-destructive' : 'text-success'}`} />
                          <span className={donor.viabilityTime < 12 ? 'text-destructive font-medium' : ''}>
                            {donor.viabilityTime}h
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {donor.latitude.toFixed(2)}, {donor.longitude.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
