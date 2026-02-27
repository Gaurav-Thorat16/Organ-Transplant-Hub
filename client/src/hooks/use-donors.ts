import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { Donor } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useDonors() {
  return useQuery({
    queryKey: [api.donors.list.path],
    queryFn: async () => {
      const res = await fetch(api.donors.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch donors");
      const data = await res.json();
      return api.donors.list.responses[200].parse(data);
    },
  });
}

export function useCreateDonor() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Omit<Donor, "id">) => {
      const validated = api.donors.create.input.parse(data);
      const res = await fetch(api.donors.create.path, {
        method: api.donors.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.donors.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to register donor");
      }
      return api.donors.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.donors.list.path] });
      toast({
        title: "Donor Registered",
        description: "The organ donor has been successfully added to the registry.",
      });
    },
    onError: (error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}
