import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Activity, Droplet, Star, Clock, AlertTriangle, ChevronRight, Stethoscope } from "lucide-react";
import { recipientRequestSchema, type RecipientRequest, type MatchResult } from "@shared/schema";
import { useFindMatch } from "@/hooks/use-match";

import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

const ORGAN_TYPES = ["Heart", "Liver", "Kidney", "Lungs", "Pancreas", "Corneas", "Blood"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function FindMatch() {
  const { mutate: findMatch, isPending } = useFindMatch();
  const [results, setResults] = useState<MatchResult[] | null>(null);

  const form = useForm<RecipientRequest>({
    resolver: zodResolver(recipientRequestSchema),
    defaultValues: {
      organType: "",
      bloodGroup: "",
      urgencyLevel: 5,
      latitude: 40.7128,
      longitude: -74.0060,
      topK: 5,
    },
  });

  function onSubmit(data: RecipientRequest) {
    findMatch(data, {
      onSuccess: (matches) => {
        setResults(matches);
      }
    });
  }

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Matching & Allocation</h1>
        <p className="text-muted-foreground text-lg">Algorithmically matching organs and blood for optimal allocation.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Input Form */}
        <div className="lg:col-span-4">
          <Card className="glass-panel border-0 shadow-xl shadow-black/5 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-primary to-accent w-full" />
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <Search className="w-5 h-5 text-primary" />
                Recipient Profile
              </CardTitle>
              <CardDescription>Enter recipient parameters to find compatible donors.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="organType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Organ Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-11 bg-background/50 border-border/50 focus:ring-primary/20 transition-all">
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
                          <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Blood Group</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-11 bg-background/50 border-border/50 focus:ring-primary/20 transition-all">
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
                    name="urgencyLevel"
                    render={({ field }) => (
                      <FormItem className="pt-2">
                        <div className="flex justify-between items-center mb-2">
                          <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                            <Activity className="w-3 h-3" /> Urgency Level
                          </FormLabel>
                          <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                            {field.value} / 10
                          </span>
                        </div>
                        <FormControl>
                          <Slider
                            min={1}
                            max={10}
                            step={1}
                            value={[field.value]}
                            onValueChange={(vals) => field.onChange(vals[0])}
                            className="py-2"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <FormField
                      control={form.control}
                      name="latitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> Lat
                          </FormLabel>
                          <FormControl>
                            <Input type="number" step="any" className="h-10 bg-background/50 font-mono text-sm" {...field} />
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
                            <Input type="number" step="any" className="h-10 bg-background/50 font-mono text-sm" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="topK"
                    render={({ field }) => (
                      <FormItem className="pt-2">
                        <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Max Results (Top K)</FormLabel>
                        <FormControl>
                          <Input type="number" className="h-10 bg-background/50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full h-12 text-[15px] mt-4 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Executing Algorithm...
                      </div>
                    ) : (
                      "Compute Optimal Matches"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {!results && !isPending && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-border/60 rounded-2xl bg-white/30 text-center p-8"
              >
                <div className="bg-secondary p-4 rounded-full mb-4">
                  <Stethoscope className="w-12 h-12 text-secondary-foreground opacity-60" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Ready for Analysis</h3>
                <p className="text-muted-foreground max-w-md">
                  Enter the recipient's criteria on the left to query the organ database. The system will compute a compatibility ranking based on blood type, location, and urgency.
                </p>
              </motion.div>
            )}

            {isPending && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="overflow-hidden border-0 bg-white/40 shadow-sm">
                    <div className="p-6 flex items-center gap-6">
                      <div className="w-16 h-16 bg-muted rounded-xl animate-pulse" />
                      <div className="flex-1 space-y-3">
                        <div className="h-5 bg-muted rounded w-1/3 animate-pulse" />
                        <div className="h-4 bg-muted rounded w-1/4 animate-pulse" />
                      </div>
                      <div className="w-24 h-12 bg-muted rounded-lg animate-pulse" />
                    </div>
                  </Card>
                ))}
              </motion.div>
            )}

            {results && !isPending && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-5"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold">Computed Matches</h3>
                  <Badge variant="outline" className="bg-white border-border/50 text-muted-foreground">
                    {results.length} Donors Found
                  </Badge>
                </div>

                {results.length === 0 ? (
                  <Card className="bg-white/60 border-dashed border-2 py-12 text-center">
                    <AlertTriangle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <h4 className="text-lg font-semibold">No Compatible Donors</h4>
                    <p className="text-muted-foreground mt-1">There are no active donors matching these exact parameters.</p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {results.map((match, idx) => {
                      const isBest = idx === 0;
                      return (
                        <motion.div
                          key={match.donorId}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                        >
                          <Card className={`
                            relative overflow-hidden transition-all duration-300
                            ${isBest 
                              ? 'border-primary/40 glow-primary bg-gradient-to-br from-white to-primary/5 shadow-xl scale-[1.02] z-10' 
                              : 'border-border/50 bg-white hover:border-primary/30 hover:shadow-md'}
                          `}>
                            {isBest && (
                              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-bl-xl flex items-center gap-1.5 shadow-sm">
                                <Star className="w-3.5 h-3.5 fill-current" /> Optimal Match
                              </div>
                            )}
                            
                            <CardContent className="p-0">
                              <div className="flex flex-col md:flex-row items-stretch">
                                {/* Rank Indicator */}
                                <div className={`
                                  flex md:flex-col items-center justify-center p-6 border-b md:border-b-0 md:border-r border-border/40
                                  ${isBest ? 'bg-primary/5' : 'bg-muted/30'}
                                `}>
                                  <span className="text-xs uppercase tracking-wider text-muted-foreground mb-0 md:mb-1 mr-3 md:mr-0">Rank</span>
                                  <span className={`text-4xl font-black font-display ${isBest ? 'text-primary' : 'text-foreground/70'}`}>
                                    #{match.rank}
                                  </span>
                                </div>

                                {/* Main Details */}
                                <div className="p-6 flex-1 flex flex-col justify-between">
                                  <div>
                                    <div className="flex items-start justify-between mb-1">
                                      <h4 className="text-lg font-bold text-foreground flex items-center gap-2">
                                        {match.hospitalName}
                                      </h4>
                                      <Badge variant="secondary" className={`font-mono font-bold text-sm ${isBest ? 'bg-primary/10 text-primary hover:bg-primary/20' : ''}`}>
                                        Score: {match.priorityScore.toFixed(1)}
                                      </Badge>
                                    </div>
                                    <p className="text-muted-foreground text-sm flex items-center gap-1.5 mb-4">
                                      <MapPin className="w-3.5 h-3.5" /> 
                                      {match.distance.toFixed(1)} km away
                                    </p>
                                  </div>

                                  <div className="flex flex-wrap gap-3 mt-auto">
                                    <Badge variant="outline" className="bg-background flex items-center gap-1.5 py-1">
                                      <Activity className="w-3.5 h-3.5 text-accent" /> {match.organDetails}
                                    </Badge>
                                    <Badge variant="outline" className="bg-background flex items-center gap-1.5 py-1">
                                      <Droplet className="w-3.5 h-3.5 text-destructive" /> Blood Type Match
                                    </Badge>
                                    <Badge variant="outline" className={`bg-background flex items-center gap-1.5 py-1 ${match.viabilityTime < 12 ? 'text-destructive border-destructive/30' : ''}`}>
                                      <Clock className="w-3.5 h-3.5" /> {match.viabilityTime}h viable
                                    </Badge>
                                  </div>
                                </div>

                                {/* Action Area */}
                                <div className="p-6 flex items-center justify-end bg-gradient-to-l from-muted/20 to-transparent">
                                  <Button variant={isBest ? "default" : "outline"} className={`h-12 px-6 rounded-xl ${isBest ? 'shadow-lg shadow-primary/20' : ''}`}>
                                    Initiate Protocol
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppLayout>
  );
}
