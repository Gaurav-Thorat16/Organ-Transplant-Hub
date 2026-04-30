import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { AuthLoginInput, AuthSignupInput, AuthUser } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

async function parseJsonError(response: Response) {
  try {
    return await response.json();
  } catch {
    return { message: "Request failed" };
  }
}

export function useAuth() {
  return useQuery({
    queryKey: [api.auth.me.path],
    queryFn: async (): Promise<AuthUser | null> => {
      const response = await fetch(api.auth.me.path, { credentials: "include" });
      if (response.status === 401) {
        return null;
      }
      if (!response.ok) {
        throw new Error("Failed to load session");
      }
      return api.auth.me.responses[200].parse(await response.json());
    },
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: AuthLoginInput): Promise<AuthUser> => {
      const response = await fetch(api.auth.login.path, {
        method: api.auth.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(api.auth.login.input.parse(input)),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await parseJsonError(response);
        throw new Error(error.message || "Invalid credentials");
      }

      return api.auth.login.responses[200].parse(await response.json());
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
      toast({ title: "Signed in", description: "Welcome back." });
    },
    onError: (error) => {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    },
  });
}

export function useSignup() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: AuthSignupInput): Promise<AuthUser> => {
      const response = await fetch(api.auth.signup.path, {
        method: api.auth.signup.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(api.auth.signup.input.parse(input)),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await parseJsonError(response);
        throw new Error(error.message || "Unable to create account");
      }

      return api.auth.signup.responses[201].parse(await response.json());
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
      toast({ title: "Account created", description: "You are now signed in." });
    },
    onError: (error) => {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(api.auth.logout.path, {
        method: api.auth.logout.method,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await parseJsonError(response);
        throw new Error(error.message || "Unable to log out");
      }
    },
    onSuccess: async () => {
      await queryClient.clear();
      toast({ title: "Logged out", description: "Your session has ended." });
      window.location.href = "/";
    },
    onError: (error) => {
      toast({ title: "Logout failed", description: error.message, variant: "destructive" });
    },
  });
}
