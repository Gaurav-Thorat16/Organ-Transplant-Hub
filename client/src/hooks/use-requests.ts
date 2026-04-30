import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { CreateTransplantRequest, TransplantRequest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

async function parseJsonError(response: Response) {
  try {
    return await response.json();
  } catch {
    return { message: "Request failed" };
  }
}

export function useCreateRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateTransplantRequest): Promise<TransplantRequest> => {
      const response = await fetch(api.requests.create.path, {
        method: api.requests.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(api.requests.create.input.parse(input)),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await parseJsonError(response);
        throw new Error(error.message || "Unable to create request");
      }

      return api.requests.create.responses[201].parse(await response.json());
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [api.requests.mine.path] });
      await queryClient.invalidateQueries({ queryKey: [api.requests.incoming.path] });
      await queryClient.invalidateQueries({ queryKey: [api.hospitals.availabilityList.path] });
      toast({ title: "Request sent", description: "Hospital has received your request." });
    },
    onError: (error) => {
      toast({ title: "Request failed", description: error.message, variant: "destructive" });
    },
  });
}

export function useMyRequests() {
  return useQuery({
    queryKey: [api.requests.mine.path],
    queryFn: async (): Promise<TransplantRequest[]> => {
      const response = await fetch(api.requests.mine.path, { credentials: "include" });
      if (!response.ok) {
        throw new Error("Failed to load requests");
      }
      return api.requests.mine.responses[200].parse(await response.json());
    },
    refetchInterval: 5000,
  });
}

export function useIncomingRequests(enabled = true) {
  return useQuery({
    queryKey: [api.requests.incoming.path],
    queryFn: async (): Promise<TransplantRequest[]> => {
      const response = await fetch(api.requests.incoming.path, { credentials: "include" });
      if (!response.ok) {
        throw new Error("Failed to load incoming requests");
      }
      return api.requests.incoming.responses[200].parse(await response.json());
    },
    enabled,
    refetchInterval: enabled ? 5000 : false,
  });
}

export function useUpdateRequestStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: { requestId: string; status: "ACCEPTED" | "REJECTED" }): Promise<TransplantRequest> => {
      const response = await fetch(buildUrl(api.requests.updateStatus.path, { requestId: input.requestId }), {
        method: api.requests.updateStatus.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(api.requests.updateStatus.input.parse({ status: input.status })),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await parseJsonError(response);
        throw new Error(error.message || "Unable to update status");
      }

      return api.requests.updateStatus.responses[200].parse(await response.json());
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: [api.requests.incoming.path] });
      await queryClient.invalidateQueries({ queryKey: [api.requests.mine.path] });
      await queryClient.invalidateQueries({ queryKey: [api.hospitals.availabilityList.path] });
      toast({
        title: `Request ${variables.status.toLowerCase()}`,
        description: "The patient dashboard will reflect this update shortly.",
      });
    },
    onError: (error) => {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    },
  });
}
