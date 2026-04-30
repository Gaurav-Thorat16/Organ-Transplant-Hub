import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Shield, HeartPulse, UserRound, Mail, Lock, Building2, MapPin } from "lucide-react";
import { authLoginSchema, authSignupSchema, type AuthLoginInput, type AuthSignupInput } from "@shared/schema";
import { useLogin, useSignup } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ROLES = [
  { value: "patient", label: "Patient", description: "Search available organs and send requests to hospitals." },
  { value: "hospital", label: "Hospital", description: "Manage organ availability and respond to patient requests." },
] as const;

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const login = useLogin();
  const signup = useSignup();

  const loginForm = useForm<AuthLoginInput>({
    resolver: zodResolver(authLoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const signupForm = useForm<AuthSignupInput>({
    resolver: zodResolver(authSignupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "patient",
      city: "",
    },
  });

  const selectedRole = signupForm.watch("role");
  const roleCard = useMemo(() => ROLES.find((role) => role.value === selectedRole), [selectedRole]);

  const fillDemo = (role: "hospital" | "patient") => {
    const credentials = {
      hospital: { email: "hospital.pune@transplant.local", password: "Hospital123!" },
      patient: { email: "patient.pune@transplant.local", password: "Patient123!" },
    };

    setMode("login");
    loginForm.setValue("email", credentials[role].email, { shouldDirty: true });
    loginForm.setValue("password", credentials[role].password, { shouldDirty: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-white p-4 sm:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-md items-center">
        <Card className="w-full border-slate-200 shadow-xl">
          <CardHeader className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 p-2.5 text-white">
                <HeartPulse className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black">TransplantOS</CardTitle>
                <CardDescription>Secure role-based access</CardDescription>
              </div>
              <div className="ml-auto rounded-xl bg-teal-50 p-2 text-teal-700">
                <Shield className="h-4 w-4" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${mode === "login" ? "bg-white text-slate-900 shadow" : "text-slate-500"}`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${mode === "signup" ? "bg-white text-slate-900 shadow" : "text-slate-500"}`}
              >
                Signup
              </button>
            </div>
          </CardHeader>

          <CardContent>
            {mode === "login" ? (
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit((values) => login.mutate(values))} className="space-y-4">
                  {login.error ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {login.error.message}
                    </div>
                  ) : null}

                  <FormField control={loginForm.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input className="h-11 pl-10" placeholder="doctor@transplantos.local" autoComplete="email" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={loginForm.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input className="h-11 pl-10" type="password" autoComplete="current-password" placeholder="••••••••" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-600">
                    Demo: hospital.pune@transplant.local / Hospital123! · patient.pune@transplant.local / Patient123!
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant="outline" className="h-9" onClick={() => fillDemo("hospital")}>
                      Hospital Demo
                    </Button>
                    <Button type="button" variant="outline" className="h-9" onClick={() => fillDemo("patient")}>
                      Patient Demo
                    </Button>
                  </div>

                  <Button type="submit" className="h-11 w-full" disabled={login.isPending}>
                    {login.isPending ? "Signing in..." : "Sign in"}
                  </Button>
                </form>
              </Form>
            ) : (
              <Form {...signupForm}>
                <form onSubmit={signupForm.handleSubmit((values) => signup.mutate(values))} className="space-y-4">
                  {signup.error ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {signup.error.message}
                    </div>
                  ) : null}

                  <FormField control={signupForm.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input className="h-11 pl-10" autoComplete="email" placeholder="name@hospital.org" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={signupForm.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input className="h-11 pl-10" type="password" autoComplete="new-password" placeholder="At least 6 characters" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={signupForm.control} name="role" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ROLES.map((role) => (
                            <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={signupForm.control} name="city" render={({ field }) => (
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

                  <FormField control={signupForm.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{selectedRole === "hospital" ? "Hospital Name" : "Patient Name"}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input className="h-11 pl-10" placeholder={roleCard?.description ?? "Name"} {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <Button type="submit" className="h-11 w-full" disabled={signup.isPending}>
                    {signup.isPending ? "Creating account..." : "Create account"}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}