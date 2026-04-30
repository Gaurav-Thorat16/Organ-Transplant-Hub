 import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type {
  CreateOrganAvailability,
  Hospital,
  HospitalAvailabilityView,
  OrganAvailability,
  PatientSearchInput,
} from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

async function parseJsonError(response: Response) {
  try {
    return await response.json();
  } catch {
    return { message: "Request failed" };
  }
}

export function useMyHospital() {
  return useQuery({
    queryKey: [api.hospitals.mine.path],
    queryFn: async (): Promise<Hospital> => {
      const response = await fetch(api.hospitals.mine.path, { credentials: "include" });
      if (!response.ok) {
        throw new Error("Failed to load hospital profile");
      }
      return api.hospitals.mine.responses[200].parse(await response.json());
    },
  });
}

export function useHospitalAvailability(enabled = true) {
  return useQuery({
    queryKey: [api.hospitals.availabilityList.path],
    enabled,
    queryFn: async (): Promise<OrganAvailability[]> => {
      const response = await fetch(api.hospitals.availabilityList.path, { credentials: "include" });
      if (!response.ok) {
        throw new Error("Failed to load availability");
      }
      return api.hospitals.availabilityList.responses[200].parse(await response.json());
    },
    refetchInterval: 8000,
  });
}

export function useAddHospitalAvailability() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateOrganAvailability): Promise<OrganAvailability> => {
      const response = await fetch(api.hospitals.createAvailability.path, {
        method: api.hospitals.createAvailability.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(api.hospitals.createAvailability.input.parse(input)),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await parseJsonError(response);
        throw new Error(error.message || "Unable to add availability");
      }

      return api.hospitals.createAvailability.responses[201].parse(await response.json());
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [api.hospitals.availabilityList.path] });
      toast({ title: "Availability updated", description: "Organ inventory has been saved." });
    },
    onError: (error) => {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    },
  });
}

export function useSearchAvailability() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: PatientSearchInput): Promise<HospitalAvailabilityView[]> => {
      const response = await fetch(api.patients.searchAvailability.path, {
        method: api.patients.searchAvailability.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(api.patients.searchAvailability.input.parse(input)),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await parseJsonError(response);
        throw new Error(error.message || "Unable to search");
      }

      return api.patients.searchAvailability.responses[200].parse(await response.json());
    },
    onError: (error) => {
      toast({ title: "Search failed", description: error.message, variant: "destructive" });
    },
  });
}
